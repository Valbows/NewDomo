import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { buildAgentVideoContext } from '@/lib/twelve-labs';

// Create Supabase client at runtime to avoid build errors
function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SECRET_KEY!
  );
}

/**
 * Generate comprehensive video context for the AI agent
 * This should be called after indexing is complete to build
 * the context that gets injected into the agent's system prompt
 */
export async function POST(request: NextRequest) {
  try {
    const { demoVideoId, demoId } = await request.json();

    if (!demoVideoId && !demoId) {
      return NextResponse.json(
        { error: 'demoVideoId or demoId is required' },
        { status: 400 }
      );
    }

    let videos: any[] = [];

    const supabaseAdmin = getSupabaseAdmin();

    // Get video(s) to process
    if (demoVideoId) {
      const { data: video } = await supabaseAdmin
        .from('demo_videos')
        .select('*')
        .eq('id', demoVideoId)
        .single();

      if (video) videos = [video];
    } else if (demoId) {
      const { data } = await supabaseAdmin
        .from('demo_videos')
        .select('*')
        .eq('demo_id', demoId)
        .order('order_index', { ascending: true });

      videos = data || [];
    }

    if (videos.length === 0) {
      return NextResponse.json({ error: 'No videos found' }, { status: 404 });
    }

    // Build context for each indexed video
    const contextParts: string[] = [];

    for (const video of videos) {
      const twelvelabsData = video.metadata?.twelvelabs;

      if (!twelvelabsData?.videoId) {
        contextParts.push(`## ${video.title}\n*Not yet indexed for AI understanding*\n`);
        continue;
      }

      try {
        // Generate context using Twelve Labs
        const context = await buildAgentVideoContext(twelvelabsData.videoId);
        contextParts.push(`## ${video.title}\n${context}\n`);

        // Update the video metadata with the generated context
        await supabaseAdmin
          .from('demo_videos')
          .update({
            metadata: {
              ...video.metadata,
              twelvelabs: {
                ...twelvelabsData,
                generatedContext: context,
                contextGeneratedAt: new Date().toISOString(),
              },
            },
          })
          .eq('id', video.id);
      } catch (err) {
        console.error(`[TwelveLabs] Error generating context for ${video.title}:`, err);
        contextParts.push(`## ${video.title}\n*Error generating context*\n`);
      }
    }

    const fullContext = contextParts.join('\n---\n\n');

    return NextResponse.json({
      success: true,
      context: fullContext,
      videoCount: videos.length,
      indexedCount: videos.filter((v) => v.metadata?.twelvelabs?.videoId).length,
    });
  } catch (error: any) {
    console.error('[TwelveLabs] Generate context error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate context' },
      { status: 500 }
    );
  }
}

/**
 * Get existing generated context for a demo
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const demoId = searchParams.get('demoId');

    if (!demoId) {
      return NextResponse.json({ error: 'demoId is required' }, { status: 400 });
    }

    const supabaseAdmin = getSupabaseAdmin();

    const { data: videos } = await supabaseAdmin
      .from('demo_videos')
      .select('title, metadata')
      .eq('demo_id', demoId)
      .order('order_index', { ascending: true });

    if (!videos || videos.length === 0) {
      return NextResponse.json({ context: '', videoCount: 0, indexedCount: 0 });
    }

    // Compile existing context
    const contextParts: string[] = [];

    for (const video of videos) {
      const generatedContext = video.metadata?.twelvelabs?.generatedContext;
      if (generatedContext) {
        contextParts.push(`## ${video.title}\n${generatedContext}\n`);
      }
    }

    return NextResponse.json({
      context: contextParts.join('\n---\n\n'),
      videoCount: videos.length,
      indexedCount: videos.filter((v) => v.metadata?.twelvelabs?.videoId).length,
      hasContext: contextParts.length > 0,
    });
  } catch (error: any) {
    console.error('[TwelveLabs] Get context error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to get context' },
      { status: 500 }
    );
  }
}
