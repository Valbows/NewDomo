#!/usr/bin/env npx tsx
/**
 * Interactive conversation flow tester
 * Simulates a conversation to test objective completion
 */

import { createObjectivesManager } from '../src/lib/tavus/objectives-manager';

async function testConversationFlow() {
  console.log('🗣️  Conversation Flow Tester\n');

  const apiKey = process.env.TAVUS_API_KEY;
  if (!apiKey) {
    console.error('❌ TAVUS_API_KEY environment variable is required');
    process.exit(1);
  }

  try {
    const manager = createObjectivesManager();
    
    // Get all objectives to show available flows
    const allObjectives = await manager.getAllObjectives();
    
    if (allObjectives.data.length === 0) {
      console.log('❌ No objectives found. Run setup first:');
      console.log('npx tsx scripts/setup-objectives.ts');
      return;
    }

    console.log('📋 Available Objective Flows:');
    console.log('=' .repeat(50));
    
    allObjectives.data.forEach((obj, index) => {
      console.log(`${index + 1}. ${obj.name || 'Unnamed Objectives'}`);
      console.log(`   ID: ${obj.uuid}`);
      console.log(`   Objectives: ${obj.data?.length || 0}`);
      console.log(`   Created: ${new Date(obj.created_at).toLocaleDateString()}`);
      
      if (obj.data && obj.data.length > 0) {
        console.log('   Flow:');
        obj.data.forEach((objective, idx) => {
          console.log(`     ${idx + 1}. ${objective.objective_name}`);
          if (objective.output_variables && objective.output_variables.length > 0) {
            console.log(`        Collects: ${objective.output_variables.join(', ')}`);
          }
          if (objective.next_conditional_objectives && Object.keys(objective.next_conditional_objectives).length > 0) {
            console.log(`        Branches to: ${Object.keys(objective.next_conditional_objectives).join(', ')}`);
          }
          if (objective.next_required_objectives && objective.next_required_objectives.length > 0) {
            console.log(`        Then: ${objective.next_required_objectives.join(', ')}`);
          }
        });
      }
      console.log('');
    });

    console.log('🎯 How to Test These Flows:');
    console.log('=' .repeat(50));
    console.log('1. Create a persona with one of these objectives IDs');
    console.log('2. Start a conversation in Tavus dashboard');
    console.log('3. Follow the conversation flow shown above');
    console.log('4. Verify each objective is completed in order');
    console.log('5. Check that variables are collected correctly');

    console.log('\n💡 Pro Tips:');
    console.log('- Give responses that trigger different branches');
    console.log('- Test edge cases and unexpected responses');
    console.log('- Verify manual confirmation steps pause properly');
    console.log('- Check that collected data is referenced later');

    console.log('\n🚀 Quick Test Commands:');
    console.log('# Create test persona with objectives');
    console.log('npx tsx scripts/create-test-persona.ts');
    console.log('');
    console.log('# Run full test suite');
    console.log('npx tsx src/tests/test-objectives.ts');

  } catch (error) {
    console.error('❌ Failed to analyze conversation flows:', error);
  }
}

if (require.main === module) {
  testConversationFlow();
}

export { testConversationFlow };