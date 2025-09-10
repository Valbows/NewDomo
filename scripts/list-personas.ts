#!/usr/bin/env npx tsx
/**
 * List all personas with detailed information
 */

async function listPersonas() {
  const apiKey = process.env.TAVUS_API_KEY;
  if (!apiKey) {
    throw new Error('TAVUS_API_KEY environment variable is required');
  }

  console.log("📋 Fetching all personas...\n");

  const response = await fetch('https://tavusapi.com/v2/personas/', {
    method: 'GET',
    headers: {
      'x-api-key': apiKey
    }
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to get personas: ${response.status} ${response.statusText}\n${errorText}`);
  }

  const personas = await response.json();
  
  console.log(`📊 Found ${personas.data?.length || 0} personas:\n`);

  if (personas.data && personas.data.length > 0) {
    personas.data.forEach((persona: any, index: number) => {
      console.log(`${index + 1}. Persona ID: ${persona.persona_id}`);
      console.log(`   Name: ${persona.name || 'Unnamed'}`);
      console.log(`   Created: ${persona.created_at || 'Unknown'}`);
      console.log(`   System Prompt: ${persona.system_prompt ? 'Yes' : 'No'}`);
      console.log(`   Guardrails: ${persona.guardrails_id || 'None'}`);
      console.log(`   Objectives: ${persona.objectives_id || 'None'}`);
      console.log(`   Default Replica: ${persona.default_replica_id || 'None'}`);
      console.log("");
    });

    // Check if our target persona exists
    const targetPersona = personas.data.find((p: any) => p.persona_id === 'pf9364e0f9c1');
    if (targetPersona) {
      console.log("✅ Target persona pf9364e0f9c1 found!");
      console.log("📋 Details:", JSON.stringify(targetPersona, null, 2));
    } else {
      console.log("❌ Target persona pf9364e0f9c1 NOT found in the list");
    }
  } else {
    console.log("ℹ️  No personas found");
  }

  return personas;
}

async function main() {
  console.log("🚀 Persona List Tool\n");
  
  try {
    await listPersonas();
    
  } catch (error) {
    console.error("❌ Failed to list personas:", error);
  }
}

if (require.main === module) {
  main();
}