#!/usr/bin/env npx tsx
/**
 * Delete all personas except the specified one
 */

const KEEP_PERSONA_ID = 'pf9364e0f9c1';

async function getAllPersonas() {
  const apiKey = process.env.TAVUS_API_KEY;
  if (!apiKey) {
    throw new Error('TAVUS_API_KEY environment variable is required');
  }

  const response = await fetch('https://tavusapi.com/v2/personas/', {
    method: 'GET',
    headers: {
      'x-api-key': apiKey
    }
  });

  if (!response.ok) {
    throw new Error(`Failed to get personas: ${response.statusText}`);
  }

  return await response.json();
}

async function deletePersona(personaId: string) {
  const apiKey = process.env.TAVUS_API_KEY;
  if (!apiKey) {
    throw new Error('TAVUS_API_KEY environment variable is required');
  }

  const response = await fetch(`https://tavusapi.com/v2/personas/${personaId}`, {
    method: 'DELETE',
    headers: {
      'x-api-key': apiKey
    }
  });

  if (!response.ok) {
    throw new Error(`Failed to delete persona ${personaId}: ${response.statusText}`);
  }

  return true;
}

async function cleanupPersonas() {
  console.log("🧹 Cleaning up personas...\n");
  console.log(`✅ Keeping persona: ${KEEP_PERSONA_ID}`);
  console.log("❌ Deleting all others\n");

  try {
    // Get all personas
    console.log("📋 Fetching all personas...");
    const personas = await getAllPersonas();
    
    if (!personas.data || personas.data.length === 0) {
      console.log("ℹ️  No personas found");
      return;
    }

    console.log(`📊 Found ${personas.data.length} personas total\n`);

    // Filter out the one we want to keep
    const personasToDelete = personas.data.filter((p: any) => p.persona_id !== KEEP_PERSONA_ID);
    
    if (personasToDelete.length === 0) {
      console.log("✅ No personas to delete - only the target persona exists");
      return;
    }

    console.log(`🗑️  Will delete ${personasToDelete.length} personas:`);
    personasToDelete.forEach((p: any) => {
      console.log(`   - ${p.persona_id} (${p.name || 'Unnamed'})`);
    });
    console.log("");

    // Delete each persona
    let deletedCount = 0;
    let errorCount = 0;

    for (const persona of personasToDelete) {
      try {
        console.log(`🗑️  Deleting ${persona.persona_id}...`);
        await deletePersona(persona.persona_id);
        console.log(`✅ Deleted ${persona.persona_id}`);
        deletedCount++;
      } catch (error) {
        console.error(`❌ Failed to delete ${persona.persona_id}:`, error);
        errorCount++;
      }
    }

    console.log(`\n🎉 Cleanup complete!`);
    console.log(`✅ Deleted: ${deletedCount} personas`);
    console.log(`❌ Errors: ${errorCount} personas`);
    console.log(`✅ Kept: ${KEEP_PERSONA_ID}`);

    // Verify the target persona still exists
    console.log(`\n🔍 Verifying ${KEEP_PERSONA_ID} still exists...`);
    const finalPersonas = await getAllPersonas();
    const targetExists = finalPersonas.data.some((p: any) => p.persona_id === KEEP_PERSONA_ID);
    
    if (targetExists) {
      console.log(`✅ Confirmed: ${KEEP_PERSONA_ID} is still active`);
    } else {
      console.log(`⚠️  Warning: ${KEEP_PERSONA_ID} not found in final list`);
    }

  } catch (error) {
    console.error("❌ Cleanup failed:", error);
    throw error;
  }
}

async function main() {
  console.log("🚀 Persona Cleanup Tool\n");
  
  try {
    await cleanupPersonas();
    
  } catch (error) {
    console.error("\n❌ Cleanup failed. Make sure you have:");
    console.log("1. TAVUS_API_KEY environment variable set");
    console.log("2. Valid Tavus API access");
    console.log("3. Proper permissions to delete personas");
  }
}

if (require.main === module) {
  main();
}