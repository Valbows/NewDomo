#!/usr/bin/env tsx

/**
 * Quick script to fix a specific persona's perception model
 * Usage: npx tsx scripts/fix-specific-persona.ts p222baf36fbc
 */

async function fixPersona(personaId: string) {
  const apiKey = process.env.TAVUS_API_KEY;
  if (!apiKey) {
    console.error('❌ TAVUS_API_KEY not found in environment');
    process.exit(1);
  }

  console.log(`🔍 Checking persona ${personaId}...`);

  try {
    // First check current status
    const checkResponse = await fetch(`https://tavusapi.com/v2/personas/${personaId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
      },
    });

    if (!checkResponse.ok) {
      console.error(`❌ Failed to fetch persona: ${checkResponse.status}`);
      process.exit(1);
    }

    const persona = await checkResponse.json();
    console.log(`📋 Persona: ${persona.name || 'Unknown'}`);
    console.log(`🧠 Current perception model: ${persona.perception_model || 'not set'}`);

    if (persona.perception_model === 'raven-0') {
      console.log('✅ Persona already has raven-0 enabled!');
      return;
    }

    // Update to raven-0 using JSON Patch format
    console.log('🔄 Updating to raven-0...');
    const updateResponse = await fetch(`https://tavusapi.com/v2/personas/${personaId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
      },
      body: JSON.stringify([
        {
          op: "add",
          path: "/perception_model",
          value: "raven-0"
        }
      ])
    });

    if (!updateResponse.ok) {
      const errorText = await updateResponse.text();
      console.error(`❌ Failed to update persona: ${updateResponse.status} - ${errorText}`);
      process.exit(1);
    }

    const updatedPersona = await updateResponse.json();
    console.log('✅ Successfully updated persona!');
    console.log(`🧠 New perception model: ${updatedPersona.perception_model}`);
    console.log('\n🎉 Persona is now configured for perception analysis!');
    console.log('💡 Next steps:');
    console.log('   1. Have a conversation with this persona');
    console.log('   2. Wait for the conversation to complete');
    console.log('   3. Use "Sync from Tavus" to pull perception data');

  } catch (error) {
    console.error('💥 Error:', error);
    process.exit(1);
  }
}

// Get persona ID from command line argument
const personaId = process.argv[2];
if (!personaId) {
  console.error('❌ Please provide a persona ID');
  console.log('Usage: npx tsx scripts/fix-specific-persona.ts <persona-id>');
  process.exit(1);
}

fixPersona(personaId).catch(console.error);