import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function POST(req: NextRequest) {
  const supabase = createClient();

  try {
    const { conversationId, demoId } = await req.json();

    if (!conversationId || !demoId) {
      return NextResponse.json({ error: 'Missing conversationId or demoId' }, { status: 400 });
    }

    const tavusApiKey = process.env.TAVUS_API_KEY;
    if (!tavusApiKey) {
      return NextResponse.json({ error: 'Tavus API key not configured' }, { status: 500 });
    }

    // Try to get conversation details first to verify it exists
    const conversationResponse = await fetch(`https://tavusapi.com/v2/conversations/${conversationId}`, {
      method: 'GET',
      headers: {
        'x-api-key': tavusApiKey,
      },
    });

    if (!conversationResponse.ok) {
      console.error('Failed to fetch conversation:', conversationResponse.statusText);
      return NextResponse.json({ error: 'Conversation not found' }, { status: conversationResponse.status });
    }

    const conversationData = await conversationResponse.json();
    console.log('Conversation status:', conversationData.status);

    // For now, implement a simpler approach - check if conversation is active and trigger video
    // The hybrid listener logic will be implemented in the webhook handler
    if (conversationData.status === 'active') {
      console.log('Active conversation detected - triggering default video playback');
      
      const videoTitle = 'Fourth Video'; // Default video to play
      console.log(`Triggering video playback for: ${videoTitle}`);

      // Trigger video playback
      const { data: video, error: videoError } = await supabase
        .from('demo_videos')
        .select('storage_url')
        .eq('demo_id', demoId)
        .eq('title', videoTitle)
        .single();

      let videoToPlay = video;

      if (videoError || !video) {
        console.error(`Video not found: ${videoTitle}`);
        // Try with default video
        const { data: defaultVideo, error: defaultError } = await supabase
          .from('demo_videos')
          .select('storage_url, title')
          .eq('demo_id', demoId)
          .limit(1)
          .single();

        if (defaultError || !defaultVideo) {
          console.error('No videos found in demo');
          return NextResponse.json({ 
            success: true, 
            videoTriggered: false,
            message: 'No videos found in demo'
          });
        }

        console.log(`Using default video: ${defaultVideo.title}`);
        videoToPlay = defaultVideo;
      }

      if (!videoToPlay) {
        console.error('No video available to play');
        return NextResponse.json({ 
          success: true, 
          videoTriggered: false,
          message: 'No video available to play'
        });
      }

      // Generate signed URL
      const { data: signedUrlData, error: signedUrlError } = await supabase.storage
        .from('demo-videos')
        .createSignedUrl(videoToPlay.storage_url, 3600);

      if (signedUrlError || !signedUrlData) {
        console.error('Error creating signed URL:', signedUrlError);
        return NextResponse.json({ 
          success: true, 
          videoTriggered: false,
          message: 'Error creating signed URL'
        });
      }

      // Broadcast video playback event
      const channel = supabase.channel(`demo-${demoId}`);
      await channel.send({
        type: 'broadcast',
        event: 'play_video',
        payload: { url: signedUrlData.signedUrl },
      });

      console.log(`Video playback triggered for demo ${demoId}`);
      
      return NextResponse.json({ 
        success: true, 
        videoTriggered: true,
        videoTitle,
        videoUrl: signedUrlData.signedUrl
      });
    }

    return NextResponse.json({ 
      success: true, 
      videoTriggered: false,
      message: 'Conversation not active'
    });

  } catch (error: any) {
    console.error('Conversation monitor error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
