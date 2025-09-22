#!/usr/bin/env tsx

/**
 * Script to recreate a persona with raven-0 perception analysis
 * This is needed because existing personas can't be updated to add perception_model
 */

import { createClient } from '@/utils/supabase/server';

async function recreatePersonaWithRaven(oldPersonaId: string) {
  const apiKey = process.env.TAVUS_API_KEY;
  if (!apiKey) {
    console.error('❌ TAVUS_API_KEY not found in environment');
    process.exit(1);
  }

  const supabase = createClient();

  console.log(`🔍 Finding demos using persona ${oldPersonaId}...`);

  try {
    // Find demos using this persona
    const { data: demos, error } = await supabase
      .from('demos')
      .select('id, name, user_id')
      .eq('tavus_persona_id', oldPersonaId);

    if (error) {
      throw error;
    }

    if (!demos || demos.length === 0) {
      console.log('ℹ️  No demos found using this persona');
      return;
    }

    console.log(`📋 Found ${demos.length} demo(s) using this persona:`);
    demos.forEach(demo => {
      console.log(`   - ${demo.name} (${demo.id})`);
    });

    // Get the old persona details
    console.log('\n🔍 Fetching old persona details...');
    const oldPersonaResponse = await fetch(`https://tavusapi.com/v2/personas/${oldPersonaId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
      },
    });

    if (!oldPersonaResponse.ok) {
      console.error(`❌ Failed to fetch old persona: ${oldPersonaResponse.status}`);
      process.exit(1);
    }

    const oldPersona = await oldPersonaResponse.json();
    console.log(`📋 Old persona: ${oldPersona.persona_name}`);
    console.log(`🧠 Current perception model: ${oldPersona.perception_model || 'not set'}`);

    if (oldPersona.perception_model === 'raven-0') {
      console.log('✅ Persona already has raven-0 enabled!');
      return;
    }

    // Create new persona with raven-0
    console.log('\n🔄 Creating new persona with raven-0...');
    const newPersonaPayload = {
      pipeline_mode: oldPersona.pipeline_mode || 'full',
      system_prompt: oldPersona.system_prompt,
      persona_name: oldPersona.persona_name + ' (Raven-0)',
      perception_model: 'raven-0', // Enable perception analysis
      layers: oldPersona.layers || {},
      objectives_id: oldPersona.objectives_id,
      guardrails_id: oldPersona.guardrails_id,
      default_replica_id: oldPersona.default_replica_id,
      context: oldPersona.context || '',
      greeting: oldPersona.greeting || ''
    };

    const newPersonaResponse = await fetch('https://tavusapi.com/v2/personas', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
      },
      body: JSON.stringify(newPersonaPayload),
    });

    if (!newPersonaResponse.ok) {
      const errorBody = await newPersonaResponse.text();
      console.error(`❌ Failed to create new persona: ${newPersonaResponse.status}`);
      console.error('Error details:', errorBody);
      process.exit(1);
    }

    const newPersona = await newPersonaResponse.json();
    const newPersonaId = newPersona.persona_id;
    
    console.log(`✅ Created new persona: ${newPersonaId}`);
    console.log(`🧠 Perception model: ${newPersona.perception_model}`);

    // Update all demos to use the new persona
    console.log('\n🔄 Updating demos to use new persona...');
    for (const demo of demos) {
      const { error: updateError } = await supabase
        .from('demos')
        .update({ tavus_persona_id: newPersonaId })
        .eq('id', demo.id);

      if (updateError) {
        console.error(`❌ Failed to update demo ${demo.name}:`, updateError);
      } else {
        console.log(`✅ Updated demo: ${demo.name}`);
      }
    }

    console.log('\n🎉 Migration completed!');
    console.log(`📋 Old persona: ${oldPersonaId} (can be deleted)`);
    console.log(`📋 New persona: ${newPersonaId} (with raven-0)`);
    console.log('\n💡 Next steps:');
    console.log('   1. Test the demos to ensure they work with the new persona');
    console.log('   2. Have conversations and check for perception analysis data');
    console.log('   3. Delete the old persona if everything works correctly');

  } catch (error) {
    console.error('💥 Error during migration:', error);
    process.exit(1);
  }
}

// Get persona ID from command line argument
const personaId = process.argv[2];
if (!personaId) {
  console.error('❌ Please provide a persona ID');
  console.log('Usage: npx tsx scripts/recreate-persona-with-raven.ts <persona-id>');
  process.exit(1);
}

recreatePersonaWithRaven(personaId).catch(console.error);