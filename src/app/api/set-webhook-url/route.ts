import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

/**
 * Helper API to set webhook URL for specific objectives
 * POST /api/set-webhook-url
 * Body: { objectiveId: string, objectiveName: string, webhookUrl: string }
 */
export async function POST(request: NextRequest) {
  try {
    const { objectiveId, objectiveName, webhookUrl } = await request.json();

    if (!objectiveId || !objectiveName) {
      return NextResponse.json(
        { error: 'objectiveId and objectiveName are required' },
        { status: 400 }
      );
    }

    // Get the current objective
    const { data: objective, error: fetchError } = await supabase
      .from('custom_objectives')
      .select('*')
      .eq('id', objectiveId)
      .single();

    if (fetchError || !objective) {
      return NextResponse.json(
        { error: 'Objective not found' },
        { status: 404 }
      );
    }

    // Update the specific objective step with webhook URL
    const updatedObjectives = objective.objectives.map((obj: any) => {
      if (obj.objective_name === objectiveName) {
        return {
          ...obj,
          callback_url: webhookUrl || undefined
        };
      }
      return obj;
    });

    // Update in database
    const { error: updateError } = await supabase
      .from('custom_objectives')
      .update({ 
        objectives: updatedObjectives,
        updated_at: new Date().toISOString()
      })
      .eq('id', objectiveId);

    if (updateError) {
      return NextResponse.json(
        { error: 'Failed to update objective', details: updateError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Webhook URL ${webhookUrl ? 'set' : 'removed'} for ${objectiveName}`,
      objectiveId,
      objectiveName,
      webhookUrl: webhookUrl || null
    });

  } catch (error) {
    console.error('❌ Set webhook URL error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}