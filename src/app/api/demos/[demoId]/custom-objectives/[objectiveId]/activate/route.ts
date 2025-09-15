/**
 * API Route for Activating Custom Objectives
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { setActiveCustomObjective, getCustomObjective } from '@/lib/supabase/custom-objectives';

export async function POST(
  request: NextRequest,
  { params }: { params: { demoId: string; objectiveId: string } }
) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify the objective exists and belongs to the user's demo
    const objective = await getCustomObjective(params.objectiveId);
    if (!objective) {
      return NextResponse.json({ error: 'Objective not found' }, { status: 404 });
    }

    if (objective.demo_id !== params.demoId) {
      return NextResponse.json({ error: 'Objective does not belong to this demo' }, { status: 400 });
    }

    // Verify demo ownership
    const { data: demo } = await supabase
      .from('demos')
      .select('id')
      .eq('id', params.demoId)
      .eq('user_id', user.id)
      .single();

    if (!demo) {
      return NextResponse.json({ error: 'Demo not found' }, { status: 404 });
    }

    // Activate the objective
    await setActiveCustomObjective(params.objectiveId);

    return NextResponse.json({ success: true, message: 'Objective activated successfully' });
  } catch (error) {
    console.error('Error activating custom objective:', error);
    return NextResponse.json(
      { error: 'Failed to activate custom objective' },
      { status: 500 }
    );
  }
}