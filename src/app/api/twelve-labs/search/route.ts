import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { searchVideo } from '@/lib/twelve-labs';

// Use service role for server-side operations
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!
);

/**
 * Search within indexed videos
 * Used by the Tavus agent to find relevant video segments
 */
export async function POST(request: NextRequest) {
  try {
    const { query, demoId, demoVideoId } = await request.json();

    if (!query) {
      return NextResponse.json({ error: 'query is required' }, { status: 400 });
    }

    let indexId: string | undefined;
    let videoId: string | undefined;

    // If specific video, get its Twelve Labs info
    if (demoVideoId) {
      const { data: video } = await supabaseAdmin
        .from('demo_videos')
        .select('metadata')
        .eq('id', demoVideoId)
        .single();

      if (video?.metadata?.twelvelabs) {
        indexId = video.metadata.twelvelabs.indexId;
        videoId = video.metadata.twelvelabs.videoId;
      }
    }
    // If demo ID, search across all videos in that demo
    else if (demoId) {
      const { data: videos } = await supabaseAdmin
        .from('demo_videos')
        .select('metadata')
        .eq('demo_id', demoId);

      // Get the index ID from the first indexed video
      const indexedVideo = videos?.find((v) => v.metadata?.twelvelabs?.indexId);
      if (indexedVideo) {
        indexId = indexedVideo.metadata.twelvelabs.indexId;
      }
    }

    if (!indexId) {
      return NextResponse.json({
        results: [],
        message: 'No indexed videos found for this demo',
      });
    }

    // Search the video(s)
    const results = await searchVideo(query, indexId, videoId);

    return NextResponse.json({
      success: true,
      query,
      results: results.map((r) => ({
        startTime: r.start,
        endTime: r.end,
        confidence: r.confidence,
        text: r.text,
        formattedTime: `${formatTime(r.start)} - ${formatTime(r.end)}`,
      })),
    });
  } catch (error: any) {
    console.error('[TwelveLabs] Search error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to search video' },
      { status: 500 }
    );
  }
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}
