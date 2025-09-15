#!/usr/bin/env tsx
/**
 * Debug Custom Objectives Integration
 */

const DEMO_ID = 'bbd9ffac-f4b7-4df3-9b8a-a01748c9a44b';

async function debugCustomObjectives() {
  console.log('🔍 DEBUGGING CUSTOM OBJECTIVES INTEGRATION');
  console.log('='.repeat(60));
  console.log(`Demo ID: ${DEMO_ID}\n`);

  try {
    // Test 1: Check if custom objectives exist
    console.log('📋 Step 1: Checking Custom Objectives in Database...');
    const response = await fetch(`http://localhost:3000/api/demos/${DEMO_ID}/custom-objectives`);
    
    if (!response.ok) {
      console.log(`❌ API Error: ${response.status} ${response.statusText}`);
      return;
    }

    const data = await response.json();
    const objectives = data.objectives || [];
    
    console.log(`   Found ${objectives.length} objective sets`);
    
    if (objectives.length === 0) {
      console.log('❌ No custom objectives found in database!');
      console.log('💡 Create custom objectives in the Agent Settings UI first.');
      return;
    }

    // Test 2: Check active objective
    console.log('\n🎯 Step 2: Checking Active Objective...');
    const activeObjective = objectives.find((obj: any) => obj.is_active);
    
    if (!activeObjective) {
      console.log('❌ No active custom objective found!');
      console.log('💡 Available objectives (not active):');
      objectives.forEach((obj: any, i: number) => {
        console.log(`   ${i + 1}. ${obj.name} (${obj.objectives.length} steps) - INACTIVE`);
      });
      console.log('\n🔧 Solution: Activate an objective by clicking the play button in the UI');
      return;
    }

    console.log(`✅ Active objective: ${activeObjective.name}`);
    console.log(`   Description: ${activeObjective.description || 'None'}`);
    console.log(`   Steps: ${activeCustomObjective.objectives.length}`);
    console.log(`   Tavus ID: ${activeObjective.tavus_objectives_id || 'Not synced'}`);
    console.log(`   Created: ${new Date(activeObjective.created_at).toLocaleString()}`);

    // Test 3: Check objective content
    console.log('\n📝 Step 3: Checking Objective Content...');
    const hasWorkdayContent = activeObjective.name.toLowerCase().includes('workday');
    const hasDomoGreeting = activeObjective.objectives.some((step: any) => 
      step.objective_prompt.toLowerCase().includes('domo')
    );
    const hasGreetingStep = activeObjective.objectives.some((step: any) => 
      step.objective_name.includes('greeting')
    );

    console.log(`   ${hasWorkdayContent ? '✅' : '❌'} Contains "Workday" in name`);
    console.log(`   ${hasDomoGreeting ? '✅' : '❌'} Contains "Domo" greeting`);
    console.log(`   ${hasGreetingStep ? '✅' : '❌'} Has greeting step`);

    if (hasWorkdayContent && hasDomoGreeting && hasGreetingStep) {
      console.log('   🎉 Workday objectives detected correctly!');
    }

    // Test 4: Show objective steps
    console.log('\n📋 Step 4: Objective Steps Detail...');
    activeObjective.objectives.forEach((step: any, i: number) => {
      console.log(`   ${i + 1}. ${step.objective_name}`);
      console.log(`      Prompt: ${step.objective_prompt.substring(0, 80)}...`);
      console.log(`      Mode: ${step.confirmation_mode}, ${step.modality}`);
      if (step.output_variables?.length > 0) {
        console.log(`      Variables: ${step.output_variables.join(', ')}`);
      }
      console.log('');
    });

    // Test 5: Test agent creation integration
    console.log('🤖 Step 5: Testing Agent Creation Integration...');
    console.log('   This would happen when you create a new agent or start a conversation');
    console.log('   The system should use these custom objectives instead of defaults');

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 DIAGNOSIS SUMMARY');
    console.log('='.repeat(60));

    if (activeObjective && hasWorkdayContent && hasDomoGreeting) {
      console.log('✅ Custom objectives are properly configured!');
      console.log('\n🔍 If you\'re not seeing them in the agent:');
      console.log('   1. Create a NEW agent (delete and recreate)');
      console.log('   2. Start a NEW conversation');
      console.log('   3. Check server logs for "Using custom objectives" message');
      console.log('\n🚀 Expected behavior:');
      console.log('   Agent should say: "Hi I\'m Domo, your AI sales engineer..."');
    } else {
      console.log('❌ Custom objectives need attention');
      console.log('   Check the issues identified above');
    }

  } catch (error) {
    console.error('❌ Debug error:', error);
  }
}

if (require.main === module) {
  debugCustomObjectives();
}