/**
 * Test API Route for Custom Objectives Debugging
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function GET() {
  try {
    const supabase = createClient();
    
    // Test 1: Check if we can connect to Supabase
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError) {
      return NextResponse.json({ 
        error: 'Auth failed', 
        details: userError.message 
      }, { status: 500 });
    }


    // Test 2: Check if custom_objectives table exists
    const { data: tableTest, error: tableError } = await supabase
      .from('custom_objectives')
      .select('count')
      .limit(1);

    if (tableError) {
      return NextResponse.json({ 
        error: 'Table access failed', 
        details: tableError.message 
      }, { status: 500 });
    }


    // Test 3: Check if demos table exists and user has demos
    const { data: demos, error: demosError } = await supabase
      .from('demos')
      .select('id, name')
      .limit(5);

    if (demosError) {
      return NextResponse.json({ 
        error: 'Demos access failed', 
        details: demosError.message 
      }, { status: 500 });
    }


    return NextResponse.json({ 
      success: true,
      user: user?.id || null,
      demosCount: demos?.length || 0,
      message: 'All tests passed!'
    });

  } catch (error) {
    return NextResponse.json({ 
      error: 'Unexpected error', 
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function POST() {
  try {
    const supabase = createClient();
    
    // Test creating a simple record
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Get a demo to test with
    const { data: demo } = await supabase
      .from('demos')
      .select('id')
      .eq('user_id', user.id)
      .limit(1)
      .single();

    if (!demo) {
      return NextResponse.json({ error: 'No demo found for user' }, { status: 404 });
    }

    // Try to create a test objective
    const testObjective = {
      demo_id: demo.id,
      name: 'Test Objective',
      description: 'Test description',
      objectives: [{
        objective_name: 'test_step',
        objective_prompt: 'This is a test step',
        confirmation_mode: 'auto' as const,
        modality: 'verbal' as const,
        output_variables: ['test_var']
      }]
    };

    const { data: result, error } = await supabase
      .from('custom_objectives')
      .insert(testObjective)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ 
        error: 'Insert failed', 
        details: error.message 
      }, { status: 500 });
    }


    // Clean up - delete the test objective
    await supabase
      .from('custom_objectives')
      .delete()
      .eq('id', result.id);

    return NextResponse.json({ 
      success: true,
      testObjectiveId: result.id,
      message: 'Test objective created and deleted successfully!'
    });

  } catch (error) {
    return NextResponse.json({ 
      error: 'POST test failed', 
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}