#!/usr/bin/env npx tsx
/**
 * Fix guardrails on the target persona
 */

import { addGuardrailsToPersona } from "../src/lib/tavus/persona-with-guardrails";

const TARGET_PERSONA_ID = 'pf9364e0f9c1';

async function fixPersonaGuardrails() {
  console.log("🛡️ Fixing guardrails on target persona...\n");
  console.log(`🎯 Target persona: ${TARGET_PERSONA_ID}`);

  try {
    // Add guardrails to the existing persona
    console.log("🔧 Adding guardrails...");
    const updatedPersona = await addGuardrailsToPersona(TARGET_PERSONA_ID);

    console.log("✅ Guardrails added successfully!");
    console.log("📊 Updated persona details:", {
      persona_id: updatedPersona.persona_id,
      guardrails_id: updatedPersona.guardrails_id,
      objectives_id: updatedPersona.objectives_id,
      updated_at: updatedPersona.updated_at,
    });

    console.log("\n🎉 Your persona now has all three components:");
    console.log("✅ System prompt (from system_prompt.md)");
    console.log("✅ Guardrails (attached)");
    console.log("✅ Objectives (Product Demo Flow)");

    console.log(`\n🔗 Test your complete persona:`);
    console.log(`https://app.tavus.io/conversations/new?persona_id=${TARGET_PERSONA_ID}`);

    return updatedPersona;

  } catch (error) {
    console.error("❌ Failed to fix guardrails:", error);
    throw error;
  }
}

async function main() {
  console.log("🚀 Fix Persona Guardrails\n");
  
  try {
    await fixPersonaGuardrails();
    
  } catch (error) {
    console.error("\n❌ Fix failed. Make sure you have:");
    console.log("1. TAVUS_API_KEY environment variable set");
    console.log("2. Valid Tavus API access");
    console.log("3. Target persona exists");
  }
}

if (require.main === module) {
  main();
}