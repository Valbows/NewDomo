/**
 * API Routes for Individual Custom Objective Management
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import {
  getCustomObjective,
  updateCustomObjective,
  deleteCustomObjective,
  setActiveCustomObjective,
} from '@/lib/supabase/custom-objectives';
import { createObjectivesManager } from '@/lib/tavus/objectives-manager';

export async function GET(
  request: NextRequest,
  { params }: { params: { demoId: string; objectiveId: string } }
) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const objective = await getCustomObjective(params.objectiveId);
    if (!objective) {
      return NextResponse.json({ error: 'Objective not found' }, { status: 404 });
    }

    return NextResponse.json({ objective });
  } catch (error) {
    console.error('Error fetching custom objective:', error);
    return NextResponse.json(
      { error: 'Failed to fetch custom objective' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { demoId: string; objectiveId: string } }
) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, description, objectives, is_active } = body;

    // Get the current objective
    const currentObjective = await getCustomObjective(params.objectiveId);
    if (!currentObjective) {
      return NextResponse.json({ error: 'Objective not found' }, { status: 404 });
    }

    // Update in Tavus if objectives changed and we have a Tavus ID
    if (objectives && currentObjective.tavus_objectives_id) {
      try {
        const objectivesManager = createObjectivesManager();
        await objectivesManager.updateObjectives(
          currentObjective.tavus_objectives_id,
          {
            name: name || currentObjective.name,
            description: description || currentObjective.description || '',
            objectives,
          }
        );
      } catch (tavusError) {
        console.error('Failed to update objectives in Tavus:', tavusError);
        // Continue with local update even if Tavus fails
      }
    }

    // Handle activation
    if (is_active === true) {
      await setActiveCustomObjective(params.objectiveId);
    }

    // Update the objective
    const updatedObjective = await updateCustomObjective(params.objectiveId, {
      name,
      description,
      objectives,
      is_active,
    });

    return NextResponse.json({ objective: updatedObjective });
  } catch (error) {
    console.error('Error updating custom objective:', error);
    return NextResponse.json(
      { error: 'Failed to update custom objective' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { demoId: string; objectiveId: string } }
) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get the objective to check if it has a Tavus ID
    const objective = await getCustomObjective(params.objectiveId);
    if (!objective) {
      return NextResponse.json({ error: 'Objective not found' }, { status: 404 });
    }

    // Delete from Tavus if it exists there
    if (objective.tavus_objectives_id) {
      try {
        const objectivesManager = createObjectivesManager();
        await objectivesManager.deleteObjectives(objective.tavus_objectives_id);
      } catch (tavusError) {
        console.error('Failed to delete objectives from Tavus:', tavusError);
        // Continue with local deletion even if Tavus fails
      }
    }

    // Delete from our database
    await deleteCustomObjective(params.objectiveId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting custom objective:', error);
    return NextResponse.json(
      { error: 'Failed to delete custom objective' },
      { status: 500 }
    );
  }
}