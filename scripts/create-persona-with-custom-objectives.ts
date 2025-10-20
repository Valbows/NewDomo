#!/usr/bin/env tsx
/**
 * Create New Persona with Custom Objectives Integration
 * This script creates a fresh persona that includes:
 * - System Prompt
 * - Guardrails  
 * - Default Objectives (fallback)
 * - Custom Objectives (active ones)
 */

import * as fs from 'fs';
import * as path from 'path';

const DEMO_ID = 'bbd9ffac-f4b7-4df3-9b8a-a01748c9a44b';
const TAVUS_API_KEY = process.env.TAVUS_API_KEY;
const GUARDRAILS_ID = 'g178c7c5e032b';
const DEFAULT_OBJECTIVES_ID = 'o4f2d4eb9b217';

if (!TAVUS_API_KEY) {
  console.error('❌ TAVUS_API_KEY not found in environment');
  process.exit(1);
}

async function getActiveCustomObjectives() {
  try {
    console.log('🎯 Fetching active custom objectives...');
    const response = await fetch(`http://localhost:3000/api/test-custom-objectives-backend`);
    
    if (!response.ok) {
      console.log('⚠️  No custom objectives API available, will use defaults');
      return null;
    }

    const data = await response.json();
    
    if (data.success && data.activeObjective) {
      console.log(`✅ Found active custom objective: ${data.activeObjective.name}`);
      return data.activeObjective;
    } else {
      console.log('⚠️  No active custom objectives found');
      return null;
    }
  } catch (error) {
    console.log('⚠️  Error fetching custom objectives, will use defaults');
    return null;
  }
}

async function buildEnhancedSystemPrompt(activeCustomObjective: any = null) {
  console.log('📝 Building enhanced system prompt...');
  
  // Read base system prompt
  const promptPath = path.join(process.cwd(), 'src', 'lib', 'tavus', 'system_prompt.md');
  const baseSystemPrompt = fs.readFileSync(promptPath, 'utf-8');
  
  // Identity section
  const identitySection = `\n\n## AGENT PROFILE\n- Name: Domo\n- Personality: Friendly and professional AI sales engineer with deep product knowledge\n- Initial Greeting: Hello! I'm Domo, your AI sales engineer. How can I help you with the demo today?\n`;

  // Objectives section - prioritize custom objectives
  let objectivesSection = '';
  
  if (activeCustomObjective && activeCustomObjective.steps > 0) {
    console.log(`📋 Using custom objectives: ${activeCustomObjective.name}`);
    objectivesSection = `\n\n## DEMO OBJECTIVES (${activeCustomObjective.name})\n`;
    objectivesSection += `${activeCustomObjective.description ? activeCustomObjective.description + '\n\n' : ''}`;
    objectivesSection += 'Follow these structured objectives throughout the conversation:\n\n';
    
    // Note: We'll get the detailed steps from the backend test
    objectivesSection += `This persona uses custom objectives with ${activeCustomObjective.steps} structured steps.\n`;
    objectivesSection += `The objectives are dynamically loaded and include greeting, qualification, demo, and CTA phases.\n`;
  } else {
    console.log('📋 Using default objectives structure');
    objectivesSection = `\n\n## DEMO OBJECTIVES\nFollow these objectives throughout the conversation. Weave them naturally into dialog and video choices.\n- (1) Welcome users and understand their needs\n- (2) Show relevant product features and videos\n- (3) Answer questions using knowledge base\n- (4) Guide toward appropriate next steps\n- (5) Capture contact information when appropriate\n`;
  }

  // Language handling guidance
  const languageSection = `\n\n## LANGUAGE HANDLING\n- Automatically detect the user's language from their utterances and respond in that language.\n- Keep all tool calls and their arguments (function names, video titles) EXACT and un-translated.\n- Do not ask the user to choose a language; infer it from context and switch seamlessly while honoring all guardrails.\n`;

  // Guardrails section
  const guardrailsSection = `\n\n## GUARDRAILS (Critical)\nThese guardrails are enforced via Tavus Guardrails ID: ${GUARDRAILS_ID}\n- Stay focused on product demonstrations and related topics\n- Do not discuss personal, political, or controversial subjects\n- Maintain professional demeanor at all times\n- Redirect off-topic conversations back to the demo\n- Protect confidential information and trade secrets\n`;

  const enhancedPrompt = baseSystemPrompt + identitySection + objectivesSection + languageSection + guardrailsSection;
  
  console.log(`✅ Enhanced system prompt built (${enhancedPrompt.length} characters)`);
  return enhancedPrompt;
}

