#!/usr/bin/env tsx
/**
 * Verify Custom Objectives Integration
 */

const DEMO_ID = 'bbd9ffac-f4b7-4df3-9b8a-a01748c9a44b';

async function verifyCustomObjectives() {
  console.log('🔍 Verifying Custom Objectives Integration\n');

  try {
    // Check API endpoint
    console.log('📡 Checking API endpoint...');
    const response = await fetch(`http://localhost:3000/api/demos/${DEMO_ID}/custom-objectives`);
    
    if (!response.ok) {
      console.error('❌ API Error:', response.status, response.statusText);
      return;
    }

    const data = await response.json();
    console.log('✅ API Response received');

    // Check objectives
    const objectives = data.objectives || [];
    console.log(`📋 Found ${objectives.length} objective sets`);

    const activeObjective = objectives.find((obj: any) => obj.is_active);
    
    if (activeObjective) {
      console.log('\n🎯 Active Objective Set:');
      console.log(`   Name: ${activeObjective.name}`);
      console.log(`   Description: ${activeObjective.description || 'None'}`);
      console.log(`   Steps: ${activeObjective.objectives.length}`);
      console.log(`   Tavus ID: ${activeObjective.tavus_objectives_id || 'Not synced'}`);
      console.log(`   Created: ${new Date(activeObjective.created_at).toLocaleString()}`);

      console.log('\n📝 Objective Steps:');
      activeObjective.objectives.forEach((step: any, i: number) => {
        console.log(`   ${i + 1}. ${step.objective_name}`);
        console.log(`      Prompt: ${step.objective_prompt.substring(0, 60)}...`);
        console.log(`      Mode: ${step.confirmation_mode}, ${step.modality}`);
        if (step.output_variables?.length > 0) {
          console.log(`      Variables: ${step.output_variables.join(', ')}`);
        }
        console.log('');
      });

      // Check if it matches your Workday demo
      const isWorkdayDemo = activeObjective.name.toLowerCase().includes('workday');
      const hasGreeting = activeObjective.objectives.some((step: any) => 
        step.objective_name.includes('greeting') || 
        step.objective_prompt.toLowerCase().includes('domo')
      );

      if (isWorkdayDemo && hasGreeting) {
        console.log('🎉 SUCCESS: Your Workday demo objectives are active and ready!');
        console.log('\n🚀 Next Steps:');
        console.log('1. Go to /demos/' + DEMO_ID + '/experience');
        console.log('2. Start a new conversation');
        console.log('3. Agent should follow your 4-step Workday flow');
      } else {
        console.log('⚠️  Objectives found but may not be your Workday demo');
      }

    } else {
      console.log('❌ No active objectives found');
      if (objectives.length > 0) {
        console.log('💡 Available objectives (not active):');
        objectives.forEach((obj: any, i: number) => {
          console.log(`   ${i + 1}. ${obj.name} (${obj.objectives.length} steps)`);
        });
        console.log('\n🔧 Activate one by clicking the play button in the UI');
      }
    }

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

if (require.main === module) {
  verifyCustomObjectives();
}