import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { indexVideo, buildAgentVideoContext, getIndexingStatus } from '@/lib/twelve-labs';

// Create Supabase client at runtime to avoid build errors
function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SECRET_KEY!
  );
}

export async function POST(request: NextRequest) {
  try {
    console.log('[TwelveLabs API] POST /index-video called');

    // Check if Twelve Labs is configured
    const apiKey = process.env.TWELVE_LABS_API_KEY?.trim();
    console.log('[TwelveLabs API] API Key configured:', !!apiKey, 'Length:', apiKey?.length || 0);

    if (!apiKey) {
      console.log('[TwelveLabs API] No API key - skipping');
      return NextResponse.json({
        success: false,
        skipped: true,
        message: 'Twelve Labs API key not configured. Video indexing skipped.',
      });
    }

    const { demoVideoId } = await request.json();
    console.log('[TwelveLabs API] Processing video ID:', demoVideoId);

    if (!demoVideoId) {
      return NextResponse.json({ error: 'demoVideoId is required' }, { status: 400 });
    }

    const supabaseAdmin = getSupabaseAdmin();

    // Get the video record
    const { data: video, error: fetchError } = await supabaseAdmin
      .from('demo_videos')
      .select('*')
      .eq('id', demoVideoId)
      .single();

    if (fetchError || !video) {
      return NextResponse.json({ error: 'Video not found' }, { status: 404 });
    }

    // Generate a signed URL for the video
    console.log('[TwelveLabs API] Generating signed URL for:', video.storage_url);
    const { data: signedUrlData, error: urlError } = await supabaseAdmin.storage
      .from('demo-videos')
      .createSignedUrl(video.storage_url, 3600); // 1 hour validity

    if (urlError || !signedUrlData) {
      console.log('[TwelveLabs API] Failed to generate signed URL:', urlError);
      return NextResponse.json({ error: 'Could not generate video URL' }, { status: 500 });
    }
    console.log('[TwelveLabs API] Signed URL generated successfully');

    // Start indexing with Twelve Labs
    console.log('[TwelveLabs API] Calling Twelve Labs indexVideo...');
    const indexResult = await indexVideo(signedUrlData.signedUrl, video.title);
    console.log('[TwelveLabs API] Index result:', indexResult);

    // Update the video record with Twelve Labs metadata
    const { error: updateError } = await supabaseAdmin
      .from('demo_videos')
      .update({
        metadata: {
          ...video.metadata,
          twelvelabs: {
            indexId: indexResult.indexId,
            videoId: indexResult.videoId,
            taskId: indexResult.taskId,
            status: indexResult.status,
            indexedAt: new Date().toISOString(),
          },
        },
      })
      .eq('id', demoVideoId);

    if (updateError && process.env.NODE_ENV !== 'production') {
      console.error('[TwelveLabs] Error updating video metadata:', updateError);
    }

    return NextResponse.json({
      success: true,
      indexId: indexResult.indexId,
      videoId: indexResult.videoId,
      taskId: indexResult.taskId,
      status: indexResult.status,
      message: 'Video indexing started. This may take a few minutes.',
    });
  } catch (error: any) {
    // Log specific error only in development - this is an optional feature
    if (process.env.NODE_ENV !== 'production') {
      console.error('[TwelveLabs] Index video error:', {
        message: error.message,
        status: error.status,
        cause: error.cause,
      });
    }
    // Return 200 with error flag - optional feature shouldn't cause failures
    return NextResponse.json({
      success: false,
      skipped: true,
      message: 'Twelve Labs indexing failed (optional feature). Your video transcription still works.',
      error: error.message,
    });
  }
}

// Check indexing status
export async function GET(request: NextRequest) {
  try {
    // Check if Twelve Labs is configured
    if (!process.env.TWELVE_LABS_API_KEY) {
      return NextResponse.json({
        indexed: false,
        skipped: true,
        message: 'Twelve Labs API key not configured.',
      });
    }

    const { searchParams } = new URL(request.url);
    const demoVideoId = searchParams.get('demoVideoId');

    if (!demoVideoId) {
      return NextResponse.json({ error: 'demoVideoId is required' }, { status: 400 });
    }

    const supabaseAdmin = getSupabaseAdmin();

    // Get the video record
    const { data: video, error: fetchError } = await supabaseAdmin
      .from('demo_videos')
      .select('metadata')
      .eq('id', demoVideoId)
      .single();

    if (fetchError || !video) {
      return NextResponse.json({ error: 'Video not found' }, { status: 404 });
    }

    const twelvelabsData = video.metadata?.twelvelabs;
    if (!twelvelabsData?.videoId) {
      return NextResponse.json({
        indexed: false,
        message: 'Video has not been indexed yet',
      });
    }

    // Check current status from Twelve Labs
    try {
      const status = await getIndexingStatus(twelvelabsData.videoId);
      return NextResponse.json({
        indexed: true,
        indexId: twelvelabsData.indexId,
        videoId: twelvelabsData.videoId,
        status,
        indexedAt: twelvelabsData.indexedAt,
      });
    } catch {
      return NextResponse.json({
        indexed: true,
        indexId: twelvelabsData.indexId,
        videoId: twelvelabsData.videoId,
        status: twelvelabsData.status || 'unknown',
        indexedAt: twelvelabsData.indexedAt,
      });
    }
  } catch (error: any) {
    if (process.env.NODE_ENV !== 'production') {
      console.error('[TwelveLabs] Get status error:', error.message);
    }
    return NextResponse.json(
      { error: error.message || 'Failed to get indexing status' },
      { status: 500 }
    );
  }
}
