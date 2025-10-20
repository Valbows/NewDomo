#!/usr/bin/env npx tsx
/**
 * Example: Creating a persona with Tavus guardrails
 * This shows how to use the new guardrails system
 */

import {
  createDomoAIPersona,
  addGuardrailsToPersona,
} from "../src/lib/tavus/persona-with-guardrails";
import { createGuardrailsManager } from "../src/lib/tavus/guardrails-manager";

async function example1_CreateNewPersonaWithGuardrails() {
  console.log("📝 Example 1: Creating new persona with guardrails...\n");

  try {
    // This automatically creates/finds guardrails and attaches them
    const persona = await createDomoAIPersona({
      // Optional: provide custom system prompt
      // system_prompt: "Custom prompt here...",
      // Optional: add other persona properties
      // voice_id: "your-voice-id",
      // callback_url: "https://your-webhook.com"
    });

    console.log("✅ Created persona:", {
      id: persona.persona_id,
      has_guardrails: !!persona.guardrails_id,
      created_at: persona.created_at,
    });

    return persona.persona_id;
  } catch (error) {
    console.error("❌ Failed to create persona:", error);
    throw error;
  }
}

async function example2_AddGuardrailsToExistingPersona() {
  console.log("\n📝 Example 2: Adding guardrails to existing persona...\n");

  // Replace with your actual persona ID
  const existingPersonaId = "your-existing-persona-id";

  try {
    const updatedPersona = await addGuardrailsToPersona(existingPersonaId);

    console.log("✅ Updated persona:", {
      id: updatedPersona.persona_id,
      guardrails_id: updatedPersona.guardrails_id,
      updated_at: updatedPersona.updated_at,
    });
  } catch (error) {
    console.error("❌ Failed to update persona:", error);
    // This is expected if persona doesn't exist
  }
}

async function example3_ManageGuardrailsDirectly() {
  console.log("\n📝 Example 3: Managing guardrails directly...\n");

  try {
    const manager = createGuardrailsManager();

    // List all guardrails
    const allGuardrails = await manager.getAllGuardrails();
    console.log(`📋 You have ${allGuardrails.data.length} guardrails sets:`);

    allGuardrails.data.forEach((g) => {
      console.log(`  • ${g.name} (${g.uuid})`);
      console.log(
        `    Created: ${new Date(g.created_at).toLocaleDateString()}`
      );
    });

    // Get specific guardrails details
    if (allGuardrails.data.length > 0) {
      const firstGuardrail = allGuardrails.data[0];
      const details = await manager.getGuardrails(firstGuardrail.uuid);
      console.log(`\n📋 Details for "${details.name}":`);
      console.log(`  ID: ${details.uuid}`);
      console.log(`  Created: ${details.created_at}`);
      console.log(`  Updated: ${details.updated_at}`);
    }
  } catch (error) {
    console.error("❌ Failed to manage guardrails:", error);
    throw error;
  }
}

async function main() {
  console.log("🚀 Tavus Guardrails Examples\n");

  try {
    // Run examples
    await example1_CreateNewPersonaWithGuardrails();
    await example2_AddGuardrailsToExistingPersona();
    await example3_ManageGuardrailsDirectly();

    console.log("\n🎉 All examples completed successfully!");
    console.log("\n💡 Next steps:");
    console.log(
      "1. Replace your old persona creation code with createDomoAIPersona()"
    );
    console.log("2. Update your system_prompt.md to use the clean version");
    console.log("3. Test your personas to ensure guardrails are working");
  } catch (error) {
    console.error("\n❌ Examples failed. Make sure you have:");
    console.log("1. TAVUS_API_KEY environment variable set");
    console.log("2. Run: npx tsx scripts/setup-guardrails.ts");
    console.log("3. Valid Tavus API access");
  }
}

if (require.main === module) {
  main();
}
