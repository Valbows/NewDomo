import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getIndexingStatus } from '@/lib/twelve-labs';

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SECRET_KEY!
  );
}

/**
 * Check the indexing status of a video from Twelve Labs
 * and update the database if status changed
 */
export async function POST(request: NextRequest) {
  try {
    const { demoVideoId } = await request.json();

    if (!demoVideoId) {
      return NextResponse.json({ error: 'demoVideoId is required' }, { status: 400 });
    }

    const supabaseAdmin = getSupabaseAdmin();

    // Get the video's current metadata
    const { data: video, error: fetchError } = await supabaseAdmin
      .from('demo_videos')
      .select('id, metadata')
      .eq('id', demoVideoId)
      .single();

    if (fetchError || !video) {
      return NextResponse.json({ error: 'Video not found' }, { status: 404 });
    }

    const taskId = video.metadata?.twelvelabs?.taskId;
    if (!taskId) {
      return NextResponse.json({
        status: 'none',
        message: 'Video has not been indexed yet'
      });
    }

    // Check status with Twelve Labs
    const status = await getIndexingStatus(taskId);

    // Update database if status changed
    const currentStatus = video.metadata?.twelvelabs?.status;
    if (status !== currentStatus) {
      await supabaseAdmin
        .from('demo_videos')
        .update({
          metadata: {
            ...video.metadata,
            twelvelabs: {
              ...video.metadata.twelvelabs,
              status: status,
            }
          }
        })
        .eq('id', demoVideoId);
    }

    return NextResponse.json({
      success: true,
      status,
      taskId,
    });
  } catch (error: any) {
    if (process.env.NODE_ENV !== 'production') {
      console.error('[TwelveLabs] Check status error:', error);
    }
    return NextResponse.json(
      { error: error.message || 'Failed to check status' },
      { status: 500 }
    );
  }
}
