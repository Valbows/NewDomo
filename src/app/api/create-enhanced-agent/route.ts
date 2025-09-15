/**
 * Enhanced Agent Creation API
 * Automatically integrates: System Prompt + Guardrails + Preset Objectives + Custom Objectives
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { wrapRouteHandlerWithSentry } from '@/lib/sentry-utils';
import { getErrorMessage, logError } from '@/lib/errors';
import { v4 as uuidv4 } from 'uuid';
import * as fs from 'fs';
import * as path from 'path';

async function handlePOST(req: NextRequest): Promise<NextResponse> {
  const supabase = createClient();

  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { demoId, agentName, agentPersonality, agentGreeting } = await req.json();

    if (!demoId || !agentName) {
      return NextResponse.json({ error: 'Demo ID and agent name are required' }, { status: 400 });
    }

    console.log('🤖 CREATING ENHANCED AGENT');
    console.log('='.repeat(50));
    console.log(`Demo ID: ${demoId}`);
    console.log(`Agent Name: ${agentName}`);

    // Step 1: Verify demo ownership
    const { data: demo, error: demoError } = await supabase
      .from('demos')
      .select('*')
      .eq('id', demoId)
      .eq('user_id', user.id)
      .single();

    if (demoError || !demo) {
      return NextResponse.json({ error: 'Demo not found or access denied' }, { status: 404 });
    }

    console.log(`✅ Demo verified: ${demo.name}`);

    // Step 2: Check for active custom objectives
    console.log('\n🎯 Checking Custom Objectives...');
    let activeCustomObjective = null;
    try {
      const { getActiveCustomObjective } = await import('@/lib/supabase/custom-objectives');
      activeCustomObjective = await getActiveCustomObjective(demoId);
      
      if (activeCustomObjective) {
        console.log(`✅ Active custom objective: ${activeCustomObjective.name}`);
        console.log(`   Steps: ${activeCustomObjective.objectives.length}`);
        console.log(`   Tavus ID: ${activeCustomObjective.tavus_objectives_id}`);
      } else {
        console.log('📋 No active custom objectives, will use preset objectives');
      }
    } catch (error) {
      console.log('⚠️  Error checking custom objectives:', error);
    }

    // Step 3: Build Enhanced System Prompt
    console.log('\n📝 Building Enhanced System Prompt...');
    
    // Read base system prompt
    const promptPath = path.join(process.cwd(), 'src', 'lib', 'tavus', 'system_prompt.md');
    const baseSystemPrompt = fs.readFileSync(promptPath, 'utf-8');
    
    // Identity section
    const identitySection = `\n\n## AGENT PROFILE\n- Name: ${agentName}\n- Personality: ${agentPersonality || 'Friendly and helpful assistant.'}\n- Initial Greeting: ${agentGreeting || 'Hello! How can I help you with the demo today?'}\n`;

    // Objectives section - combine preset objectives WITH custom objectives
    let objectivesSection = '';
    
    // Always include preset objectives as foundation
    objectivesSection = `\n\n## DEMO OBJECTIVES\n`;
    
    if (activeCustomObjective && activeCustomObjective.objectives.length > 0) {
      // Use custom objectives as primary flow
      console.log(`📋 Using custom objectives: ${activeCustomObjective.name}`);
      objectivesSection += `### Primary Flow: ${activeCustomObjective.name}\n`;
      objectivesSection += `${activeCustomObjective.description ? activeCustomObjective.description + '\n\n' : ''}`;
      objectivesSection += 'Follow these structured objectives as your primary conversation flow:\n\n';
      
      activeCustomObjective.objectives.forEach((obj, i) => {
        objectivesSection += `**${i + 1}. ${obj.objective_name}**\n`;
        objectivesSection += `- Objective: ${obj.objective_prompt}\n`;
        objectivesSection += `- Mode: ${obj.confirmation_mode} confirmation, ${obj.modality} modality\n`;
        if (obj.output_variables && obj.output_variables.length > 0) {
          objectivesSection += `- Capture: ${obj.output_variables.join(', ')}\n`;
        }
        objectivesSection += '\n';
      });
      
      // Add preset objectives as supporting guidelines
      objectivesSection += `### Supporting Guidelines (Preset Objectives)\n`;
      objectivesSection += `Always maintain these core principles throughout the conversation:\n`;
      objectivesSection += `- Welcome users and understand their needs\n`;
      objectivesSection += `- Show relevant product features and videos\n`;
      objectivesSection += `- Answer questions using knowledge base\n`;
      objectivesSection += `- Guide toward appropriate next steps\n`;
      objectivesSection += `- Capture contact information when appropriate\n\n`;
      
    } else {
      // Use preset objectives as primary when no custom objectives
      console.log(`📋 Using preset objectives as primary flow`);
      objectivesSection += `Follow these objectives throughout the conversation:\n`;
      objectivesSection += `- Welcome users and understand their needs\n`;
      objectivesSection += `- Show relevant product features and videos\n`;
      objectivesSection += `- Answer questions using knowledge base\n`;
      objectivesSection += `- Guide toward appropriate next steps\n`;
      objectivesSection += `- Capture contact information when appropriate\n\n`;
      
      // Include any simple objectives from demo metadata
      const objectivesList: string[] = Array.isArray(demo.metadata?.objectives)
        ? (demo.metadata!.objectives as string[]).filter((s) => typeof s === 'string' && s.trim()).slice(0, 5)
        : [];
      
      if (objectivesList.length > 0) {
        console.log(`📋 Including simple objectives from demo metadata`);
        objectivesSection += `### Additional Demo-Specific Objectives\n`;
        objectivesSection += `${objectivesList.map((o, i) => `- ${o.trim()}`).join('\n')}\n\n`;
      }
    }

    // Language handling guidance
    const languageSection = `\n\n## LANGUAGE HANDLING\n- Automatically detect the user's language from their utterances and respond in that language.\n- Keep all tool calls and their arguments (function names, video titles) EXACT and un-translated.\n- Do not ask the user to choose a language; infer it from context and switch seamlessly while honoring all guardrails.\n`;

    // Build enhanced system prompt
    const enhancedSystemPrompt = baseSystemPrompt + identitySection + objectivesSection + languageSection;

    console.log(`✅ Enhanced system prompt built (${enhancedSystemPrompt.length} characters)`);

    // Step 4: Create or Use Persona Based on Objectives
    console.log('\n🎭 Determining Persona Strategy...');
    
    const GUARDRAILS_ID = process.env.DOMO_AI_GUARDRAILS_ID || 'g178c7c5e032b';
    const DEFAULT_OBJECTIVES_ID = process.env.DOMO_AI_OBJECTIVES_ID || 'o4f2d4eb9b217';
    const EXISTING_PERSONA_ID = process.env.COMPLETE_PERSONA_ID || 'pe9ed46b7319';
    
    let persona: { persona_id: string };
    let objectivesId: string;
    
    if (activeCustomObjective && activeCustomObjective.tavus_objectives_id) {
      // Option A: Create new persona with custom objectives
      console.log(`🎯 Creating new persona with custom objectives: ${activeCustomObjective.name}`);
      objectivesId = activeCustomObjective.tavus_objectives_id;
      
      try {
        const personaPayload = {
          persona_name: `${agentName} - ${demo.name}`,
          system_prompt: enhancedSystemPrompt,
          objectives_id: objectivesId,
          guardrails_id: GUARDRAILS_ID,
          default_replica_id: process.env.TAVUS_REPLICA_ID,
        };

        console.log('📡 Creating Tavus persona with custom objectives...');
        const response = await fetch(`${process.env.TAVUS_BASE_URL}/personas`, {
          method: 'POST',
          headers: {
            'x-api-key': process.env.TAVUS_API_KEY!,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(personaPayload),
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error('❌ Failed to create persona with custom objectives:', errorText);
          
          // Fallback to existing persona
          console.log('⚠️  Falling back to existing persona (custom objectives will be in system prompt only)');
          persona = { persona_id: EXISTING_PERSONA_ID };
          objectivesId = DEFAULT_OBJECTIVES_ID;
        } else {
          const personaData = await response.json();
          persona = { persona_id: personaData.persona_id };
          console.log(`✅ Created new persona: ${personaData.persona_id}`);
        }
      } catch (error) {
        console.error('❌ Error creating persona:', error);
        // Fallback to existing persona
        console.log('⚠️  Falling back to existing persona');
        persona = { persona_id: EXISTING_PERSONA_ID };
        objectivesId = DEFAULT_OBJECTIVES_ID;
      }
    } else {
      // Option B: Use existing persona with preset objectives
      console.log(`📋 Using existing persona with preset objectives`);
      persona = { persona_id: EXISTING_PERSONA_ID };
      objectivesId = DEFAULT_OBJECTIVES_ID;
      
      // Verify the existing persona is accessible
      try {
        const response = await fetch(`${process.env.TAVUS_BASE_URL}/personas/${EXISTING_PERSONA_ID}`, {
          method: 'GET',
          headers: {
            'x-api-key': process.env.TAVUS_API_KEY!,
            'Content-Type': 'application/json',
          },
        });

        if (response.ok) {
          const personaData = await response.json();
          console.log(`✅ Verified existing persona: ${personaData.persona_name}`);
        } else {
          console.log('⚠️  Could not verify existing persona, but proceeding');
        }
      } catch (error) {
        console.log('⚠️  Error verifying existing persona, but proceeding');
      }
    }

    console.log(`Final Configuration:`);
    console.log(`   Persona ID: ${persona.persona_id}`);
    console.log(`   Guardrails ID: ${GUARDRAILS_ID}`);
    console.log(`   Objectives ID: ${objectivesId}`);

    // Step 5: Update Demo with Agent Configuration
    console.log('\n📊 Updating Demo Configuration...');
    
    const { error: updateError } = await supabase
      .from('demos')
      .update({
        tavus_persona_id: persona.persona_id,
        agent_name: agentName,
        agent_personality: agentPersonality,
        agent_greeting: agentGreeting,
        metadata: {
          ...demo.metadata,
          agentName,
          agentPersonality,
          agentGreeting,
          tavusPersonaId: persona.persona_id,
          agentCreatedAt: new Date().toISOString(),
          hasCustomObjectives: !!activeCustomObjective,
          customObjectivesId: activeCustomObjective?.id || null,
          guardrailsId: GUARDRAILS_ID,
          objectivesId: objectivesId
        }
      })
      .eq('id', demoId);

    if (updateError) {
      console.error('❌ Demo update failed:', updateError);
      return NextResponse.json({ error: 'Failed to update demo configuration' }, { status: 500 });
    }

    console.log('✅ Demo updated with agent configuration');
    console.log(`   Database now has tavus_persona_id: ${persona.persona_id}`);
    
    // Verify the update worked
    const { data: updatedDemo, error: verifyError } = await supabase
      .from('demos')
      .select('tavus_persona_id')
      .eq('id', demoId)
      .single();
    
    if (verifyError) {
      console.error('⚠️  Could not verify demo update:', verifyError);
    } else {
      console.log(`✅ Verified: Demo ${demoId} now has persona ${updatedDemo.tavus_persona_id}`);
    }

    // Step 6: Success Response
    console.log('\n' + '='.repeat(50));
    console.log('🎉 AGENT CONFIGURED SUCCESSFULLY');
    console.log('='.repeat(50));
    console.log(`Agent Name: ${agentName}`);
    console.log(`Persona ID: ${persona.persona_id}`);
    console.log(`Guardrails: ${GUARDRAILS_ID}`);
    console.log(`Active Objectives: ${objectivesId}`);
    
    if (activeCustomObjective && persona.persona_id !== EXISTING_PERSONA_ID) {
      console.log(`✅ NEW PERSONA CREATED with custom objectives: ${activeCustomObjective.name}`);
      console.log(`   Custom Objectives: ${activeCustomObjective.objectives.length} steps`);
      console.log(`   Persona has the actual custom objectives baked in`);
    } else if (activeCustomObjective && persona.persona_id === EXISTING_PERSONA_ID) {
      console.log(`⚠️  FALLBACK: Using existing persona (custom objectives in system prompt only)`);
      console.log(`   Custom objectives may not work as expected`);
    } else {
      console.log(`✅ EXISTING PERSONA used with preset objectives`);
      console.log(`   Preset Objectives: ${DEFAULT_OBJECTIVES_ID}`);
    }

    return NextResponse.json({
      success: true,
      agentId: persona.persona_id,
      personaId: persona.persona_id,
      demoId,
      configuration: {
        systemPrompt: true,
        guardrails: GUARDRAILS_ID,
        presetObjectives: DEFAULT_OBJECTIVES_ID,
        activeObjectives: objectivesId,
        customObjectives: activeCustomObjective ? {
          id: activeCustomObjective.id,
          name: activeCustomObjective.name,
          steps: activeCustomObjective.objectives.length,
          tavusId: activeCustomObjective.tavus_objectives_id
        } : null,
        enhancedSystemPrompt: enhancedSystemPrompt.length
      },
      message: activeCustomObjective && persona.persona_id !== EXISTING_PERSONA_ID
        ? `New persona created with custom objectives: ${activeCustomObjective.name}`
        : activeCustomObjective && persona.persona_id === EXISTING_PERSONA_ID
        ? `Using existing persona (custom objectives in system prompt only)`
        : 'Using existing persona with preset objectives',
      personaType: activeCustomObjective && persona.persona_id !== EXISTING_PERSONA_ID ? 'new' : 'existing'
    });

  } catch (error: unknown) {
    logError(error, 'Enhanced Agent Creation Error');
    const message = getErrorMessage(error);
    console.error('❌ Enhanced agent creation failed:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export const POST = wrapRouteHandlerWithSentry(handlePOST, {
  method: 'POST',
  parameterizedRoute: '/api/create-enhanced-agent',
});