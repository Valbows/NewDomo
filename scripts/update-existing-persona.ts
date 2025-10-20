#!/usr/bin/env tsx
/**
 * Update Existing Persona with Custom Objectives
 * Instead of creating a new persona, update the existing one
 */

import * as fs from 'fs';
import * as path from 'path';

const DEMO_ID = 'bbd9ffac-f4b7-4df3-9b8a-a01748c9a44b';
const EXISTING_PERSONA_ID = 'pe9ed46b7319';
const TAVUS_API_KEY = '9e3a9a6a54e44edaa2e456191ba0d0f3';
const GUARDRAILS_ID = 'g178c7c5e032b';

async function getActiveCustomObjectives() {
  try {
    console.log('🎯 Fetching active custom objectives...');
    const response = await fetch(`http://localhost:3000/api/test-custom-objectives-backend`);
    
    if (!response.ok) {
      console.log('⚠️  No custom objectives API available');
      return null;
    }

    const data = await response.json();
    
    if (data.success && data.activeObjective) {
      console.log(`✅ Found active custom objective: ${data.activeObjective.name}`);
      console.log(`   Tavus Objectives ID: ${data.activeObjective.tavus_objectives_id}`);
      return data.activeObjective;
    } else {
      console.log('⚠️  No active custom objectives found');
      return null;
    }
  } catch (error) {
    console.log('⚠️  Error fetching custom objectives:', error);
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
  
  if (activeCustomObjective) {
    console.log(`📋 Using custom objectives: ${activeCustomObjective.name}`);
    objectivesSection = `\n\n## DEMO OBJECTIVES (${activeCustomObjective.name})\n`;
    objectivesSection += `${activeCustomObjective.description ? activeCustomObjective.description + '\n\n' : ''}`;
    objectivesSection += 'Follow these structured objectives throughout the conversation:\n\n';
    objectivesSection += '1. **Greeting & Qualification**: Hi I\'m Domo, your AI sales engineer. Can I confirm your first name, last name, email address, and position at your company?\n';
    objectivesSection += '2. **Product Interest**: What interests you most about our product Workday? Keep follow-up questions brief and to the point.\n';
    objectivesSection += '3. **Demo Showcase**: Is there one demo video of our platform that you would like to see most? Show maximum 2 videos, keep follow-ups brief, then move to CTA.\n';
    objectivesSection += '4. **Call to Action**: Would you like to start a free trial? Show free trial banner, say goodbye and end video.\n\n';
  } else {
    console.log('📋 Using default objectives structure');
    objectivesSection = `\n\n## DEMO OBJECTIVES\nFollow these objectives throughout the conversation:\n- Welcome users and understand their needs\n- Show relevant product features and videos\n- Answer questions using knowledge base\n- Guide toward appropriate next steps\n- Capture contact information when appropriate\n`;
  }

  // Language handling guidance
  const languageSection = `\n\n## LANGUAGE HANDLING\n- Automatically detect the user's language and respond accordingly\n- Keep tool calls exact and un-translated\n- Switch languages seamlessly while honoring guardrails\n`;

  const enhancedPrompt = baseSystemPrompt + identitySection + objectivesSection + languageSection;
  
  console.log(`✅ Enhanced system prompt built (${enhancedPrompt.length} characters)`);
  return enhancedPrompt;
}

async function updatePersonaWithCustomObjectives() {
  console.log('🔄 UPDATING PERSONA WITH CUSTOM OBJECTIVES');
  console.log('='.repeat(60));
  
  try {
    // Step 1: Get active custom objectives
    const activeCustomObjective = await getActiveCustomObjectives();
    
    // Step 2: Build enhanced system prompt
    const systemPrompt = await buildEnhancedSystemPrompt(activeCustomObjective);
    
    // Step 3: Update persona payload
    const updatePayload = {
      system_prompt: systemPrompt,
      ...(activeCustomObjective?.tavus_objectives_id 
        ? { objectives_id: activeCustomObjective.tavus_objectives_id }
        : {}),
    };

    console.log('\n🚀 Updating persona with Tavus API...');
    console.log(`   Persona ID: ${EXISTING_PERSONA_ID}`);
    console.log(`   System Prompt Length: ${systemPrompt.length} chars`);
    
    if (activeCustomObjective?.tavus_objectives_id) {
      console.log(`   New Objectives ID: ${activeCustomObjective.tavus_objectives_id}`);
    }

    // Step 4: Update persona via Tavus API
    const response = await fetch(`https://tavusapi.com/v2/personas/${EXISTING_PERSONA_ID}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': TAVUS_API_KEY,
      },
      body: JSON.stringify(updatePayload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Tavus API Error:', response.status, errorText);
      
      // If update fails, let's try to get the current persona info
      console.log('\n🔍 Checking current persona...');
      const getResponse = await fetch(`https://tavusapi.com/v2/personas/${EXISTING_PERSONA_ID}`, {
        method: 'GET',
        headers: {
          'x-api-key': TAVUS_API_KEY,
        },
      });
      
      if (getResponse.ok) {
        const currentPersona = await getResponse.json();
        console.log('✅ Current persona exists:');
        console.log(`   Name: ${currentPersona.persona_name}`);
        console.log(`   Guardrails ID: ${currentPersona.guardrails_id || 'None'}`);
        console.log(`   Objectives ID: ${currentPersona.objectives_id || 'None'}`);
      }
      
      return null;
    }

    const updatedPersona = await response.json();
    console.log('\n✅ Persona updated successfully!');
    console.log(`   Persona ID: ${updatedPersona.persona_id}`);
    console.log(`   Updated: ${updatedPersona.updated_at}`);

    // Step 5: Summary
    console.log('\n' + '='.repeat(60));
    console.log('🎉 SUCCESS! Persona Updated');
    console.log('='.repeat(60));
    console.log(`Persona ID: ${EXISTING_PERSONA_ID}`);
    console.log(`Guardrails: ${GUARDRAILS_ID}`);
    
    if (activeCustomObjective) {
      console.log(`Custom Objectives: ${activeCustomObjective.name} (${activeCustomObjective.steps} steps)`);
      console.log(`Objectives ID: ${activeCustomObjective.tavus_objectives_id}`);
    } else {
      console.log('Custom Objectives: Using defaults in system prompt');
    }

    console.log('\n🚀 Next Steps:');
    console.log('1. Go to your demo Agent Settings');
    console.log('2. Delete the current agent (if exists)');
    console.log('3. Create a new agent (it will use the updated persona)');
    console.log('4. Start a conversation to test your custom objectives!');

    if (activeCustomObjective) {
      console.log('\n🎯 Expected Behavior:');
      console.log('Agent should start with: "Hi I\'m Domo, your AI sales engineer..."');
      console.log('And follow your 4-step Workday demo flow!');
    }

    return EXISTING_PERSONA_ID;

  } catch (error) {
    console.error('❌ Error updating persona:', error);
    return null;
  }
}

if (require.main === module) {
  updatePersonaWithCustomObjectives();
}