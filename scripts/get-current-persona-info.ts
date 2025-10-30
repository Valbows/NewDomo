#!/usr/bin/env tsx
/**
 * Get Current Persona Information
 */

const DEMO_ID = 'bbd9ffac-f4b7-4df3-9b8a-a01748c9a44b';
const TAVUS_API_KEY = '9e3a9a6a54e44edaa2e456191ba0d0f3';

async function getCurrentPersonaInfo() {
  console.log('🎭 GETTING CURRENT PERSONA INFORMATION');
  console.log('='.repeat(60));
  console.log(`Demo ID: ${DEMO_ID}\n`);

  try {
    // Step 1: Get demo configuration
    console.log('📊 Step 1: Getting Demo Configuration...');
    const demoResponse = await fetch(`http://localhost:3000/api/admin/debug/conversation-data?demoId=${DEMO_ID}`);
    
    if (!demoResponse.ok) {
      console.error('❌ Failed to get demo data:', demoResponse.status);
      return;
    }

    const demoData = await demoResponse.json();
    const demo = demoData.demo;

    if (!demo) {
      console.error('❌ No demo data found');
      return;
    }

    console.log(`✅ Demo: ${demo.name}`);
    console.log(`   Persona ID: ${demo.tavus_persona_id}`);
    console.log(`   Agent Name: ${demo.agent_name}`);
    console.log(`   Agent Personality: ${demo.agent_personality || 'Not set'}`);
    console.log(`   Agent Greeting: ${demo.agent_greeting || 'Not set'}`);

    // Step 2: Get persona details from Tavus API
    if (demo.tavus_persona_id) {
      console.log('\n🎭 Step 2: Getting Persona Details from Tavus...');
      
      const personaResponse = await fetch(`https://tavusapi.com/v2/personas/${demo.tavus_persona_id}`, {
        method: 'GET',
        headers: {
          'x-api-key': TAVUS_API_KEY,
        },
      });

      if (!personaResponse.ok) {
        const errorText = await personaResponse.text();
        console.error('❌ Failed to get persona from Tavus:', personaResponse.status, errorText);
      } else {
        const persona = await personaResponse.json();
        
        console.log(`✅ Persona Details:`);
        console.log(`   ID: ${persona.persona_id}`);
        console.log(`   Name: ${persona.persona_name}`);
        console.log(`   Guardrails ID: ${persona.guardrails_id || 'None'}`);
        console.log(`   Objectives ID: ${persona.objectives_id || 'None'}`);
        console.log(`   Context Type: ${persona.context_type || 'Not set'}`);
        console.log(`   Created: ${persona.created_at}`);
        console.log(`   Updated: ${persona.updated_at || 'Never'}`);
        
        if (persona.system_prompt) {
          console.log(`   System Prompt Length: ${persona.system_prompt.length} characters`);
          
          // Show first 200 characters of system prompt
          console.log(`   System Prompt Preview: "${persona.system_prompt.substring(0, 200)}..."`);
          
          // Check for key sections
          const hasAgentProfile = persona.system_prompt.includes('## AGENT PROFILE');
          const hasObjectives = persona.system_prompt.includes('## DEMO OBJECTIVES');
          const hasGuardrails = persona.system_prompt.includes('## GUARDRAILS');
          const hasCustomObjectives = persona.system_prompt.includes('Workday Sales Demo Flow');
          
          console.log(`\n📋 System Prompt Sections:`);
          console.log(`   ${hasAgentProfile ? '✅' : '❌'} Agent Profile`);
          console.log(`   ${hasObjectives ? '✅' : '❌'} Demo Objectives`);
          console.log(`   ${hasGuardrails ? '✅' : '❌'} Guardrails`);
          console.log(`   ${hasCustomObjectives ? '✅' : '❌'} Custom Objectives (Workday)`);
        }

        // Step 3: Get custom objectives info
        console.log('\n🎯 Step 3: Getting Custom Objectives Info...');
        const objResponse = await fetch(`http://localhost:3000/api/admin/test/custom-objectives-backend`);
        
        if (objResponse.ok) {
          const objData = await objResponse.json();
          
          if (objData.success && objData.activeObjective) {
            console.log(`✅ Active Custom Objective: ${objData.activeObjective.name}`);
            console.log(`   Steps: ${objData.activeObjective.steps}`);
            console.log(`   Tavus ID: ${objData.activeObjective.tavus_objectives_id}`);
            console.log(`   Description: ${objData.activeObjective.description}`);
            
            // Check if persona objectives ID matches custom objectives
            const objectivesMatch = persona.objectives_id === objData.activeObjective.tavus_objectives_id;
            console.log(`   Matches Persona: ${objectivesMatch ? '✅' : '❌'}`);
            
            if (objectivesMatch) {
              console.log('\n📝 Custom Objective Steps:');
              objData.objectiveSteps.forEach((step: any) => {
                console.log(`   ${step.step}. ${step.name}`);
                console.log(`      "${step.prompt}"`);
                console.log(`      Mode: ${step.mode}, Variables: ${step.variables.join(', ')}`);
              });
            }
          } else {
            console.log('📋 No active custom objectives found');
          }
        }

        // Step 4: Summary
        console.log('\n' + '='.repeat(60));
        console.log('📊 PERSONA SUMMARY');
        console.log('='.repeat(60));
        console.log(`Persona ID: ${persona.persona_id}`);
        console.log(`Name: ${persona.persona_name}`);
        console.log(`Guardrails: ${persona.guardrails_id || 'None'}`);
        console.log(`Objectives: ${persona.objectives_id || 'None'}`);
        console.log(`System Prompt: ${persona.system_prompt ? `${persona.system_prompt.length} chars` : 'None'}`);
        
        const objData = await (await fetch(`http://localhost:3000/api/admin/test/custom-objectives-backend`)).json();
        if (objData.success && objData.activeObjective) {
          console.log(`Custom Objectives: ${objData.activeObjective.name} (${objData.activeObjective.steps} steps)`);
        }

        console.log('\n🎯 Expected Agent Behavior:');
        if (objData.success && objData.activeObjective && objData.validation.isWorkdayDemo) {
          console.log('   First Message: "Hi I\'m Domo, your AI sales engineer. Can I confirm your first name, last name, email address, and position at your company?"');
          console.log('   Flow: 4-step Workday demo process');
        } else {
          console.log('   First Message: Standard greeting');
          console.log('   Flow: Default objectives');
        }

        return {
          persona,
          demo,
          customObjectives: objData.success ? objData.activeObjective : null
        };
      }
    } else {
      console.log('❌ No persona ID found in demo configuration');
    }

  } catch (error) {
    console.error('❌ Error getting persona info:', error);
  }
}

if (require.main === module) {
  getCurrentPersonaInfo();
}