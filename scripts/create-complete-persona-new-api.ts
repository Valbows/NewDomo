#!/usr/bin/env npx tsx
/**
 * Create a complete persona with all three components using the current API key
 */

import { createDomoAIPersona } from "../src/lib/tavus/persona-with-guardrails";
import { createObjectivesManager } from "../src/lib/tavus/objectives-manager";
import { OBJECTIVES_TEMPLATES } from "../src/lib/tavus/objectives-templates";

async function createCompletePersonaWithCurrentAPI() {
  const apiKey = process.env.TAVUS_API_KEY;
  const baseUrl = process.env.TAVUS_BASE_URL || 'https://tavusapi.com/v2';
  const replicaId = process.env.TAVUS_REPLICA_ID;

  console.log("🚀 Creating complete persona with current API configuration...\n");
  console.log(`🔑 API Key: ${apiKey?.substring(0, 8)}...`);
  console.log(`📡 Base URL: ${baseUrl}`);
  console.log(`🎭 Replica ID: ${replicaId || 'Not specified'}\n`);

  if (!apiKey) {
    throw new Error('TAVUS_API_KEY environment variable is required');
  }

  try {
    // Step 1: Create objectives
    console.log("🎯 Step 1: Creating objectives...");
    const manager = createObjectivesManager();
    const objectives = await manager.createObjectives(OBJECTIVES_TEMPLATES.PRODUCT_DEMO);
    console.log(`✅ Created objectives: ${objectives.uuid}`);
    console.log(`📊 Objectives count: ${objectives.data?.length || 0}\n`);

    // Step 2: Create persona with all components
    console.log("🎭 Step 2: Creating persona with all components...");
    
    const personaConfig: any = {
      objectives_id: objectives.uuid,
      // System prompt will be auto-loaded from system_prompt.md
      // Guardrails will be auto-attached
    };

    // Add replica if specified
    if (replicaId) {
      personaConfig.default_replica_id = replicaId;
      console.log(`🎭 Using replica: ${replicaId}`);
    }

    const persona = await createDomoAIPersona(personaConfig);

    console.log("\n🎉 Complete persona created successfully!");
    console.log("📊 Persona details:", {
      persona_id: persona.persona_id,
      persona_name: persona.persona_name || 'Unnamed',
      system_prompt: persona.system_prompt ? "✅ Present" : "❌ Missing",
      guardrails_id: persona.guardrails_id || "❌ Missing",
      objectives_id: persona.objectives_id || objectives.uuid,
      default_replica_id: persona.default_replica_id || "Not set",
      created_at: persona.created_at,
    });

    // Step 3: Verify all components
    console.log("\n🔍 Verifying components...");
    
    const hasSystemPrompt = !!persona.system_prompt;
    const hasGuardrails = !!persona.guardrails_id;
    const hasObjectives = !!persona.objectives_id;
    
    console.log(`📄 System Prompt: ${hasSystemPrompt ? '✅' : '❌'}`);
    console.log(`🛡️ Guardrails: ${hasGuardrails ? '✅' : '❌'}`);
    console.log(`🎯 Objectives: ${hasObjectives ? '✅' : '❌'}`);
    
    const completeness = [hasSystemPrompt, hasGuardrails, hasObjectives].filter(Boolean).length;
    console.log(`📊 Completeness: ${completeness}/3 components`);

    if (completeness === 3) {
      console.log("\n🎉 SUCCESS: Persona has all three components!");
    } else {
      console.log("\n⚠️ WARNING: Some components are missing. May need manual fixes.");
    }

    // Step 4: Update environment variables
    console.log("\n💾 Environment variable updates:");
    console.log(`Add this to your .env.local:`);
    console.log(`COMPLETE_PERSONA_ID=${persona.persona_id}`);
    console.log(`DOMO_AI_OBJECTIVES_ID=${objectives.uuid}`);
    if (persona.guardrails_id) {
      console.log(`DOMO_AI_GUARDRAILS_ID=${persona.guardrails_id}`);
    }

    // Step 5: Test links
    console.log("\n🔗 Test your persona:");
    console.log(`Direct conversation: https://app.tavus.io/conversations/new?persona_id=${persona.persona_id}`);

    return {
      persona_id: persona.persona_id,
      objectives_id: objectives.uuid,
      guardrails_id: persona.guardrails_id,
      completeness
    };

  } catch (error) {
    console.error("❌ Failed to create complete persona:", error);
    throw error;
  }
}

async function main() {
  console.log("🚀 Complete Persona Creator (New API)\n");
  
  try {
    const result = await createCompletePersonaWithCurrentAPI();
    
    console.log("\n✨ Success! Your new complete persona is ready.");
    console.log(`🎭 Persona ID: ${result.persona_id}`);
    console.log(`📊 Completeness: ${result.completeness}/3 components`);
    
    if (result.completeness === 3) {
      console.log("\n🎯 This persona has:");
      console.log("✅ System prompt (from src/lib/tavus/system_prompt.md)");
      console.log("✅ Guardrails (Domo AI Core Guardrails)");
      console.log("✅ Objectives (Product Demo Flow)");
      console.log("\n🚀 Ready for production use!");
    }
    
  } catch (error) {
    console.error("\n❌ Creation failed. Make sure you have:");
    console.log("1. TAVUS_API_KEY environment variable set");
    console.log("2. Valid Tavus API access");
    console.log("3. All required files in src/lib/tavus/");
  }
}

if (require.main === module) {
  main();
}