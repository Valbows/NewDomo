import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase';
import { ensureAllPersonasHaveRaven, summarizePerceptionStatus } from '@/lib/tavus';

/**
 * Ensure Raven Perception API
 * Ensures all user personas have Raven perception model enabled
 */
export async function GET(req: NextRequest) {
  try {
    const supabase = createClient();
    
    // Check authentication
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's demos with persona IDs
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
        personas_checked: 0,
        results: []
      });
    }

    // Get unique persona IDs
    const personaIds = Array.from(new Set(demos.map(d => d.tavus_persona_id).filter(Boolean)));
    
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

    return NextResponse.json({
      message: 'Perception status check completed',
      personas_checked: personaIds.length,
      results
    });

  } catch (error) {
    console.error('Error checking perception status:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = createClient();
    
    // Check authentication
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { demoId } = await req.json();

    let targetPersonaIds: string[] = [];

    if (demoId) {
      // Get specific demo's persona
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
      // Get all user's personas
      const { data: demos } = await supabase
        .from('demos')
        .select('tavus_persona_id')
        .eq('user_id', user.id)
        .not('tavus_persona_id', 'is', null);

      if (demos) {
        targetPersonaIds = Array.from(new Set(demos.map(d => d.tavus_persona_id).filter(Boolean)));
      }
    }

    if (targetPersonaIds.length === 0) {
      return NextResponse.json({
        message: 'No personas found to update',
        updated: 0,
        results: []
      });
    }

    // Update personas to have Raven perception
    const results = await ensureAllPersonasHaveRaven(targetPersonaIds);

    return NextResponse.json({
      message: 'Raven perception update completed',
      updated: results.filter(r => r.updated).length,
      results
    });

  } catch (error) {
    console.error('Error ensuring Raven perception:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}