#!/usr/bin/env npx tsx
/**
 * Setup Guardrails Script
 * Creates Tavus guardrails from your templates and shows how to use them
 */

import { createGuardrailsManager, GuardrailsManager } from '../src/lib/tavus/guardrails-manager';
import { ALL_GUARDRAIL_TEMPLATES } from '../src/lib/tavus/guardrails-templates';

async function main() {
  console.log('🚀 Setting up Tavus Guardrails...\n');

  try {
    const manager = createGuardrailsManager();

    // Create or get Domo AI guardrails
    console.log('📋 Setting up Domo AI guardrails...');
    const domoGuardrailsId = await manager.ensureDomoAIGuardrails();

    // Optionally create demo flow guardrails
    console.log('\n📋 Setting up Demo Flow guardrails...');
    let demoFlowGuardrailsId: string;
    const existingDemoFlow = await manager.findGuardrailsByName(ALL_GUARDRAIL_TEMPLATES.DEMO_FLOW_GUARDRAILS.name);
    
    if (existingDemoFlow) {
      console.log(`Using existing demo flow guardrails: ${existingDemoFlow.uuid}`);
      demoFlowGuardrailsId = existingDemoFlow.uuid;
    } else {
      const created = await manager.createGuardrails(ALL_GUARDRAIL_TEMPLATES.DEMO_FLOW_GUARDRAILS);
      console.log(`Created demo flow guardrails: ${created.uuid}`);
      demoFlowGuardrailsId = created.uuid;
    }

    // Show all guardrails
    console.log('\n📊 All your guardrails:');
    const allGuardrails = await manager.getAllGuardrails();
    allGuardrails.data.forEach(g => {
      console.log(`  • ${g.name} (${g.uuid}) - Created: ${new Date(g.created_at).toLocaleDateString()}`);
    });

    // Show usage examples
    console.log('\n💡 Usage Examples:');
    console.log('\n1. Create persona with guardrails:');
    console.log(`   const persona = await createPersona({`);
    console.log(`     system_prompt: "You are Domo A.I., an intelligent demo assistant...",`);
    console.log(`     guardrails_id: "${domoGuardrailsId}"`);
    console.log(`   });`);

    console.log('\n2. Add guardrails to existing persona:');
    console.log(`   await updatePersona(personaId, {`);
    console.log(`     guardrails_id: "${domoGuardrailsId}"`);
    console.log(`   });`);

    console.log('\n3. Environment variables to set:');
    console.log(`   DOMO_AI_GUARDRAILS_ID="${domoGuardrailsId}"`);
    console.log(`   DEMO_FLOW_GUARDRAILS_ID="${demoFlowGuardrailsId}"`);

    console.log('\n✅ Guardrails setup complete!');
    console.log('\nNext steps:');
    console.log('1. Update your persona creation code to use guardrails_id');
    console.log('2. Remove guardrails from system_prompt.md (keep core instructions)');
    console.log('3. Test your personas with the new guardrails');

  } catch (error) {
    console.error('❌ Error setting up guardrails:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

export { main as setupGuardrails };