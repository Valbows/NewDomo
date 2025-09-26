#!/usr/bin/env npx tsx
/**
 * Test script to check persona guardrails and objectives configuration
 */

const DEMO_ID = 'bbd9ffac-f4b7-4df3-9b8a-a01748c9a44b'; // From your logs
const BASE_URL = 'http://localhost:3000';

async function testPersonaConfiguration() {
  console.log('🧪 Testing Persona Configuration');
  console.log('='.repeat(50));
  console.log(`Demo ID: ${DEMO_ID}`);
  console.log('');

  // Test 1: Verify Agent Objectives
  console.log('1️⃣ Testing Agent Objectives...');
  try {
    const response = await fetch(`${BASE_URL}/api/verify-agent-objectives?demoId=${DEMO_ID}`);
    const data = await response.json();
    
    if (data.success) {
      console.log('✅ Objectives Test: PASSED');
      console.log(`   Demo: ${data.verification.integration.hasDemo ? '✅' : '❌'}`);
      console.log(`   Persona: ${data.verification.integration.hasPersona ? '✅' : '❌'}`);
      console.log(`   System Prompt: ${data.verification.integration.systemPromptConfigured ? '✅' : '❌'}`);
      console.log(`   Guardrails: ${data.verification.integration.guardrailsConfigured ? '✅' : '❌'}`);
      console.log(`   Custom Objectives: ${data.verification.integration.hasActiveCustomObjectives ? '✅ Active' : '📋 Using defaults'}`);
      
      if (data.verification.persona) {
        console.log(`   Persona ID: ${data.verification.persona.id}`);
        console.log(`   Guardrails ID: ${data.verification.persona.guardrailsId || 'Not set'}`);
        console.log(`   Objectives ID: ${data.verification.persona.objectivesId || 'Not set'}`);
      }
    } else {
      console.log('❌ Objectives Test: FAILED');
      console.log(`   Error: ${data.error}`);
    }
  } catch (error) {
    console.log('❌ Objectives Test: ERROR');
    console.log(`   ${error}`);
  }

  console.log('');

  // Test 2: Check Persona Config
  console.log('2️⃣ Testing Persona Config...');
  try {
    const response = await fetch(`${BASE_URL}/api/check-persona-config?demoId=${DEMO_ID}`);
    const data = await response.json();
    
    if (data.success) {
      console.log('✅ Config Test: PASSED');
      console.log(`   Perception Analysis: ${data.analysis.perception_analysis_enabled ? '✅ Enabled (raven-0)' : '❌ Disabled'}`);
      console.log(`   Default Replica: ${data.analysis.has_default_replica ? '✅ Set' : '❌ Not Set'}`);
      console.log(`   Persona ID: ${data.analysis.persona_id}`);
      
      if (data.analysis.recommendations?.length > 0) {
        console.log('   📋 Recommendations:');
        data.analysis.recommendations.forEach((rec: string) => {
          console.log(`      • ${rec}`);
        });
      }
    } else {
      console.log('❌ Config Test: FAILED');
      console.log(`   Error: ${data.error}`);
    }
  } catch (error) {
    console.log('❌ Config Test: ERROR');
    console.log(`   ${error}`);
  }

  console.log('');

  // Test 3: Get Persona Info
  console.log('3️⃣ Testing Persona Info...');
  try {
    const response = await fetch(`${BASE_URL}/api/get-persona-info?demoId=${DEMO_ID}`);
    const data = await response.json();
    
    if (data.success) {
      console.log('✅ Info Test: PASSED');
      console.log(`   Persona Name: ${data.persona.name}`);
      console.log(`   Agent Name: ${data.persona.agentName}`);
      console.log(`   System Prompt: ${data.persona.systemPromptLength} characters`);
      console.log(`   Guardrails ID: ${data.persona.guardrailsId || 'Not configured'}`);
      console.log(`   Objectives ID: ${data.persona.objectivesId || 'Not configured'}`);
      
      console.log('   Integration Status:');
      console.log(`      System Prompt: ${data.integration.systemPrompt ? '✅' : '❌'}`);
      console.log(`      Guardrails: ${data.integration.guardrails ? '✅' : '❌'}`);
      console.log(`      Objectives: ${data.integration.objectives ? '✅' : '❌'}`);
      console.log(`      Custom Objectives: ${data.integration.customObjectivesActive ? '✅ Active' : '📋 Default'}`);
      
      if (data.customObjectives) {
        console.log(`   Custom Objectives: "${data.customObjectives.name}"`);
        console.log(`      Steps: ${data.customObjectives.steps}`);
        console.log(`      Tavus ID: ${data.customObjectives.tavusObjectivesId || 'Not synced'}`);
      }
    } else {
      console.log('❌ Info Test: FAILED');
      console.log(`   Error: ${data.error}`);
    }
  } catch (error) {
    console.log('❌ Info Test: ERROR');
    console.log(`   ${error}`);
  }

  console.log('');
  console.log('🎯 Test Complete!');
  console.log('');
  console.log('💡 To test with a different demo ID, edit the DEMO_ID constant in this script.');
  console.log('🌐 For a visual interface, visit: http://localhost:3000/test-persona');
}

// Run the test
testPersonaConfiguration().catch(console.error);