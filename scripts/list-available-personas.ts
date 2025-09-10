#!/usr/bin/env npx tsx
/**
 * List all personas available with current API key
 */

async function listAllPersonas() {
  const apiKey = process.env.TAVUS_API_KEY;
  const baseUrl = process.env.TAVUS_BASE_URL || 'https://tavusapi.com/v2';

  if (!apiKey) {
    throw new Error('TAVUS_API_KEY environment variable is required');
  }

  console.log("📋 Listing all personas with current API key...");
  console.log(`🔑 API Key: ${apiKey.substring(0, 8)}...`);
  console.log(`📡 Base URL: ${baseUrl}\n`);

  try {
    const response = await fetch(`${baseUrl}/personas/`, {
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
        console.log(`${index + 1}. 🎭 Persona ID: ${persona.persona_id}`);
        console.log(`   📝 Name: ${persona.persona_name || 'Unnamed'}`);
        console.log(`   📅 Created: ${persona.created_at || 'Unknown'}`);
        console.log(`   📄 System Prompt: ${persona.system_prompt ? 'Present' : 'Missing'}`);
        console.log(`   🛡️ Guardrails: ${persona.guardrails_id || 'None'}`);
        console.log(`   🎯 Objectives: ${persona.objectives_id || 'None'}`);
        console.log(`   🎭 Default Replica: ${persona.default_replica_id || 'None'}`);
        
        // Check if this persona has all components
        const hasSystemPrompt = !!persona.system_prompt;
        const hasGuardrails = !!persona.guardrails_id;
        const hasObjectives = !!persona.objectives_id;
        const completeness = [hasSystemPrompt, hasGuardrails, hasObjectives].filter(Boolean).length;
        
        console.log(`   📊 Completeness: ${completeness}/3 components`);
        if (completeness === 3) {
          console.log(`   ✅ COMPLETE - Has all components!`);
        }
        console.log("");
      });

      // Find the most complete persona
      const completePersonas = personas.data.filter((p: any) => 
        p.system_prompt && p.guardrails_id && p.objectives_id
      );

      if (completePersonas.length > 0) {
        console.log(`🎉 Found ${completePersonas.length} complete persona(s) with all components:`);
        completePersonas.forEach((p: any) => {
          console.log(`   ✅ ${p.persona_id} - ${p.persona_name || 'Unnamed'}`);
        });
      } else {
        console.log(`⚠️ No personas found with all three components (system prompt + guardrails + objectives)`);
        
        // Find the best candidate
        const candidates = personas.data
          .map((p: any) => ({
            ...p,
            score: (p.system_prompt ? 1 : 0) + (p.guardrails_id ? 1 : 0) + (p.objectives_id ? 1 : 0)
          }))
          .sort((a: any, b: any) => b.score - a.score);

        if (candidates.length > 0 && candidates[0].score > 0) {
          console.log(`\n💡 Best candidate persona:`);
          const best = candidates[0];
          console.log(`   🎭 ID: ${best.persona_id}`);
          console.log(`   📝 Name: ${best.persona_name || 'Unnamed'}`);
          console.log(`   📊 Components: ${best.score}/3`);
          console.log(`   📄 System Prompt: ${best.system_prompt ? '✅' : '❌'}`);
          console.log(`   🛡️ Guardrails: ${best.guardrails_id ? '✅' : '❌'}`);
          console.log(`   🎯 Objectives: ${best.objectives_id ? '✅' : '❌'}`);
        }
      }

    } else {
      console.log("ℹ️ No personas found with this API key");
    }

    return personas;

  } catch (error) {
    console.error("❌ Failed to list personas:", error);
    throw error;
  }
}

async function main() {
  console.log("🚀 Available Personas Checker\n");
  
  try {
    await listAllPersonas();
    
    console.log("\n💡 Next steps:");
    console.log("1. Use a complete persona ID if available");
    console.log("2. Or create a new complete persona with your current API key");
    console.log("3. Update your environment variables with the correct persona ID");
    
  } catch (error) {
    console.error("\n❌ Check failed. Make sure you have:");
    console.log("1. TAVUS_API_KEY environment variable set");
    console.log("2. Valid Tavus API access");
    console.log("3. Proper network connectivity");
  }
}

if (require.main === module) {
  main();
}