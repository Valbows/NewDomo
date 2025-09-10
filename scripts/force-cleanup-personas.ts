#!/usr/bin/env npx tsx
/**
 * Force cleanup of old personas with better error handling
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

async function deletePersonaWithDetails(personaId: string) {
  const apiKey = process.env.TAVUS_API_KEY;
  if (!apiKey) {
    throw new Error('TAVUS_API_KEY environment variable is required');
  }

  console.log(`🔍 Attempting to delete ${personaId}...`);

  try {
    const response = await fetch(`https://tavusapi.com/v2/personas/${personaId}`, {
      method: 'DELETE',
      headers: {
        'x-api-key': apiKey
      }
    });

    if (response.ok) {
      console.log(`✅ Successfully deleted ${personaId}`);
      return { success: true, personaId };
    } else {
      const errorText = await response.text();
      console.log(`❌ Failed to delete ${personaId}: ${response.status} ${response.statusText}`);
      console.log(`   Error details: ${errorText}`);
      
      // Try to get more info about why it failed
      if (response.status === 400) {
        console.log(`   💡 Possible reasons: Active conversations, dependencies, or persona in use`);
      }
      
      return { success: false, personaId, error: `${response.status}: ${errorText}` };
    }
  } catch (error) {
    console.log(`❌ Network error deleting ${personaId}:`, error);
    return { success: false, personaId, error: error.toString() };
  }
}

async function forceCleanup() {
  console.log("🧹 Force cleanup of personas...\n");
  console.log(`✅ Target to keep: ${KEEP_PERSONA_ID}`);
  console.log("❌ Will attempt to delete all others\n");

  try {
    // Get all personas from the list endpoint
    console.log("📋 Fetching personas from list endpoint...");
    const personas = await getAllPersonas();
    
    if (!personas.data || personas.data.length === 0) {
      console.log("ℹ️  No personas found in list");
      return;
    }

    console.log(`📊 Found ${personas.data.length} personas in list\n`);

    // Try to delete each one except our target
    const results = [];
    
    for (const persona of personas.data) {
      if (persona.persona_id === KEEP_PERSONA_ID) {
        console.log(`⏭️  Skipping ${persona.persona_id} (target to keep)`);
        continue;
      }
      
      const result = await deletePersonaWithDetails(persona.persona_id);
      results.push(result);
      
      // Small delay between requests
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    // Summary
    const successful = results.filter(r => r.success);
    const failed = results.filter(r => !r.success);
    
    console.log(`\n📊 Cleanup Summary:`);
    console.log(`✅ Successfully deleted: ${successful.length} personas`);
    console.log(`❌ Failed to delete: ${failed.length} personas`);
    
    if (successful.length > 0) {
      console.log(`\n✅ Deleted personas:`);
      successful.forEach(r => console.log(`   - ${r.personaId}`));
    }
    
    if (failed.length > 0) {
      console.log(`\n❌ Failed deletions:`);
      failed.forEach(r => console.log(`   - ${r.personaId}: ${r.error}`));
    }

    // Final verification
    console.log(`\n🔍 Final verification...`);
    const finalPersonas = await getAllPersonas();
    console.log(`📊 Remaining personas: ${finalPersonas.data?.length || 0}`);
    
    if (finalPersonas.data) {
      finalPersonas.data.forEach((p: any) => {
        if (p.persona_id === KEEP_PERSONA_ID) {
          console.log(`✅ ${p.persona_id} (kept as requested)`);
        } else {
          console.log(`⚠️  ${p.persona_id} (still exists)`);
        }
      });
    }

  } catch (error) {
    console.error("❌ Force cleanup failed:", error);
    throw error;
  }
}

async function main() {
  console.log("🚀 Force Persona Cleanup Tool\n");
  
  try {
    await forceCleanup();
    
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