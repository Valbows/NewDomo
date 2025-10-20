#!/usr/bin/env npx tsx
/**
 * Check if a specific persona exists
 */

const PERSONA_ID = 'pf9364e0f9c1';

async function checkPersona(personaId: string) {
  const apiKey = process.env.TAVUS_API_KEY;
  if (!apiKey) {
    throw new Error('TAVUS_API_KEY environment variable is required');
  }

  console.log(`🔍 Checking persona: ${personaId}\n`);

  try {
    const response = await fetch(`https://tavusapi.com/v2/personas/${personaId}`, {
      method: 'GET',
      headers: {
        'x-api-key': apiKey
      }
    });

    console.log(`📡 Response status: ${response.status} ${response.statusText}`);

    if (response.ok) {
      const persona = await response.json();
      console.log("✅ Persona exists!");
      console.log("📋 Details:", JSON.stringify(persona, null, 2));
      return persona;
    } else {
      const errorText = await response.text();
      console.log("❌ Persona not found or error occurred");
      console.log("📄 Error response:", errorText);
      return null;
    }
  } catch (error) {
    console.error("❌ Request failed:", error);
    return null;
  }
}

async function main() {
  console.log("🚀 Persona Check Tool\n");
  
  try {
    await checkPersona(PERSONA_ID);
    
  } catch (error) {
    console.error("❌ Check failed:", error);
  }
}

if (require.main === module) {
  main();
}