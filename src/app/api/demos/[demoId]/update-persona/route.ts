/**
 * API Route to Update Demo Persona ID
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function POST(
  request: NextRequest,
  { params }: { params: { demoId: string } }
) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { tavus_persona_id } = body;

    if (!tavus_persona_id) {
      return NextResponse.json(
        { error: 'tavus_persona_id is required' },
        { status: 400 }
      );
    }

    // Update the demo with new persona ID
    const { data, error } = await supabase
      .from('demos')
      .update({ tavus_persona_id })
      .eq('id', params.demoId)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) {
      console.error('Error updating demo persona:', error);
      return NextResponse.json(
        { error: 'Failed to update demo persona' },
        { status: 500 }
      );
    }

    if (!data) {
      return NextResponse.json({ error: 'Demo not found' }, { status: 404 });
    }

    console.log(`✅ Updated demo ${params.demoId} with persona ${tavus_persona_id}`);

    return NextResponse.json({
      success: true,
      demo: data,
      message: 'Demo persona updated successfully'
    });

  } catch (error) {
    console.error('Error updating demo persona:', error);
    return NextResponse.json(
      { error: 'Failed to update demo persona' },
      { status: 500 }
    );
  }
}