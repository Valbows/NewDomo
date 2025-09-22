#!/usr/bin/env tsx

/**
 * Simple script to recreate a persona with raven-0 perception analysis
 */

async function recreatePersonaWithRaven(oldPersonaId: string) {
  const apiKey = process.env.TAVUS_API_KEY;
  if (!apiKey) {
    console.error('❌ TAVUS_API_KEY not found in environment');
    process.exit(1);
  }

  console.log(`🔍 Fetching persona ${oldPersonaId}...`);

  try {
    // Get the old persona details
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

    console.log('📋 New persona payload:');
    console.log('   - Name:', newPersonaPayload.persona_name);
    console.log('   - Perception model:', newPersonaPayload.perception_model);
    console.log('   - Objectives ID:', newPersonaPayload.objectives_id);
    console.log('   - Guardrails ID:', newPersonaPayload.guardrails_id);

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
    
    console.log(`\n✅ Created new persona: ${newPersonaId}`);
    console.log(`🧠 Perception model: ${newPersona.perception_model}`);
    console.log(`📋 Full response:`, JSON.stringify(newPersona, null, 2));

    console.log('\n🎉 New persona created successfully!');
    console.log(`📋 Old persona: ${oldPersonaId} (can be deleted)`);
    console.log(`📋 New persona: ${newPersonaId} (with raven-0)`);
    console.log('\n💡 Next steps:');
    console.log('   1. Update your demo to use the new persona ID');
    console.log('   2. Test conversations and check for perception analysis data');
    console.log('   3. Delete the old persona if everything works correctly');
    console.log(`\n🔧 To update demo, use this persona ID: ${newPersonaId}`);

  } catch (error) {
    console.error('💥 Error during persona creation:', error);
    process.exit(1);
  }
}

// Get persona ID from command line argument
const personaId = process.argv[2];
if (!personaId) {
  console.error('❌ Please provide a persona ID');
  console.log('Usage: npx tsx scripts/simple-recreate-persona.ts <persona-id>');
  process.exit(1);
}

recreatePersonaWithRaven(personaId).catch(console.error);