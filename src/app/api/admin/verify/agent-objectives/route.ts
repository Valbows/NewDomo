/**
 * API to Verify Agent was Created with Custom Objectives
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const demoId = url.searchParams.get('demoId') || 'bbd9ffac-f4b7-4df3-9b8a-a01748c9a44b';

    console.log('🔍 VERIFYING AGENT OBJECTIVES INTEGRATION');
    console.log('='.repeat(60));
    console.log(`Demo ID: ${demoId}`);

    const supabase = createClient();

    // Step 1: Get demo configuration
    const { data: demo, error: demoError } = await supabase
      .from('demos')
      .select('*')
      .eq('id', demoId)
      .single();

    if (demoError || !demo) {
      return NextResponse.json({ 
        success: false, 
        error: 'Demo not found' 
      }, { status: 404 });
    }

    // Step 2: Check custom objectives
    const { getActiveCustomObjective } = await import('@/lib/supabase/custom-objectives');
    const activeCustomObjective = await getActiveCustomObjective(demoId);

    // Step 3: Verify Tavus persona
    let personaInfo = null;
    if (demo.tavus_persona_id) {
      try {
        const TAVUS_API_KEY = process.env.TAVUS_API_KEY || '9e3a9a6a54e44edaa2e456191ba0d0f3';
        const personaResponse = await fetch(`https://tavusapi.com/v2/personas/${demo.tavus_persona_id}`, {
          headers: { 'x-api-key': TAVUS_API_KEY }
        });
        
        if (personaResponse.ok) {
          personaInfo = await personaResponse.json();
        }
      } catch (error) {
        console.log('Could not fetch persona info from Tavus');
      }
    }

    // Step 4: Build verification result
    const verification = {
      demo: {
        id: demo.id,
        name: demo.name,
        personaId: demo.tavus_persona_id,
        agentName: demo.agent_name,
        hasCustomObjectives: demo.metadata?.hasCustomObjectives || false,
        customObjectivesId: demo.metadata?.customObjectivesId || null,
        guardrailsId: demo.metadata?.guardrailsId || null,
        objectivesId: demo.metadata?.objectivesId || null
      },
      customObjectives: activeCustomObjective ? {
        id: activeCustomObjective.id,
        name: activeCustomObjective.name,
        description: activeCustomObjective.description,
        steps: activeCustomObjective.objectives.length,
        tavusObjectivesId: activeCustomObjective.tavus_objectives_id,
        isActive: activeCustomObjective.is_active,
        objectives: activeCustomObjective.objectives.map((obj, i) => ({
          step: i + 1,
          name: obj.objective_name,
          prompt: obj.objective_prompt.substring(0, 100) + '...',
          mode: obj.confirmation_mode,
          modality: obj.modality,
          variables: obj.output_variables || []
        }))
      } : null,
      persona: personaInfo ? {
        id: personaInfo.persona_id,
        name: personaInfo.persona_name,
        guardrailsId: personaInfo.guardrails_id,
        objectivesId: personaInfo.objectives_id,
        systemPromptLength: personaInfo.system_prompt?.length || 0
      } : null,
      integration: {
        hasDemo: !!demo,
        hasPersona: !!demo.tavus_persona_id,
        hasActiveCustomObjectives: !!activeCustomObjective,
        customObjectivesMatchPersona: activeCustomObjective?.tavus_objectives_id === personaInfo?.objectives_id,
        guardrailsConfigured: !!personaInfo?.guardrails_id,
        systemPromptConfigured: !!(personaInfo?.system_prompt?.length > 0)
      }
    };

    // Step 5: Determine success
    const isFullyIntegrated = 
      verification.integration.hasDemo &&
      verification.integration.hasPersona &&
      verification.integration.systemPromptConfigured &&
      verification.integration.guardrailsConfigured &&
      (verification.integration.hasActiveCustomObjectives ? 
        verification.integration.customObjectivesMatchPersona : true);

    console.log('📊 Verification Results:');
    console.log(`   Demo: ${verification.integration.hasDemo ? '✅' : '❌'}`);
    console.log(`   Persona: ${verification.integration.hasPersona ? '✅' : '❌'}`);
    console.log(`   System Prompt: ${verification.integration.systemPromptConfigured ? '✅' : '❌'}`);
    console.log(`   Guardrails: ${verification.integration.guardrailsConfigured ? '✅' : '❌'}`);
    console.log(`   Custom Objectives: ${verification.integration.hasActiveCustomObjectives ? '✅' : '📋 Using defaults'}`);
    
    if (verification.integration.hasActiveCustomObjectives) {
      console.log(`   Objectives Match: ${verification.integration.customObjectivesMatchPersona ? '✅' : '❌'}`);
    }

    return NextResponse.json({
      success: isFullyIntegrated,
      message: isFullyIntegrated 
        ? 'Agent is fully integrated with all components!'
        : 'Agent integration has some issues',
      verification,
      expectedBehavior: verification.customObjectives ? {
        firstMessage: "Hi I'm Domo, your AI sales engineer. Can I confirm your first name, last name, email address, and position at your company?",
        flow: [
          "1. Greeting & Qualification",
          "2. Product Interest Discovery", 
          "3. Demo Video Showcase",
          "4. Call to Action"
        ]
      } : {
        firstMessage: "Hello! I'm Domo, your AI sales engineer. How can I help you with the demo today?",
        flow: ["Standard demo objectives"]
      }
    });

  } catch (error) {
    console.error('❌ Verification failed:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}