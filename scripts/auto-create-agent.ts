#!/usr/bin/env tsx
/**
 * Automatically Create Agent with Custom Objectives
 * This script creates an agent by directly calling the create-agent API logic
 */

import { createClient } from '@/utils/supabase/server';

const DEMO_ID = 'bbd9ffac-f4b7-4df3-9b8a-a01748c9a44b';

async function autoCreateAgent() {
  console.log('🤖 AUTO-CREATING AGENT WITH CUSTOM OBJECTIVES');
  console.log('='.repeat(60));
  console.log(`Demo ID: ${DEMO_ID}\n`);

  try {
    // Step 1: Check custom objectives first
    console.log('🎯 Step 1: Checking Custom Objectives...');
    
    // Import the custom objectives function directly
    const { getActiveCustomObjective } = await import('@/lib/supabase/custom-objectives');
    const activeCustomObjective = await getActiveCustomObjective(DEMO_ID);
    
    if (activeCustomObjective) {
      console.log(`✅ Active custom objective: ${activeCustomObjective.name}`);
      console.log(`   Steps: ${activeCustomObjective.objectives.length}`);
      console.log(`   Tavus ID: ${activeCustomObjective.tavus_objectives_id}`);
    } else {
      console.log('⚠️  No active custom objectives found');
    }

    // Step 2: Simulate the create-agent API logic
    console.log('\n🚀 Step 2: Creating Agent...');
    
    // Import required modules
    const { v4: uuidv4 } = await import('uuid');
    const fs = await import('fs');
    const path = await import('path');

    // Agent configuration
    const agentName = 'Domo';
    const agentPersonality = 'Friendly and professional AI sales engineer with deep product knowledge';
    const agentGreeting = 'Hello! I\'m Domo, your AI sales engineer. How can I help you with the demo today?';

    // Build system prompt (simplified version of create-agent logic)
    const promptPath = path.join(process.cwd(), 'src', 'lib', 'tavus', 'system_prompt.md');
    const baseSystemPrompt = fs.readFileSync(promptPath, 'utf-8');
    
    // Identity section
    const identitySection = `\n\n## AGENT PROFILE\n- Name: ${agentName}\n- Personality: ${agentPersonality}\n- Initial Greeting: ${agentGreeting}\n`;

    // Objectives section - prioritize custom objectives
    let objectivesSection = '';
    
    if (activeCustomObjective && activeCustomObjective.objectives.length > 0) {
      console.log(`📋 Using custom objectives: ${activeCustomObjective.name}`);
      objectivesSection = `\n\n## DEMO OBJECTIVES (${activeCustomObjective.name})\n`;
      objectivesSection += `${activeCustomObjective.description ? activeCustomObjective.description + '\n\n' : ''}`;
      objectivesSection += 'Follow these structured objectives throughout the conversation:\n\n';
      
      activeCustomObjective.objectives.forEach((obj, i) => {
        objectivesSection += `### ${i + 1}. ${obj.objective_name}\n`;
        objectivesSection += `**Objective:** ${obj.objective_prompt}\n`;
        objectivesSection += `**Mode:** ${obj.confirmation_mode} confirmation, ${obj.modality} modality\n`;
        if (obj.output_variables && obj.output_variables.length > 0) {
          objectivesSection += `**Capture:** ${obj.output_variables.join(', ')}\n`;
        }
        objectivesSection += '\n';
      });
    } else {
      console.log('📋 Using default objectives');
      objectivesSection = `\n\n## DEMO OBJECTIVES\nFollow these objectives throughout the conversation:\n- Welcome users and understand their needs\n- Show relevant product features and videos\n- Answer questions using knowledge base\n- Guide toward appropriate next steps\n- Capture contact information when appropriate\n`;
    }

    // Language handling
    const languageSection = `\n\n## LANGUAGE HANDLING\n- Automatically detect the user's language and respond accordingly\n- Keep tool calls exact and un-translated\n- Switch languages seamlessly while honoring guardrails\n`;

    const enhancedSystemPrompt = baseSystemPrompt + identitySection + objectivesSection + languageSection;

    console.log(`✅ System prompt built (${enhancedSystemPrompt.length} characters)`);

    // Step 3: Create persona via Tavus API
    console.log('\n🎭 Step 3: Creating Persona...');
    
    const TAVUS_API_KEY = process.env.TAVUS_API_KEY || '9e3a9a6a54e44edaa2e456191ba0d0f3';
    const GUARDRAILS_ID = 'g178c7c5e032b';
    
    const personaPayload = {
      persona_name: `Domo AI - ${activeCustomObjective?.name || 'Default Demo'}`,
      system_prompt: enhancedSystemPrompt,
      guardrails_id: GUARDRAILS_ID,
      ...(activeCustomObjective?.tavus_objectives_id 
        ? { objectives_id: activeCustomObjective.tavus_objectives_id }
        : { objectives_id: 'o4f2d4eb9b217' }
      ),
      context_type: 'text',
      layers: {
        vqa: 'off',
        meta_tts: 'off', 
        meta_llm: 'off'
      }
    };

    console.log(`   Persona Name: ${personaPayload.persona_name}`);
    console.log(`   Guardrails ID: ${GUARDRAILS_ID}`);
    console.log(`   Objectives ID: ${personaPayload.objectives_id}`);

    const personaResponse = await fetch('https://tavusapi.com/v2/personas', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': TAVUS_API_KEY,
      },
      body: JSON.stringify(personaPayload),
    });

    if (!personaResponse.ok) {
      const errorText = await personaResponse.text();
      console.error('❌ Persona creation failed:', personaResponse.status, errorText);
      return;
    }

    const persona = await personaResponse.json();
    console.log(`✅ Persona created: ${persona.persona_id}`);

    // Step 4: Update demo with new persona
    console.log('\n📊 Step 4: Updating Demo...');
    
    const supabase = createClient();
    const { error: updateError } = await supabase
      .from('demos')
      .update({ 
        tavus_persona_id: persona.persona_id,
        agent_name: agentName,
        agent_personality: agentPersonality,
        agent_greeting: agentGreeting
      })
      .eq('id', DEMO_ID);

    if (updateError) {
      console.error('❌ Demo update failed:', updateError);
      return;
    }

    console.log('✅ Demo updated with new agent');

    // Step 5: Summary
    console.log('\n' + '='.repeat(60));
    console.log('🎉 SUCCESS! Agent Created Automatically');
    console.log('='.repeat(60));
    console.log(`Demo ID: ${DEMO_ID}`);
    console.log(`Persona ID: ${persona.persona_id}`);
    console.log(`Agent Name: ${agentName}`);
    
    if (activeCustomObjective) {
      console.log(`Custom Objectives: ${activeCustomObjective.name} (${activeCustomObjective.objectives.length} steps)`);
      console.log(`Objectives ID: ${activeCustomObjective.tavus_objectives_id}`);
    } else {
      console.log('Objectives: Default demo objectives');
    }

    console.log('\n🚀 Test Your Agent:');
    console.log(`   Go to: /demos/${DEMO_ID}/experience`);
    console.log('   Start a conversation');
    
    if (activeCustomObjective) {
      console.log('   Expected: "Hi I\'m Domo, your AI sales engineer..."');
      console.log('   Flow: 4-step Workday demo process');
    }

    return {
      success: true,
      personaId: persona.persona_id,
      demoId: DEMO_ID,
      customObjectives: !!activeCustomObjective
    };

  } catch (error) {
    console.error('❌ Error creating agent:', error);
    return { success: false, error: error.message };
  }
}

if (require.main === module) {
  autoCreateAgent();
}