async function createPersonaWithCustomObjectives() {
  console.log('🎭 CREATING PERSONA WITH CUSTOM OBJECTIVES');
  console.log('='.repeat(60));
  
  try {
    // Step 1: Get active custom objectives
    const activeCustomObjective = await getActiveCustomObjectives();
    
    // Step 2: Build enhanced system prompt
    const systemPrompt = await buildEnhancedSystemPrompt(activeCustomObjective);
    
    // Step 3: Create persona payload
    const personaName = activeCustomObjective 
      ? `Domo AI - ${activeCustomObjective.name}`
      : 'Domo AI - Default Demo Agent';
      
    const personaPayload = {
      persona_name: personaName,
      system_prompt: systemPrompt,
      ...(GUARDRAILS_ID ? { guardrails_id: GUARDRAILS_ID } : {}),
      ...(activeCustomObjective?.tavus_objectives_id 
        ? { objectives_id: activeCustomObjective.tavus_objectives_id }
        : { objectives_id: DEFAULT_OBJECTIVES_ID }
      ),
      context_type: 'text',
      layers: {
        vqa: 'off',
        meta_tts: 'off',
        meta_llm: 'off'
      }
    };

    console.log('\n🚀 Creating persona with Tavus API...');
    console.log(`   Name: ${personaName}`);
    console.log(`   Guardrails ID: ${GUARDRAILS_ID}`);
    console.log(`   Objectives ID: ${personaPayload.objectives_id}`);
    console.log(`   System Prompt Length: ${systemPrompt.length} chars`);

    // Step 4: Create persona via Tavus API
    const response = await fetch('https://tavusapi.com/v2/personas', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': TAVUS_API_KEY,
      },
      body: JSON.stringify(personaPayload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Tavus API Error:', response.status, errorText);
      return null;
    }

    const persona = await response.json();
    console.log('\n✅ Persona created successfully!');
    console.log(`   Persona ID: ${persona.persona_id}`);
    console.log(`   Name: ${persona.persona_name}`);
    console.log(`   Created: ${persona.created_at}`);

    // Step 5: Update environment and demo configuration
    console.log('\n🔧 Updating configuration...');
    
    // Update .env.local
    const envPath = path.join(process.cwd(), '.env.local');
    let envContent = fs.readFileSync(envPath, 'utf-8');
    
    // Update or add the new persona ID
    if (envContent.includes('COMPLETE_PERSONA_ID=')) {
      envContent = envContent.replace(/COMPLETE_PERSONA_ID=.*/g, `COMPLETE_PERSONA_ID=${persona.persona_id}`);
    } else {
      envContent += `\nCOMPLETE_PERSONA_ID=${persona.persona_id}`;
    }
    
    fs.writeFileSync(envPath, envContent);
    console.log('✅ Updated .env.local with new persona ID');

    // Step 6: Update demo in database
    console.log('\n📊 Updating demo configuration...');
    try {
      const updateResponse = await fetch(`http://localhost:3000/api/demos/${DEMO_ID}/update-persona`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tavus_persona_id: persona.persona_id
        }),
      });

      if (updateResponse.ok) {
        console.log('✅ Demo updated with new persona ID');
      } else {
        console.log('⚠️  Could not update demo automatically - update manually in UI');
      }
    } catch (error) {
      console.log('⚠️  Could not update demo automatically - update manually in UI');
    }

    // Step 7: Summary
    console.log('\n' + '='.repeat(60));
    console.log('🎉 SUCCESS! New Persona Created');
    console.log('='.repeat(60));
    console.log(`Persona ID: ${persona.persona_id}`);
    console.log(`Name: ${personaName}`);
    console.log(`Guardrails: ${GUARDRAILS_ID}`);
    console.log(`Objectives: ${personaPayload.objectives_id}`);
    
    if (activeCustomObjective) {
      console.log(`Custom Objectives: ${activeCustomObjective.name} (${activeCustomObjective.steps} steps)`);
    } else {
      console.log('Custom Objectives: Using defaults');
    }

    console.log('\n🚀 Next Steps:');
    console.log('1. Restart your dev server to pick up new environment variables');
    console.log('2. Go to your demo Agent Settings');
    console.log('3. Create a new agent (it will use the new persona)');
    console.log('4. Start a conversation to test your custom objectives!');

    if (activeCustomObjective) {
      console.log('\n🎯 Expected Behavior:');
      console.log('Agent should start with: "Hi I\'m Domo, your AI sales engineer..."');
      console.log('And follow your 4-step Workday demo flow!');
    }

    return persona.persona_id;

  } catch (error) {
    console.error('❌ Error creating persona:', error);
    return null;
  }
}

if (require.main === module) {
  createPersonaWithCustomObjectives();
}