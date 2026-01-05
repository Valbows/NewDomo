import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import {
  parseChaptersFromContext,
  findChapterAtTimestamp,
  formatTime,
  buildVideoContextDescription,
  type VideoContextInfo
} from '@/lib/video-context';

// Create Supabase client at runtime to avoid build errors
function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SECRET_KEY!
  );
}

/**
 * Get video context at a specific timestamp
 * Used to provide real-time context to the AI agent
 */
export async function POST(request: NextRequest) {
  try {
    const { demoVideoId, videoTitle, timestamp, isPaused } = await request.json();

    if (!demoVideoId && !videoTitle) {
      return NextResponse.json(
        { error: 'demoVideoId or videoTitle is required' },
        { status: 400 }
      );
    }

    if (timestamp === undefined || timestamp === null) {
      return NextResponse.json(
        { error: 'timestamp is required' },
        { status: 400 }
      );
    }

    const supabaseAdmin = getSupabaseAdmin();

    // Find the video
    let video;
    if (demoVideoId) {
      const { data } = await supabaseAdmin
        .from('demo_videos')
        .select('id, title, metadata')
        .eq('id', demoVideoId)
        .single();
      video = data;
    } else if (videoTitle) {
      const { data } = await supabaseAdmin
        .from('demo_videos')
        .select('id, title, metadata')
        .ilike('title', `%${videoTitle}%`)
        .limit(1)
        .single();
      video = data;
    }

    if (!video) {
      return NextResponse.json({ error: 'Video not found' }, { status: 404 });
    }

    // Get the generated context
    const generatedContext = video.metadata?.twelvelabs?.generatedContext;
    if (!generatedContext) {
      return NextResponse.json({
        success: true,
        context: {
          videoTitle: video.title,
          timestamp: timestamp,
          formattedTime: formatTime(timestamp),
          isPaused: isPaused ?? false,
          currentChapter: null,
          description: `User is at ${formatTime(timestamp)} in "${video.title}"`
        }
      });
    }

    // Parse chapters from the context
    const chapters = parseChaptersFromContext(generatedContext);
    const currentChapter = findChapterAtTimestamp(chapters, timestamp);

    const contextInfo: VideoContextInfo = {
      currentTimestamp: timestamp,
      formattedTime: formatTime(timestamp),
      currentChapter,
      chapterDescription: currentChapter?.title || '',
      videoTitle: video.title,
      isPaused: isPaused ?? false
    };

    return NextResponse.json({
      success: true,
      context: {
        videoTitle: video.title,
        videoId: video.id,
        timestamp: timestamp,
        formattedTime: contextInfo.formattedTime,
        isPaused: contextInfo.isPaused,
        currentChapter: currentChapter ? {
          title: currentChapter.title,
          startTime: formatTime(currentChapter.start),
          endTime: formatTime(currentChapter.end)
        } : null,
        allChapters: chapters.map(ch => ({
          title: ch.title,
          startTime: formatTime(ch.start),
          endTime: formatTime(ch.end)
        })),
        description: buildVideoContextDescription(contextInfo)
      }
    });
  } catch (error: any) {
    console.error('[VideoContext] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to get video context' },
      { status: 500 }
    );
  }
}
