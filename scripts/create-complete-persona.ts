#!/usr/bin/env npx tsx
/**
 * Create a complete Domo AI persona with all three components:
 * 1. System prompt (from system_prompt.md)
 * 2. Guardrails (from guardrails-templates.ts)
 * 3. Objectives (from objectives-templates.ts)
 */

import { createDomoAIPersona } from "../src/lib/tavus/persona-with-guardrails";
import { createObjectivesManager } from "../src/lib/tavus/objectives-manager";
import { OBJECTIVES_TEMPLATES } from "../src/lib/tavus/objectives-templates";

async function createCompletePersona() {
  console.log("🎯 Creating complete Domo AI persona with all components...\n");

  try {
    // 1. Create objectives first
    console.log("📋 Creating objectives...");
    const manager = createObjectivesManager();
    const objectives = await manager.createObjectives(OBJECTIVES_TEMPLATES.PRODUCT_DEMO);
    console.log(`✅ Created objectives: ${objectives.uuid}`);

    // 2. Create persona with all three components
    console.log("\n🎭 Creating persona...");
    const persona = await createDomoAIPersona({
      objectives_id: objectives.uuid,
      // System prompt: auto-loaded from src/lib/tavus/system_prompt.md
      // Guardrails: auto-attached from guardrails-templates.ts
    });

    console.log("\n🎉 Complete persona created successfully!");
    console.log("📊 Persona details:", {
      persona_id: persona.persona_id,
      system_prompt: "✅ Loaded from system_prompt.md",
      guardrails_id: persona.guardrails_id || "✅ Auto-attached",
      objectives_id: persona.objectives_id || objectives.uuid,
      created_at: persona.created_at,
    });

    console.log("\n💾 Save this persona ID:");
    console.log(`COMPLETE_PERSONA_ID=${persona.persona_id}`);
    
    console.log("\n🔗 Test the persona:");
    console.log(`https://app.tavus.io/conversations/new?persona_id=${persona.persona_id}`);

    return persona.persona_id;

  } catch (error) {
    console.error("❌ Failed to create complete persona:", error);
    throw error;
  }
}

async function main() {
  console.log("🚀 Creating Complete Domo AI Persona\n");
  
  try {
    const personaId = await createCompletePersona();
    
    console.log("\n✨ Success! Your complete persona is ready.");
    console.log(`Persona ID: ${personaId}`);
    
  } catch (error) {
    console.error("\n❌ Setup failed. Make sure you have:");
    console.log("1. TAVUS_API_KEY environment variable set");
    console.log("2. Valid Tavus API access");
    console.log("3. All required files in src/lib/tavus/");
  }
}

if (require.main === module) {
  main();
}