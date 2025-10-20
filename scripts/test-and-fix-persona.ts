#!/usr/bin/env npx tsx
/**
 * Test and fix guardrails and objectives for persona pf9364e0f9c1
 */

import { createGuardrailsManager } from "../src/lib/tavus/guardrails-manager";
import { createObjectivesManager } from "../src/lib/tavus/objectives-manager";

const TARGET_PERSONA_ID = 'pf9364e0f9c1';

async function getPersonaDetails(personaId: string) {
  const apiKey = process.env.TAVUS_API_KEY;
  if (!apiKey) {
    throw new Error('TAVUS_API_KEY environment variable is required');
  }

  const response = await fetch(`https://tavusapi.com/v2/personas/${personaId}`, {
    method: 'GET',
    headers: {
      'x-api-key': apiKey
    }
  });

  if (!response.ok) {
    throw new Error(`Failed to get persona: ${response.status} ${response.statusText}`);
  }

  return await response.json();
}

async function updatePersona(personaId: string, updates: any) {
  const apiKey = process.env.TAVUS_API_KEY;
  if (!apiKey) {
    throw new Error('TAVUS_API_KEY environment variable is required');
  }

  // Convert updates to JSON Patch format
  const patchOperations = Object.keys(updates).map(key => ({
    op: "add",
    path: `/${key}`,
    value: updates[key]
  }));

  console.log(`🔧 Updating persona ${personaId} with JSON Patch:`, JSON.stringify(patchOperations, null, 2));

  const response = await fetch(`https://tavusapi.com/v2/personas/${personaId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey
    },
    body: JSON.stringify(patchOperations)
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to update persona: ${response.status} ${response.statusText}\n${errorText}`);
  }

  return await response.json();
}

async function testObjectives(objectivesId: string) {
  console.log(`🎯 Testing objectives: ${objectivesId}`);
  
  try {
    const manager = createObjectivesManager();
    const objectives = await manager.getObjectives(objectivesId);
    
    console.log("✅ Objectives found and accessible");
    console.log(`📊 Objectives details:`);
    console.log(`   - ID: ${objectives.uuid}`);
    console.log(`   - Total objectives: ${objectives.data?.length || 0}`);
    console.log(`   - Created: ${objectives.created_at}`);
    
    if (objectives.data && objectives.data.length > 0) {
      console.log(`   - First objective: ${objectives.data[0]?.objective_name || 'Unknown'}`);
      console.log(`   - Last objective: ${objectives.data[objectives.data.length - 1]?.objective_name || 'Unknown'}`);
    }
    
    return { valid: true, objectives };
  } catch (error) {
    console.log("❌ Objectives test failed:", error);
    return { valid: false, error };
  }
}

async function testGuardrails(guardrailsId: string | null) {
  console.log(`🛡️ Testing guardrails: ${guardrailsId || 'null'}`);
  
  if (!guardrailsId) {
    console.log("❌ No guardrails ID found");
    return { valid: false, error: "No guardrails attached" };
  }
  
  try {
    const manager = createGuardrailsManager();
    const guardrails = await manager.getGuardrails(guardrailsId);
    
    console.log("✅ Guardrails found and accessible");
    console.log(`📊 Guardrails details:`);
    console.log(`   - ID: ${guardrails.guardrails_id}`);
    console.log(`   - Name: ${guardrails.guardrails_name}`);
    console.log(`   - Created: ${guardrails.created_at}`);
    console.log(`   - Rules count: ${guardrails.data?.length || 0}`);
    
    return { valid: true, guardrails };
  } catch (error) {
    console.log("❌ Guardrails test failed:", error);
    return { valid: false, error };
  }
}

async function fixGuardrails(personaId: string) {
  console.log("🔧 Fixing guardrails...");
  
  try {
    // Create new guardrails
    const manager = createGuardrailsManager();
    const guardrailsId = await manager.ensureDomoAIGuardrails();
    
    console.log(`✅ Created/found guardrails: ${guardrailsId}`);
    
    // Try to update persona with guardrails using direct field update
    const updates = {
      guardrails_id: guardrailsId
    };
    
    const updatedPersona = await updatePersona(personaId, updates);
    console.log("✅ Successfully attached guardrails to persona");
    
    return { success: true, guardrailsId, persona: updatedPersona };
  } catch (error) {
    console.log("❌ Failed to fix guardrails:", error);
    return { success: false, error };
  }
}

