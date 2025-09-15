import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { ensureAllPersonasHaveRaven, summarizePerceptionStatus } from '@/lib/tavus/ensure-raven-perception';

/**
 * API to ensure all user's personas have raven-0 perception analysis enabled
 * GET: Check status of all personas
 * POST: Update all personas to use raven-0
 */

async function handleGET(req: NextRequest) {
  try {
    const supabase = createClient();
    
    // Check authentication
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get all user's demos with persona IDs
    const { data: demos, error } = await supabase
      .from('demos')
      .select('id, name, tavus_persona_id')
      .eq('user_id', user.id)
      .not('tavus_persona_id', 'is', null);

    if (error) {
      throw error;
    }

    if (!demos || demos.length === 0) {
      return NextResponse.json({
        message: 'No demos with personas found',
        summary: {
          total: 0,
          already_enabled: 0,
          successfully_updated: 0,
          failed: 0,
          errors: []
        },
        personas: []
      });
    }

    // Get unique persona IDs
    const personaIds = [...new Set(demos.map(d => d.tavus_persona_id).filter(Boolean))];
    
    // Check status of all personas (without updating)
    const { checkPersonaPerception } = await import('@/lib/tavus/ensure-raven-perception');
    const results = [];
    
    for (const personaId of personaIds) {
      const status = await checkPersonaPerception(personaId);
      const associatedDemos = demos.filter(d => d.tavus_persona_id === personaId);
      
      results.push({
        ...status,
        associated_demos: associatedDemos.map(d => ({ id: d.id, name: d.name }))
      });
    }

    const summary = summarizePerceptionStatus(results);

    return NextResponse.json({
      message: 'Perception status check completed',
      summary,
      personas: results
    });

  } catch (error) {
    console.error('Error checking perception status:', error);
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

    const { personaIds, demoId } = await req.json();

    let targetPersonaIds: string[] = [];

    if (personaIds && Array.isArray(personaIds)) {
      // Use provided persona IDs
      targetPersonaIds = personaIds;
    } else if (demoId) {
      // Get persona ID from specific demo
      const { data: demo } = await supabase
        .from('demos')
        .select('tavus_persona_id')
        .eq('id', demoId)
        .eq('user_id', user.id)
        .single();

      if (demo?.tavus_persona_id) {
        targetPersonaIds = [demo.tavus_persona_id];
      }
    } else {
      // Get all user's persona IDs
      const { data: demos } = await supabase
        .from('demos')
        .select('tavus_persona_id')
        .eq('user_id', user.id)
        .not('tavus_persona_id', 'is', null);

      if (demos) {
        targetPersonaIds = [...new Set(demos.map(d => d.tavus_persona_id).filter(Boolean))];
      }
    }

    if (targetPersonaIds.length === 0) {
      return NextResponse.json({
        message: 'No personas found to update',
        summary: {
          total: 0,
          already_enabled: 0,
          successfully_updated: 0,
          failed: 0,
          errors: []
        },
        results: []
      });
    }

    console.log(`🔄 Updating ${targetPersonaIds.length} personas to use raven-0 perception model`);

    // Update all personas to use raven-0
    const results = await ensureAllPersonasHaveRaven(targetPersonaIds);
    const summary = summarizePerceptionStatus(results);

    console.log(`✅ Perception update completed:`, summary);

    return NextResponse.json({
      message: 'Perception model update completed',
      summary,
      results
    });

  } catch (error) {
    console.error('Error updating perception models:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}

export const GET = handleGET;
export const POST = handlePOST;