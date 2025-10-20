import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

/**
 * Quick fix API to configure personas for raven-0 perception analysis
 * GET: Check all demos and their persona configurations
 * POST: Fix persona configurations by setting perception_model to raven-0
 */

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
      return NextResponse.json({ error: 'Tavus API key not configured' }, { status: 500 });
    }

    // Get all user's demos with persona IDs
    const { data: demos, error } = await supabase
      .from('demos')
      .select('id, name, tavus_persona_id, tavus_conversation_id')
      .eq('user_id', user.id)
      .not('tavus_persona_id', 'is', null);

    if (error) {
      throw error;
    }

    const results = [];

    for (const demo of demos || []) {
      try {
        const personaResponse = await fetch(
          `https://tavusapi.com/v2/personas/${demo.tavus_persona_id}`,
          {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              'x-api-key': tavusApiKey,
            },
          }
        );

        if (personaResponse.ok) {
          const personaData = await personaResponse.json();
          results.push({
            demo_id: demo.id,
            demo_name: demo.name,
            persona_id: demo.tavus_persona_id,
            persona_name: personaData.name,
            perception_model: personaData.perception_model || null,
            raven_enabled: personaData.perception_model === 'raven-0',
            has_conversation: !!demo.tavus_conversation_id,
            needs_fix: personaData.perception_model !== 'raven-0'
          });
        } else {
          results.push({
            demo_id: demo.id,
            demo_name: demo.name,
            persona_id: demo.tavus_persona_id,
            error: `Failed to fetch persona: ${personaResponse.status}`
          });
        }
      } catch (error) {
        results.push({
          demo_id: demo.id,
          demo_name: demo.name,
          persona_id: demo.tavus_persona_id,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    const needsFix = results.filter(r => r.needs_fix).length;
    const ravenEnabled = results.filter(r => r.raven_enabled).length;

    return NextResponse.json({
      summary: {
        total_demos: results.length,
        raven_enabled: ravenEnabled,
        needs_fix: needsFix
      },
      demos: results
    });

  } catch (error) {
    console.error('Error checking raven config:', error);
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
      return NextResponse.json({ error: 'Tavus API key not configured' }, { status: 500 });
    }

    const { demoId, personaId, fixAll = false } = await req.json();

    let targetPersonas: string[] = [];

    if (fixAll) {
      // Get all user's demos with persona IDs that need fixing
      const { data: demos } = await supabase
        .from('demos')
        .select('tavus_persona_id')
        .eq('user_id', user.id)
        .not('tavus_persona_id', 'is', null);

      if (demos) {
        targetPersonas = Array.from(new Set(demos.map(d => d.tavus_persona_id).filter(Boolean)));
      }
    } else if (demoId) {
      // Get persona ID from demo
      const { data: demo } = await supabase
        .from('demos')
        .select('tavus_persona_id')
        .eq('id', demoId)
        .eq('user_id', user.id)
        .single();

      if (demo?.tavus_persona_id) {
        targetPersonas = [demo.tavus_persona_id];
      }
    } else if (personaId) {
      targetPersonas = [personaId];
    }

    if (targetPersonas.length === 0) {
      return NextResponse.json({ 
        error: 'No personas found to fix' 
      }, { status: 400 });
    }

    const results = [];

    for (const persona of targetPersonas) {
      try {
        // First check if it needs fixing
        const checkResponse = await fetch(
          `https://tavusapi.com/v2/personas/${persona}`,
          {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              'x-api-key': tavusApiKey,
            },
          }
        );

        if (!checkResponse.ok) {
          results.push({
            persona_id: persona,
            action: 'failed',
            error: `Failed to fetch persona: ${checkResponse.status}`
          });
          continue;
        }

        const personaData = await checkResponse.json();

        if (personaData.perception_model === 'raven-0') {
          results.push({
            persona_id: persona,
            persona_name: personaData.name,
            action: 'skipped',
            reason: 'Already configured with raven-0'
          });
          continue;
        }

        // Update to raven-0
        const updateResponse = await fetch(
          `https://tavusapi.com/v2/personas/${persona}`,
          {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
              'x-api-key': tavusApiKey,
            },
            body: JSON.stringify({
              perception_model: 'raven-0'
            })
          }
        );

        if (updateResponse.ok) {
          results.push({
            persona_id: persona,
            persona_name: personaData.name,
            action: 'updated',
            old_model: personaData.perception_model || null,
            new_model: 'raven-0'
          });
        } else {
          const errorText = await updateResponse.text();
          results.push({
            persona_id: persona,
            persona_name: personaData.name,
            action: 'failed',
            error: `Update failed: ${updateResponse.status} - ${errorText}`
          });
        }

      } catch (error) {
        results.push({
          persona_id: persona,
          action: 'failed',
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    const updated = results.filter(r => r.action === 'updated').length;
    const failed = results.filter(r => r.action === 'failed').length;
    const skipped = results.filter(r => r.action === 'skipped').length;

    return NextResponse.json({
      summary: {
        total_processed: results.length,
        updated,
        skipped,
        failed
      },
      results
    });

  } catch (error) {
    console.error('Error fixing raven config:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}

export const GET = handleGET;
export const POST = handlePOST;