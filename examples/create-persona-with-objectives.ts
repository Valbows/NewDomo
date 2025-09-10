#!/usr/bin/env npx tsx
/**
 * Example: Creating personas with Tavus objectives
 * Shows how to use the objectives system for different demo scenarios
 */

import { createDomoAIPersona } from "../src/lib/tavus/persona-with-guardrails";
import {
  createObjectivesManager,
  getObjectivesIdFromEnv,
} from "../src/lib/tavus/objectives-manager";
import { OBJECTIVES_TEMPLATES } from "../src/lib/tavus/objectives-templates";

async function example1_CreateDemoPersona() {
  console.log("🎯 Example 1: Creating persona with demo objectives...\n");

  try {
    // Option 1: Use environment variable (recommended)
    const objectivesId = getObjectivesIdFromEnv("demo");

    if (objectivesId) {
      const persona = await createDomoAIPersona({
        objectives_id: objectivesId,
        // Optional: customize other properties
        // voice_id: "your-voice-id",
        // callback_url: "https://your-webhook.com"
      });

      console.log("✅ Created demo persona:", {
        id: persona.persona_id,
        has_guardrails: !!persona.guardrails_id,
        has_objectives: !!persona.objectives_id,
        created_at: persona.created_at,
      });

      return persona.persona_id;
    } else {
      console.log("⚠️  No demo objectives ID found in environment");
      console.log("Run: npx tsx scripts/setup-objectives.ts");
    }
  } catch (error) {
    console.error("❌ Failed to create demo persona:", error);
    throw error;
  }
}

async function example2_CreateQualificationPersona() {
  console.log("\n🎯 Example 2: Creating lead qualification persona...\n");

  try {
    // Create objectives on-the-fly
    const manager = createObjectivesManager();
    const objectives = await manager.createObjectives(
      OBJECTIVES_TEMPLATES.LEAD_QUALIFICATION
    );

    const persona = await createDomoAIPersona({
      objectives_id: objectives.uuid,
      system_prompt: `You are a friendly lead qualification assistant. Your goal is to understand if visitors are a good fit for our product and guide them to the appropriate next step.

Focus on being helpful and conversational while gathering the information needed to qualify them properly.`,
    });

    console.log("✅ Created qualification persona:", {
      id: persona.persona_id,
      objectives_id: objectives.uuid,
      objectives_count: objectives.data?.length || 0,
    });

    return persona.persona_id;
  } catch (error) {
    console.error("❌ Failed to create qualification persona:", error);
    throw error;
  }
}

async function example3_CreateSupportPersona() {
  console.log("\n🎯 Example 3: Creating customer support persona...\n");

  try {
    const objectivesId = getObjectivesIdFromEnv("support");

    if (!objectivesId) {
      // Create support objectives if not found
      const manager = createObjectivesManager();
      const objectives = await manager.createObjectives(
        OBJECTIVES_TEMPLATES.CUSTOMER_SUPPORT
      );

      const persona = await createDomoAIPersona({
        objectives_id: objectives.uuid,
        system_prompt: `You are a helpful customer support assistant. Your goal is to help existing customers solve problems, learn new features, and get the most value from the product.

Be patient, thorough, and always confirm that their issue is resolved before ending the conversation.`,
      });

      console.log("✅ Created support persona:", {
        id: persona.persona_id,
        objectives_id: persona.objectives_id,
      });

      return persona.persona_id;
    } else {
      const persona = await createDomoAIPersona({
        objectives_id: objectivesId,
      });

      console.log("✅ Created support persona with existing objectives:", {
        id: persona.persona_id,
        objectives_id: persona.objectives_id,
      });

      return persona.persona_id;
    }
  } catch (error) {
    console.error("❌ Failed to create support persona:", error);
    throw error;
  }
}

async function example4_ManageObjectives() {
  console.log("\n🎯 Example 4: Managing objectives directly...\n");

  try {
    const manager = createObjectivesManager();

    // List all objectives
    const allObjectives = await manager.getAllObjectives();
    console.log(`📋 You have ${allObjectives.data.length} objectives sets:`);

    allObjectives.data.forEach((obj, index) => {
      console.log(`  ${index + 1}. ID: ${obj.uuid}`);
      console.log(`     Objectives: ${obj.objectives.length}`);
      console.log(
        `     Created: ${new Date(obj.created_at).toLocaleDateString()}`
      );
      console.log(
        `     First objective: ${obj.objectives[0]?.objective_name || "None"}`
      );
      console.log("");
    });

    // Get details of first objectives set
    if (allObjectives.data.length > 0) {
      const firstObj = allObjectives.data[0];
      const details = await manager.getObjectives(firstObj.uuid);

      console.log(`📋 Details for objectives ${details.uuid}:`);
      console.log(`   Total objectives: ${details.objectives.length}`);
      console.log(`   Objective flow:`);

      details.objectives.forEach((obj, index) => {
        console.log(`     ${index + 1}. ${obj.objective_name}`);
        console.log(`        Mode: ${obj.confirmation_mode}`);
        console.log(
          `        Variables: ${obj.output_variables?.join(", ") || "None"}`
        );
        if (obj.next_required_objectives?.length) {
          console.log(
            `        Next: ${obj.next_required_objectives.join(", ")}`
          );
        }
        if (obj.next_conditional_objectives) {
          console.log(
            `        Conditional: ${Object.keys(
              obj.next_conditional_objectives
            ).join(", ")}`
          );
        }
        console.log("");
      });
    }
  } catch (error) {
    console.error("❌ Failed to manage objectives:", error);
    throw error;
  }
}

async function main() {
  console.log("🚀 Tavus Objectives Examples\n");

  try {
    // Run examples
    await example1_CreateDemoPersona();
    await example2_CreateQualificationPersona();
    await example3_CreateSupportPersona();
    await example4_ManageObjectives();

    console.log("\n🎉 All examples completed successfully!");
    console.log("\n💡 Next steps:");
    console.log(
      "1. Set up objectives with: npx tsx scripts/setup-objectives.ts"
    );
    console.log("2. Add objectives IDs to your .env.local file");
    console.log("3. Create personas with structured conversation flows");
    console.log("4. Test the objective-driven conversations");
    console.log("5. Monitor objective completion via webhooks");
  } catch (error) {
    console.error("\n❌ Examples failed. Make sure you have:");
    console.log("1. TAVUS_API_KEY environment variable set");
    console.log("2. Valid Tavus API access with objectives permissions");
    console.log("3. Run setup scripts if needed");
  }
}

if (require.main === module) {
  main();
}
