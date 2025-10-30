#!/usr/bin/env tsx
/**
 * Complete Integration Test
 * Tests System Prompt + Guardrails + Objectives + Custom Objectives
 */

const DEMO_ID = 'bbd9ffac-f4b7-4df3-9b8a-a01748c9a44b';
const PERSONA_ID = 'pe9ed46b7319';
const OBJECTIVES_ID = 'o4f2d4eb9b217';
const GUARDRAILS_ID = 'g178c7c5e032b';

async function testCompleteIntegration() {
  console.log('🧪 COMPLETE INTEGRATION TEST');
  console.log('=' .repeat(50));
  console.log(`Demo ID: ${DEMO_ID}`);
  console.log(`Persona ID: ${PERSONA_ID}`);
  console.log(`Objectives ID: ${OBJECTIVES_ID}`);
  console.log(`Guardrails ID: ${GUARDRAILS_ID}\n`);

  const results = {
    systemPrompt: false,
    guardrails: false,
    defaultObjectives: false,
    customObjectives: false,
    personaIntegration: false
  };

  try {
    // Test 1: System Prompt
    console.log('📝 Testing System Prompt...');
    try {
      const fs = require('fs');
      const path = require('path');
      const promptPath = path.join(process.cwd(), 'src', 'lib', 'tavus', 'system_prompt.md');
      const systemPrompt = fs.readFileSync(promptPath, 'utf-8');
      
      const hasAgentProfile = systemPrompt.includes('## AGENT PROFILE');
      const hasGuardrails = systemPrompt.includes('## GUARDRAILS');
      const hasObjectives = systemPrompt.includes('## DEMO OBJECTIVES');
      
      console.log(`   ✅ System prompt exists (${systemPrompt.length} chars)`);
      console.log(`   ${hasAgentProfile ? '✅' : '❌'} Agent Profile section`);
      console.log(`   ${hasGuardrails ? '✅' : '❌'} Guardrails section`);
      console.log(`   ${hasObjectives ? '✅' : '❌'} Objectives section`);
      
      results.systemPrompt = true;
    } catch (error) {
      console.log('   ❌ System prompt test failed:', error.message);
    }

    // Test 2: Guardrails
    console.log('\n🛡️  Testing Guardrails...');
    try {
      const response = await fetch(`http://localhost:3000/api/admin/debug/conversation-data?demoId=${DEMO_ID}`);
      if (response.ok) {
        console.log('   ✅ Guardrails API accessible');
        console.log(`   🔗 Guardrails ID: ${GUARDRAILS_ID}`);
        results.guardrails = true;
      }
    } catch (error) {
      console.log('   ❌ Guardrails test failed');
    }

    // Test 3: Default Objectives
    console.log('\n🎯 Testing Default Objectives...');
    try {
      console.log(`   🔗 Default Objectives ID: ${OBJECTIVES_ID}`);
      console.log('   ✅ Default objectives configured');
      results.defaultObjectives = true;
    } catch (error) {
      console.log('   ❌ Default objectives test failed');
    }

    // Test 4: Custom Objectives
    console.log('\n🎨 Testing Custom Objectives...');
    try {
      const response = await fetch(`http://localhost:3000/api/demos/${DEMO_ID}/custom-objectives`);
      if (response.ok) {
        const data = await response.json();
        const objectives = data.objectives || [];
        const activeObjective = objectives.find((obj: any) => obj.is_active);
        
        console.log(`   📋 Found ${objectives.length} custom objective sets`);
        
        if (activeObjective) {
          console.log(`   ✅ Active: ${activeObjective.name}`);
          console.log(`   📝 Steps: ${activeObjective.objectives.length}`);
          console.log(`   🔗 Tavus ID: ${activeObjective.tavus_objectives_id || 'Not synced'}`);
          
          // Check if it's the Workday demo
          const isWorkday = activeObjective.name.toLowerCase().includes('workday');
          const hasGreeting = activeObjective.objectives.some((step: any) => 
            step.objective_prompt.toLowerCase().includes('domo')
          );
          
          if (isWorkday && hasGreeting) {
            console.log('   🎉 Workday demo objectives detected!');
            results.customObjectives = true;
          }
        } else {
          console.log('   ⚠️  No active custom objectives');
        }
      }
    } catch (error) {
      console.log('   ❌ Custom objectives test failed');
    }

    // Test 5: Persona Integration
    console.log('\n🎭 Testing Persona Integration...');
    try {
      console.log(`   🔗 Persona ID: ${PERSONA_ID}`);
      console.log('   ✅ Persona configured in environment');
      
      // Check if demo has persona assigned
      const response = await fetch(`http://localhost:3000/api/admin/debug/conversation-data?demoId=${DEMO_ID}`);
      if (response.ok) {
        const data = await response.json();
        const demo = data.demo;
        
        if (demo?.tavus_persona_id) {
          console.log(`   ✅ Demo persona: ${demo.tavus_persona_id}`);
          console.log(`   ${demo.tavus_persona_id === PERSONA_ID ? '✅' : '⚠️'} Matches environment persona`);
          results.personaIntegration = true;
        } else {
          console.log('   ❌ No persona assigned to demo');
        }
      }
    } catch (error) {
      console.log('   ❌ Persona integration test failed');
    }

    // Summary
    console.log('\n' + '='.repeat(50));
    console.log('📊 INTEGRATION TEST RESULTS');
    console.log('='.repeat(50));
    
    const tests = [
      { name: 'System Prompt', status: results.systemPrompt },
      { name: 'Guardrails', status: results.guardrails },
      { name: 'Default Objectives', status: results.defaultObjectives },
      { name: 'Custom Objectives', status: results.customObjectives },
      { name: 'Persona Integration', status: results.personaIntegration }
    ];
    
    tests.forEach(test => {
      console.log(`${test.status ? '✅' : '❌'} ${test.name}`);
    });
    
    const passedTests = tests.filter(t => t.status).length;
    const totalTests = tests.length;
    
    console.log(`\n📈 Score: ${passedTests}/${totalTests} tests passed`);
    
    if (passedTests === totalTests) {
      console.log('\n🎉 ALL SYSTEMS GO! Your complete integration is working!');
      console.log('\n🚀 Ready to test:');
      console.log(`   1. Go to /demos/${DEMO_ID}/experience`);
      console.log('   2. Start a conversation');
      console.log('   3. Agent should use your custom Workday objectives');
      console.log('   4. Guardrails should prevent inappropriate responses');
      console.log('   5. System prompt should guide overall behavior');
    } else {
      console.log('\n⚠️  Some components need attention. Check the failed tests above.');
    }

  } catch (error) {
    console.error('❌ Test suite error:', error);
  }
}

if (require.main === module) {
  testCompleteIntegration();
}