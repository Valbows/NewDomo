/**
 * Check Current Persona ID for Demo
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const demoId = url.searchParams.get('demoId') || 'bbd9ffac-f4b7-4df3-9b8a-a01748c9a44b';


    const supabase = createClient();

    // Get demo configuration
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


    // Check environment variables
    const envPersonaId = process.env.COMPLETE_PERSONA_ID;

    // Get persona details from Tavus if available
    let personaDetails = null;
    if (demo.tavus_persona_id) {
      try {
        const TAVUS_API_KEY = process.env.TAVUS_API_KEY || '9e3a9a6a54e44edaa2e456191ba0d0f3';
        const personaResponse = await fetch(`https://tavusapi.com/v2/personas/${demo.tavus_persona_id}`, {
          headers: { 'x-api-key': TAVUS_API_KEY }
        });
        
        if (personaResponse.ok) {
          personaDetails = await personaResponse.json();
        } else {
        }
      } catch (error) {
      }
    }

    return NextResponse.json({
      success: true,
      demo: {
        id: demo.id,
        name: demo.name,
        currentPersonaId: demo.tavus_persona_id,
        agentName: demo.agent_name,
        agentPersonality: demo.agent_personality,
        agentGreeting: demo.agent_greeting
      },
      environment: {
        personaId: envPersonaId,
        guardrailsId: process.env.DOMO_AI_GUARDRAILS_ID,
        objectivesId: process.env.DOMO_AI_OBJECTIVES_ID
      },
      persona: personaDetails ? {
        id: personaDetails.persona_id,
        name: personaDetails.persona_name,
        guardrailsId: personaDetails.guardrails_id,
        objectivesId: personaDetails.objectives_id,
        createdAt: personaDetails.created_at,
        updatedAt: personaDetails.updated_at
      } : null,
      status: {
        hasPersona: !!demo.tavus_persona_id,
        personaAccessible: !!personaDetails,
        matchesEnvironment: demo.tavus_persona_id === envPersonaId
      }
    });

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}