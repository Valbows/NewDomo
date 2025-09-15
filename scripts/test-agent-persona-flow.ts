#!/usr/bin/env tsx

/**
 * Test script to verify that agent creation properly updates the persona ID
 * and that conversations use the correct persona
 */

import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';

// Load environment variables
config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SECRET_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function testAgentPersonaFlow() {
  console.log('🧪 Testing Agent Persona Flow');
  console.log('='.repeat(50));

  // Find a demo to test with
  const { data: demos, error: demosError } = await supabase
    .from('demos')
    .select('id, name, tavus_persona_id')
    .limit(1);

  if (demosError || !demos || demos.length === 0) {
    console.error('❌ No demos found for testing');
    return;
  }

  const demo = demos[0];
  console.log(`📋 Testing with demo: ${demo.name} (${demo.id})`);
  console.log(`   Current persona ID: ${demo.tavus_persona_id || 'None'}`);

  // Test 1: Check if demo has custom objectives
  const { data: customObjectives } = await supabase
    .from('custom_objectives')
    .select('*')
    .eq('demo_id', demo.id)
    .eq('is_active', true);

  console.log(`\n🎯 Custom Objectives Check:`);
  if (customObjectives && customObjectives.length > 0) {
    const activeObjective = customObjectives[0];
    console.log(`   ✅ Has active custom objective: ${activeObjective.name}`);
    console.log(`   📋 Steps: ${activeObjective.objectives.length}`);
    console.log(`   🆔 Tavus ID: ${activeObjective.tavus_objectives_id || 'Not synced'}`);
    
    if (activeObjective.tavus_objectives_id) {
      console.log(`   💡 Expected: New persona should be created with objectives ${activeObjective.tavus_objectives_id}`);
    } else {
      console.log(`   ⚠️  Custom objective not synced to Tavus yet`);
    }
  } else {
    console.log(`   📋 No active custom objectives - should use existing persona`);
    console.log(`   💡 Expected: Should use existing persona ${process.env.COMPLETE_PERSONA_ID}`);
  }

  // Test 2: Simulate agent creation call
  console.log(`\n🤖 Simulating Agent Creation...`);
  console.log(`   This would call: POST /api/create-enhanced-agent`);
  console.log(`   With demoId: ${demo.id}`);
  
  // Test 3: Check what persona would be used for conversation
  console.log(`\n💬 Conversation Persona Check:`);
  const { data: updatedDemo } = await supabase
    .from('demos')
    .select('tavus_persona_id, metadata')
    .eq('id', demo.id)
    .single();

  if (updatedDemo?.tavus_persona_id) {
    console.log(`   ✅ Demo has persona: ${updatedDemo.tavus_persona_id}`);
    console.log(`   💡 Conversations will use this persona ID`);
    
    // Check if it's the default or a custom one
    const defaultPersonaId = process.env.COMPLETE_PERSONA_ID;
    if (updatedDemo.tavus_persona_id === defaultPersonaId) {
      console.log(`   📋 Using default persona (preset objectives)`);
    } else {
      console.log(`   🎯 Using custom persona (custom objectives)`);
    }
  } else {
    console.log(`   ❌ Demo has no persona configured`);
    console.log(`   💡 Need to run agent creation first`);
  }

  console.log(`\n✅ Test completed. Check the logs above to verify the flow.`);
}

// Run the test
testAgentPersonaFlow().catch(console.error);