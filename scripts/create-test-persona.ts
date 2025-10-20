#!/usr/bin/env npx tsx
/**
 * Create a test persona with objectives for manual testing
 * This script creates a persona you can immediately test with
 */

import { createDomoAIPersona } from '../src/lib/tavus/persona-with-guardrails';
import { createObjectivesManager } from '../src/lib/tavus/objectives-manager';
import { OBJECTIVES_TEMPLATES } from '../src/lib/tavus/objectives-templates';

async function createTestPersona() {
  console.log('🎭 Creating Test Persona for Manual Testing\n');

  const apiKey = process.env.TAVUS_API_KEY;
  if (!apiKey) {
    console.error('❌ TAVUS_API_KEY environment variable is required');
    console.log('Set it with: export TAVUS_API_KEY=your_api_key_here');
    process.exit(1);
  }

  try {
    console.log('📋 Step 1: Creating Demo Objectives...');
    const manager = createObjectivesManager();
    const demoObjectives = await manager.createObjectives(OBJECTIVES_TEMPLATES.PRODUCT_DEMO);
    console.log(`✅ Created objectives: ${demoObjectives.uuid}`);

    console.log('\n🎭 Step 2: Creating Test Persona...');
    const persona = await createDomoAIPersona({
      objectives_id: demoObjectives.uuid,
      system_prompt: `You are Domo A.I., a friendly product demo specialist. Your goal is to guide users through a structured product demonstration following your objectives.

## YOUR MISSION
Follow the objectives flow exactly:
1. Welcome and qualify the user
2. Show relevant product features  
3. Handle questions and objections
4. Guide to next steps and contact capture

## PERSONALITY
- Friendly and professional
- Knowledgeable about the product
- Focused on helping users understand value
- Patient with questions and concerns

## IMPORTANT RULES
- Follow your objectives in order
- Collect all required information at each step
- Use conditional branching based on user responses
- Don't skip steps or rush the process
- Make the conversation feel natural, not robotic

Remember: You have structured objectives to follow, but make the conversation feel human and helpful!`
    });

    console.log(`✅ Created persona: ${persona.persona_id}`);

    console.log('\n🎉 Test Persona Ready!');
    console.log('=' .repeat(60));
    console.log(`Persona ID: ${persona.persona_id}`);
    console.log(`Objectives ID: ${demoObjectives.uuid}`);
    console.log(`Created: ${persona.created_at}`);

    console.log('\n🧪 How to Test:');
    console.log('1. Go to Tavus dashboard');
    console.log('2. Create a conversation with this persona');
    console.log('3. Start chatting and watch the structured flow!');

    console.log('\n💬 Test Conversation Starters:');
    console.log('- "Hi, I\'m interested in learning about your product"');
    console.log('- "Can you show me a demo?"');
    console.log('- "I\'m evaluating solutions for my company"');
    console.log('- "What does your product do?"');

    console.log('\n📋 Expected Flow:');
    console.log('1. Agent will ask for your name, company, role, and interests');
    console.log('2. Based on your response, will show overview or specific features');
    console.log('3. Will dive deeper into relevant features');
    console.log('4. Will handle any objections or concerns');
    console.log('5. Will show social proof if needed');
    console.log('6. Will discuss next steps (trial, demo, etc.)');
    console.log('7. Will capture your contact information');
    console.log('8. Will summarize and provide next steps');

    console.log('\n🔍 What to Watch For:');
    console.log('✅ Agent follows the exact sequence');
    console.log('✅ Agent asks for specific information at each step');
    console.log('✅ Agent remembers what you told them earlier');
    console.log('✅ Agent branches appropriately based on your responses');
    console.log('✅ Conversation feels natural despite being structured');

    console.log('\n📊 Variables Being Collected:');
    console.log('- user_name, company_name, role, company_size');
    console.log('- primary_use_case, key_interests');
    console.log('- features_shown, engagement_level');
    console.log('- objections_raised, objections_resolved');
    console.log('- next_step_preference, timeline, decision_makers');
    console.log('- email, phone, preferred_contact_method');

    console.log('\n🎯 Success Criteria:');
    console.log('- Complete all 10 objectives in order');
    console.log('- Collect all required variables');
    console.log('- Handle conditional branching correctly');
    console.log('- Maintain natural conversation flow');

    return {
      personaId: persona.persona_id,
      objectivesId: demoObjectives.uuid
    };

  } catch (error) {
    console.error('❌ Failed to create test persona:', error);
    
    if (error instanceof Error) {
      if (error.message.includes('401') || error.message.includes('403')) {
        console.log('\n🔑 Authentication Error:');
        console.log('- Check that your TAVUS_API_KEY is correct');
        console.log('- Ensure your API key has persona and objectives permissions');
      } else if (error.message.includes('400')) {
        console.log('\n📝 Request Error:');
        console.log('- Check the objectives template format');
        console.log('- Ensure all required fields are provided');
      }
    }
    
    process.exit(1);
  }
}

if (require.main === module) {
  createTestPersona();
}

export { createTestPersona };