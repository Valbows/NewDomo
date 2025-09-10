#!/usr/bin/env npx tsx
/**
 * Create a persona with enhanced structured system prompt
 * This uses system prompt instructions instead of objectives API
 */

import { createDomoAIPersona } from '../src/lib/tavus/persona-with-guardrails';
import * as fs from 'fs';
import * as path from 'path';

async function createStructuredPersona() {
  console.log('🎭 Creating Structured Persona (System Prompt Approach)\n');

  const apiKey = process.env.TAVUS_API_KEY;
  if (!apiKey) {
    console.error('❌ TAVUS_API_KEY environment variable is required');
    process.exit(1);
  }

  try {
    // Load the structured system prompt
    const promptPath = path.join(process.cwd(), 'src', 'lib', 'tavus', 'system-prompt-structured.md');
    const structuredPrompt = fs.readFileSync(promptPath, 'utf-8');

    console.log('🎭 Creating persona with structured system prompt...');
    const persona = await createDomoAIPersona({
      system_prompt: structuredPrompt
      // Note: Not using objectives_id for this test
    });

    console.log(`✅ Created structured persona: ${persona.persona_id}`);

    console.log('\n🎉 Structured Persona Ready!');
    console.log('=' .repeat(60));
    console.log(`Persona ID: ${persona.persona_id}`);
    console.log(`Created: ${persona.created_at}`);

    console.log('\n🧪 How to Test:');
    console.log('1. Create a conversation with this persona in Tavus dashboard');
    console.log('2. Start with ANY message (even "hello")');
    console.log('3. The agent should ALWAYS respond with qualification questions');

    console.log('\n💬 Test Messages:');
    console.log('- "Hello"');
    console.log('- "Tell me about your product"');
    console.log('- "I want to see a demo"');
    console.log('- "What do you do?"');

    console.log('\n📋 Expected Response (EVERY TIME):');
    console.log('"Hi! I\'m excited to help you learn about our solution. To give you the most relevant demo, I need to understand:');
    console.log('1. What\'s your name?');
    console.log('2. What company do you work for?');
    console.log('3. What\'s your role there?');
    console.log('4. How large is your company?');
    console.log('5. What specific challenges are you trying to solve?');
    console.log('6. What features are you most interested in?"');

    console.log('\n🎯 Success Criteria:');
    console.log('- Agent ALWAYS starts with qualification questions');
    console.log('- Agent follows the 8-step flow in order');
    console.log('- Agent collects all required information');
    console.log('- Agent remembers and references collected data');

    return persona.persona_id;

  } catch (error) {
    console.error('❌ Failed to create structured persona:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  createStructuredPersona();
}

export { createStructuredPersona };