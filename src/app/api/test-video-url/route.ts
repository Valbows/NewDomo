import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function GET(req: NextRequest) {
  const supabase = createClient();

  try {
    // Get the demo ID from query params
    const url = new URL(req.url);
    const demoId = url.searchParams.get('demoId');
    const videoTitle = url.searchParams.get('videoTitle') || 'Fourth Video';

    if (!demoId) {
      return NextResponse.json({ error: 'Missing demoId' }, { status: 400 });
    }

    // Find the video
    const { data: video, error: videoError } = await supabase
      .from('demo_videos')
      .select('storage_url')
      .eq('demo_id', demoId)
      .eq('title', videoTitle)
      .single();

    if (videoError || !video) {
      return NextResponse.json({ error: 'Video not found' }, { status: 404 });
    }

    // Generate signed URL
    const { data: signedUrlData, error: signedUrlError } = await supabase.storage
      .from('demo-videos')
      .createSignedUrl(video.storage_url, 3600);

    if (signedUrlError || !signedUrlData) {
      return NextResponse.json({ error: 'Could not generate video URL' }, { status: 500 });
    }

    // Return the video URL for direct testing
    return NextResponse.json({
      videoUrl: signedUrlData.signedUrl,
      storageUrl: video.storage_url,
      message: 'Video URL generated successfully'
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