async function testAndFixPersona() {
  console.log("🚀 Testing and fixing persona components...\n");
  console.log(`🎯 Target persona: ${TARGET_PERSONA_ID}\n`);

  try {
    // 1. Get current persona state
    console.log("📋 Getting current persona state...");
    const persona = await getPersonaDetails(TARGET_PERSONA_ID);
    
    console.log("✅ Persona found");
    console.log(`📊 Current state:`);
    console.log(`   - ID: ${persona.persona_id}`);
    console.log(`   - Name: ${persona.persona_name}`);
    console.log(`   - System Prompt: ${persona.system_prompt ? 'Present' : 'Missing'}`);
    console.log(`   - Objectives ID: ${persona.objectives_id || 'None'}`);
    console.log(`   - Guardrails ID: ${persona.guardrails_id || 'None'}`);
    console.log("");

    // 2. Test objectives
    let objectivesValid = false;
    if (persona.objectives_id) {
      const objectivesTest = await testObjectives(persona.objectives_id);
      objectivesValid = objectivesTest.valid;
      console.log("");
    } else {
      console.log("❌ No objectives attached to persona\n");
    }

    // 3. Test guardrails
    let guardrailsValid = false;
    const guardrailsTest = await testGuardrails(persona.guardrails_id);
    guardrailsValid = guardrailsTest.valid;
    console.log("");

    // 4. Fix issues
    let fixedPersona = persona;
    
    if (!guardrailsValid) {
      console.log("🔧 Attempting to fix guardrails...");
      const guardrailsFix = await fixGuardrails(TARGET_PERSONA_ID);
      
      if (guardrailsFix.success) {
        fixedPersona = guardrailsFix.persona;
        console.log("✅ Guardrails fixed successfully\n");
      } else {
        console.log("❌ Could not fix guardrails automatically\n");
      }
    }

    // 5. Final verification
    console.log("🔍 Final verification...");
    const finalPersona = await getPersonaDetails(TARGET_PERSONA_ID);
    
    console.log("📊 Final persona state:");
    console.log(`   - System Prompt: ${finalPersona.system_prompt ? '✅ Present' : '❌ Missing'}`);
    console.log(`   - Objectives: ${finalPersona.objectives_id ? '✅ ' + finalPersona.objectives_id : '❌ Missing'}`);
    console.log(`   - Guardrails: ${finalPersona.guardrails_id ? '✅ ' + finalPersona.guardrails_id : '❌ Missing'}`);

    // 6. Summary
    const allComponentsPresent = finalPersona.system_prompt && finalPersona.objectives_id && finalPersona.guardrails_id;
    
    console.log(`\n🎉 Persona Status: ${allComponentsPresent ? '✅ COMPLETE' : '⚠️ INCOMPLETE'}`);
    
    if (allComponentsPresent) {
      console.log("🎭 Your persona has all three components:");
      console.log("   ✅ System prompt (from system_prompt.md)");
      console.log("   ✅ Objectives (Product Demo Flow)");
      console.log("   ✅ Guardrails (Domo AI Core Guardrails)");
      console.log(`\n🔗 Test your persona:`);
      console.log(`https://app.tavus.io/conversations/new?persona_id=${TARGET_PERSONA_ID}`);
    } else {
      console.log("⚠️ Some components are still missing. Manual intervention may be required.");
    }

    return finalPersona;

  } catch (error) {
    console.error("❌ Test and fix failed:", error);
    throw error;
  }
}

async function main() {
  console.log("🚀 Persona Test & Fix Tool\n");
  
  try {
    await testAndFixPersona();
    
  } catch (error) {
    console.error("\n❌ Process failed. Make sure you have:");
    console.log("1. TAVUS_API_KEY environment variable set");
    console.log("2. Valid Tavus API access");
    console.log("3. Persona exists and is accessible");
  }
}

if (require.main === module) {
  main();
}