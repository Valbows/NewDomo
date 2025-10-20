/**
 * Get Persona Information API (Authenticated)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(request.url);
    const demoId = url.searchParams.get('demoId') || 'bbd9ffac-f4b7-4df3-9b8a-a01748c9a44b';

    // Get demo info
    const { data: demo, error: demoError } = await supabase
      .from('demos')
      .select('*')
      .eq('id', demoId)
      .eq('user_id', user.id)
      .single();

    if (demoError || !demo) {
      return NextResponse.json({ error: 'Demo not found' }, { status: 404 });
    }

    // Get custom objectives
    const { getActiveCustomObjective } = await import('@/lib/supabase/custom-objectives');
    const activeCustomObjective = await getActiveCustomObjective(demoId);

    // Get Tavus persona info
    let tavusPersona = null;
    if (demo.tavus_persona_id) {
      try {
        const TAVUS_API_KEY = process.env.TAVUS_API_KEY || '9e3a9a6a54e44edaa2e456191ba0d0f3';
        const response = await fetch(`https://tavusapi.com/v2/personas/${demo.tavus_persona_id}`, {
          headers: { 'x-api-key': TAVUS_API_KEY }
        });
        
        if (response.ok) {
          tavusPersona = await response.json();
        }
      } catch (error) {
        console.log('Could not fetch Tavus persona info');
      }
    }

    return NextResponse.json({
      success: true,
      persona: {
        id: demo.tavus_persona_id,
        name: tavusPersona?.persona_name || `${demo.agent_name} - ${demo.name}`,
        agentName: demo.agent_name,
        agentPersonality: demo.agent_personality,
        agentGreeting: demo.agent_greeting,
        createdAt: demo.metadata?.agentCreatedAt,
        systemPromptLength: tavusPersona?.system_prompt?.length || 0,
        guardrailsId: tavusPersona?.guardrails_id || demo.metadata?.guardrailsId,
        objectivesId: tavusPersona?.objectives_id || demo.metadata?.objectivesId
      },
      demo: {
        id: demo.id,
        name: demo.name,
        hasCustomObjectives: !!activeCustomObjective
      },
      customObjectives: activeCustomObjective ? {
        id: activeCustomObjective.id,
        name: activeCustomObjective.name,
        description: activeCustomObjective.description,
        steps: activeCustomObjective.objectives.length,
        tavusObjectivesId: activeCustomObjective.tavus_objectives_id,
        isActive: activeCustomObjective.is_active
      } : null,
      integration: {
        systemPrompt: !!tavusPersona?.system_prompt,
        guardrails: !!tavusPersona?.guardrails_id,
        objectives: !!tavusPersona?.objectives_id,
        customObjectivesActive: !!activeCustomObjective,
        customObjectivesMatch: activeCustomObjective?.tavus_objectives_id === tavusPersona?.objectives_id
      }
    });

  } catch (error) {
    console.error('Error getting persona info:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}