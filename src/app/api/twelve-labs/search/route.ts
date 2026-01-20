import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { searchVideo } from '@/lib/twelve-labs';

// Create Supabase client at runtime to avoid build errors
function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SECRET_KEY!
  );
}

/**
 * Search within indexed videos using Twelve Labs semantic search
 * Used by the Tavus agent to find relevant video segments
 * Returns demoVideoId for each result so caller can look up the video
 */
export async function POST(request: NextRequest) {
  try {
    const { query, demoId, demoVideoId } = await request.json();

    if (!query) {
      return NextResponse.json({ error: 'query is required' }, { status: 400 });
    }

    const supabaseAdmin = getSupabaseAdmin();

    let indexId: string | undefined;
    let videoId: string | undefined;
    let targetDemoVideoId: string | undefined = demoVideoId;

    // Build a map of Twelve Labs videoId -> demoVideoId for result mapping
    const videoIdMap: Record<string, string> = {};

    // If specific video, get its Twelve Labs info
    if (demoVideoId) {
      const { data: video } = await supabaseAdmin
        .from('demo_videos')
        .select('id, metadata')
        .eq('id', demoVideoId)
        .single();

      if (video?.metadata?.twelvelabs) {
        indexId = video.metadata.twelvelabs.indexId;
        videoId = video.metadata.twelvelabs.videoId;
        if (videoId) {
          videoIdMap[videoId] = video.id;
        }
      }
    }
    // If demo ID, search across all videos in that demo
    else if (demoId) {
      const { data: videos } = await supabaseAdmin
        .from('demo_videos')
        .select('id, title, metadata')
        .eq('demo_id', demoId);

      if (videos) {
        // Build videoId -> demoVideoId map for all indexed videos
        for (const v of videos) {
          if (v.metadata?.twelvelabs?.videoId) {
            videoIdMap[v.metadata.twelvelabs.videoId] = v.id;
            // Get index ID from first indexed video
            if (!indexId && v.metadata.twelvelabs.indexId) {
              indexId = v.metadata.twelvelabs.indexId;
            }
          }
        }
      }
    }

    if (!indexId) {
      return NextResponse.json({
        results: [],
        message: 'No indexed videos found for this demo',
      });
    }

    // Search the video(s) using Twelve Labs semantic search
    const results = await searchVideo(query, indexId, videoId);

    // Map results back to demoVideoIds
    return NextResponse.json({
      success: true,
      query,
      results: results.map((r: any) => {
        // Twelve Labs returns video_id in the result
        const tlVideoId = r.videoId || r.video_id;
        const mappedDemoVideoId = tlVideoId ? videoIdMap[tlVideoId] : targetDemoVideoId;

        return {
          demoVideoId: mappedDemoVideoId,
          startTime: r.start,
          endTime: r.end,
          confidence: r.confidence,
          text: r.text,
          formattedTime: `${formatTime(r.start)} - ${formatTime(r.end)}`,
        };
      }),
    });
  } catch (error: any) {
    if (process.env.NODE_ENV !== 'production') {
      console.error('[TwelveLabs] Search error:', error);
    }
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
