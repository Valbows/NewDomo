import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

// This is the endpoint that Tavus will call with real-time conversation events.
export async function POST(req: NextRequest) {
  const supabase = createClient();

  try {
    // TODO: Add webhook signature verification for security
    // const signature = req.headers.get('x-tavus-signature');
    // const secret = process.env.TAVUS_WEBHOOK_SECRET;
    // if (!verifySignature(req.body, signature, secret)) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    // }

    const event = await req.json();

    console.log('Received Tavus Webhook Event:', JSON.stringify(event, null, 2));

    if (event.type === 'tool_call' && event.name === 'play_video') {
      const { conversation_id, arguments: toolArgs } = event;
      const { video_title } = JSON.parse(toolArgs);

      console.log(`Tool call received: play_video with title: ${video_title}`);

      // 1. Find the demo associated with this conversation
      const { data: demo, error: demoError } = await supabase
        .from('demos')
        .select('id')
        .eq('tavus_conversation_id', conversation_id)
        .single();

      if (demoError || !demo) {
        console.error('Webhook Error: Could not find demo for conversation_id:', conversation_id);
        // Return 200 to prevent Tavus from retrying, as this is a permanent error.
        return NextResponse.json({ message: 'Demo not found for conversation.' });
      }

      // 2. Find the video in that demo
      const { data: video, error: videoError } = await supabase
        .from('demo_videos')
        .select('storage_url')
        .eq('demo_id', demo.id)
        .eq('title', video_title)
        .single();

      if (videoError || !video) {
        console.error(`Webhook Error: Could not find video with title '${video_title}' in demo ${demo.id}`);
        return NextResponse.json({ message: 'Video not found.' });
      }

      console.log(`Found video storage path: ${video.storage_url}`);

      // 3. Generate a signed URL for the video
      const { data: signedUrlData, error: signedUrlError } = await supabase.storage
        .from('demo-videos')
        .createSignedUrl(video.storage_url, 3600); // 1 hour expiry

      if (signedUrlError || !signedUrlData) {
        console.error('Error creating signed URL:', signedUrlError);
        return NextResponse.json({ message: 'Could not generate video URL.' });
      }

      console.log(`Generated signed URL: ${signedUrlData.signedUrl}`);

      // 4. Broadcast the signed video URL to the frontend via Supabase Realtime
      const channel = supabase.channel(`demo-${demo.id}`);
      await channel.send({
        type: 'broadcast',
        event: 'play_video',
        payload: { url: signedUrlData.signedUrl },
      });

      console.log(`Broadcasted play_video event for demo ${demo.id}`);
    }

    // Acknowledge receipt of the webhook
    return NextResponse.json({ received: true });

  } catch (error: any) {
    console.error('Tavus Webhook Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
