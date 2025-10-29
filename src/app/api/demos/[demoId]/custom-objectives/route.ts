/**
 * API Routes for Custom Objectives Management
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase';
import {
  createCustomObjective,
  getCustomObjectives,
  CreateCustomObjectiveRequest,
} from '@/lib/supabase/custom-objectives';
import { createObjectivesManager } from '@/lib/tavus';
import { withAuth, getRequestUser, type AuthenticatedRequest } from '@/lib/services/auth/middleware';

async function handleGET(
  request: AuthenticatedRequest,
  { params }: { params: { demoId: string } }
) {
  try {
    const user = getRequestUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const objectives = await getCustomObjectives(params.demoId);
    return NextResponse.json({ objectives });
  } catch (error) {
    console.error('Error fetching custom objectives:', error);
    return NextResponse.json(
      { error: 'Failed to fetch custom objectives' },
      { status: 500 }
    );
  }
}

async function handlePOST(
  request: AuthenticatedRequest,
  { params }: { params: { demoId: string } }
) {
  try {
    const supabase = createClient();
    const user = getRequestUser(request);

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, description, objectives } = body;

    if (!name || !objectives || !Array.isArray(objectives)) {
      return NextResponse.json(
        { error: 'Name and objectives are required' },
        { status: 400 }
      );
    }

    // Validate demo ownership
    const { data: demo } = await supabase
      .from('demos')
      .select('id')
      .eq('id', params.demoId)
      .eq('user_id', user.id)
      .single();

    if (!demo) {
      return NextResponse.json({ error: 'Demo not found' }, { status: 404 });
    }

    // Create the custom objective in our database
    const customObjective = await createCustomObjective({
      demo_id: params.demoId,
      name,
      description,
      objectives,
    });

    // Create objectives in Tavus API
    try {
      const objectivesManager = createObjectivesManager();
      const tavusResult = await objectivesManager.createObjectives({
        name,
        description: description || `Custom objectives for ${name}`,
        objectives,
      });

      // Update our record with the Tavus objectives ID
      const { error: updateError } = await supabase
        .from('custom_objectives')
        .update({ tavus_objectives_id: tavusResult.uuid })
        .eq('id', customObjective.id);

      if (updateError) {
        console.error('Failed to update Tavus objectives ID:', updateError);
      }

      customObjective.tavus_objectives_id = tavusResult.uuid;
    } catch (tavusError) {
      console.error('Failed to create objectives in Tavus:', tavusError);
      // Continue without Tavus integration - user can retry later
    }

    return NextResponse.json({ objective: customObjective });
  } catch (error) {
    console.error('Error creating custom objective:', error);
    return NextResponse.json(
      { error: 'Failed to create custom objective' },
      { status: 500 }
    );
  }
}

export const GET = withAuth(handleGET);
export const POST = withAuth(handlePOST);