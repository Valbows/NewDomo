/**
 * API Route to Update Demo Persona ID
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase';
import { demoService } from '@/lib/services/demos';

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

    // Use demo service to update persona
    const result = await demoService.updateDemoPersona(params.demoId, user.id, tavus_persona_id);

    if (!result.success) {
      const status = result.code === 'NOT_FOUND' ? 404 : 500;
      return NextResponse.json({ error: result.error }, { status });
    }

    console.log(`✅ Updated demo ${params.demoId} with persona ${tavus_persona_id}`);

    return NextResponse.json({
      success: true,
      demo: result.data,
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