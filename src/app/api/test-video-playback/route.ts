import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import * as Sentry from '@sentry/nextjs';

async function handlePOST(req: NextRequest) {
  const supabase = createClient();

  try {
    const { demoId, videoTitle } = await req.json();

    if (!demoId || !videoTitle) {
      return NextResponse.json({ error: 'Missing demoId or videoTitle' }, { status: 400 });
    }

    console.log(`Testing video playback for demo ${demoId}, video: ${videoTitle}`);

    // Find the video in the demo
    const { data: video, error: videoError } = await supabase
      .from('demo_videos')
      .select('storage_url')
      .eq('demo_id', demoId)
      .eq('title', videoTitle)
      .single();

    if (videoError || !video) {
      console.error(`Could not find video with title '${videoTitle}' in demo ${demoId}`);
      
      // Let's also check what videos are available
      const { data: availableVideos } = await supabase
        .from('demo_videos')
        .select('title')
        .eq('demo_id', demoId);
      console.log('Available videos in demo:', availableVideos?.map(v => v.title));
      
      return NextResponse.json({ 
        error: 'Video not found',
        availableVideos: availableVideos?.map(v => v.title) || []
      }, { status: 404 });
    }

    console.log(`Found video storage path: ${video.storage_url}`);

    // Generate a signed URL for the video
    const { data: signedUrlData, error: signedUrlError } = await supabase.storage
      .from('demo-videos')
      .createSignedUrl(video.storage_url, 3600); // 1 hour expiry

    if (signedUrlError || !signedUrlData) {
      console.error('Error creating signed URL:', signedUrlError);
      return NextResponse.json({ error: 'Could not generate video URL.' }, { status: 500 });
    }

    console.log(`Generated signed URL: ${signedUrlData.signedUrl}`);

    // Broadcast the signed video URL to the frontend via Supabase Realtime
    const channel = supabase.channel(`demo-${demoId}`);
    await channel.send({
      type: 'broadcast',
      event: 'play_video',
      payload: { url: signedUrlData.signedUrl },
    });

    console.log(`Broadcasted play_video event for demo ${demoId}`);

    return NextResponse.json({ 
      success: true, 
      videoUrl: signedUrlData.signedUrl,
      message: 'Video playback event sent successfully'
    });

  } catch (error: unknown) {
    console.error('Test video playback error:', error);
    Sentry.captureException(error);
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export const POST = Sentry.wrapRouteHandlerWithSentry(handlePOST, {
  method: 'POST',
  parameterizedRoute: '/api/test-video-playback',
});
