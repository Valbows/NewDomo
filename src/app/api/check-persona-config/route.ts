import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

async function handleGET(req: NextRequest) {
  try {
    const supabase = createClient();
    
    // Check authentication
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const tavusApiKey = process.env.TAVUS_API_KEY;
    if (!tavusApiKey) {
      return NextResponse.json({ error: 'Domo API key not configured' }, { status: 500 });
    }

    const url = new URL(req.url);
    const demoId = url.searchParams.get('demoId');
    const personaId = url.searchParams.get('personaId');

    let targetPersonaId = personaId;

    // If demoId provided, get persona from demo
    if (demoId && !personaId) {
      const { data: demo } = await supabase
        .from('demos')
        .select('tavus_persona_id')
        .eq('id', demoId)
        .eq('user_id', user.id)
        .single();

      if (!demo?.tavus_persona_id) {
        return NextResponse.json({ 
          error: 'Demo not found or no persona associated' 
        }, { status: 404 });
      }

      targetPersonaId = demo.tavus_persona_id;
    }

    if (!targetPersonaId) {
      return NextResponse.json({ 
        error: 'personaId or demoId is required' 
      }, { status: 400 });
    }

    console.log(`🔍 Checking persona configuration: ${targetPersonaId}`);

    // Fetch persona details from Tavus
    const personaResponse = await fetch(
      `https://tavusapi.com/v2/personas/${targetPersonaId}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': tavusApiKey,
        },
      }
    );

    if (!personaResponse.ok) {
      const errorText = await personaResponse.text();
      return NextResponse.json({ 
        error: 'Failed to fetch persona',
        details: errorText,
        status: personaResponse.status
      }, { status: personaResponse.status });
    }

    const personaData = await personaResponse.json();

    console.log(`📊 Persona data:`, {
      persona_id: personaData.persona_id,
      name: personaData.name,
      perception_model: personaData.perception_model || 'not set',
      default_replica_id: personaData.default_replica_id || 'not set'
    });

    // Analyze the configuration
    const analysis = {
      persona_id: targetPersonaId,
      perception_model: personaData.perception_model || null,
      perception_analysis_enabled: personaData.perception_model === 'raven-0',
      has_default_replica: !!personaData.default_replica_id,
      default_replica_id: personaData.default_replica_id || null,
      recommendations: [] as string[]
    };

    // Add recommendations
    if (!analysis.perception_analysis_enabled) {
      analysis.recommendations.push('Set perception_model to "raven-0" to enable perception analysis');
    }

    if (!analysis.has_default_replica) {
      analysis.recommendations.push('Set a default_replica_id to avoid needing TAVUS_REPLICA_ID env var');
    }

    return NextResponse.json({
      success: true,
      analysis,
      raw_persona_data: personaData
    });

  } catch (error) {
    console.error('Error checking persona config:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}

async function handlePOST(req: NextRequest) {
  try {
    const supabase = createClient();
    
    // Check authentication
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const tavusApiKey = process.env.TAVUS_API_KEY;
    if (!tavusApiKey) {
      return NextResponse.json({ error: 'Domo API key not configured' }, { status: 500 });
    }

    const { personaId, perception_model, default_replica_id } = await req.json();

    if (!personaId) {
      return NextResponse.json({ error: 'personaId is required' }, { status: 400 });
    }

    // Prepare update payload
    const updatePayload: any = {};
    if (perception_model !== undefined) {
      updatePayload.perception_model = perception_model;
    }
    if (default_replica_id !== undefined) {
      updatePayload.default_replica_id = default_replica_id;
    }

    if (Object.keys(updatePayload).length === 0) {
      return NextResponse.json({ 
        error: 'No update fields provided (perception_model, default_replica_id)' 
      }, { status: 400 });
    }

    console.log(`🔄 Updating persona ${personaId}:`, updatePayload);

    // Update persona via Tavus API
    const updateResponse = await fetch(
      `https://tavusapi.com/v2/personas/${personaId}`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': tavusApiKey,
        },
        body: JSON.stringify(updatePayload)
      }
    );

    if (!updateResponse.ok) {
      const errorText = await updateResponse.text();
      return NextResponse.json({ 
        error: 'Failed to update persona',
        details: errorText,
        status: updateResponse.status
      }, { status: updateResponse.status });
    }

    const updatedPersona = await updateResponse.json();

    console.log(`✅ Persona updated successfully`);

    return NextResponse.json({
      success: true,
      message: 'Persona updated successfully',
      updated_fields: updatePayload,
      persona_data: updatedPersona
    });

  } catch (error) {
    console.error('Error updating persona config:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}

export const GET = handleGET;
export const POST = handlePOST;
