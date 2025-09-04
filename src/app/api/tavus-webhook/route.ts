import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { wrapRouteHandlerWithSentry } from '@/lib/sentry-utils';
import { getErrorMessage, logError } from '@/lib/errors';
import { parseToolCallFromEvent } from '@/lib/tools/toolParser';

// This is the endpoint that Tavus will call with real-time conversation events.
async function handlePOST(req: NextRequest) {
  const supabase = createClient();

  try {
    // TODO: Add webhook signature verification for security
    // const signature = req.headers.get('x-tavus-signature');
    // const secret = process.env.TAVUS_WEBHOOK_SECRET;
    // if (!verifySignature(req.body, signature, secret)) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    // }

    const event = await req.json();

    console.log('=== TAVUS WEBHOOK EVENT RECEIVED ===');
    console.log('Event Type:', event.event_type);
    console.log('Conversation ID:', event.conversation_id);
    console.log('Full Event:', JSON.stringify(event, null, 2));
    console.log('=====================================');

    const conversation_id = event.conversation_id;
    const { toolName, toolArgs } = parseToolCallFromEvent(event);
    console.log('Parsed tool call from event:', toolName, toolArgs);

    if (!toolName) {
      // No actionable tool call; acknowledge
      return NextResponse.json({ received: true });
    }

    // Process tool calls
    if (toolName === 'fetch_video' || toolName === 'play_video') {
      const video_title = toolArgs?.video_title || toolArgs?.title;
      if (!video_title || typeof video_title !== 'string' || !video_title.trim()) {
        logError('Webhook: Missing or invalid video title for fetch_video/play_video', 'ToolCall Validation');
        return NextResponse.json({ message: 'Invalid or missing video title.' });
      }
      console.log('Extracted video title:', video_title);

      console.log(`Processing video request for: ${video_title}`);

      // 1. Find the demo associated with this conversation
      const { data: demo, error: demoError } = await supabase
        .from('demos')
        .select('id')
        .eq('tavus_conversation_id', conversation_id)
        .single();

      if (demoError || !demo) {
        logError(`Webhook Error: Could not find demo for conversation_id: ${conversation_id}`);
        logError(demoError, 'Demo error details');
        // Return 200 to prevent Tavus from retrying, as this is a permanent error.
        return NextResponse.json({ message: 'Demo not found for conversation.' });
      }
      
      console.log(`Found demo: ${demo.id}`);

      // 2. Find the video in that demo
      const { data: video, error: videoError } = await supabase
        .from('demo_videos')
        .select('storage_url')
        .eq('demo_id', demo.id)
        .eq('title', video_title)
        .single();

      if (videoError || !video) {
        logError(`Webhook Error: Could not find video with title '${video_title}' in demo ${demo.id}`);
        logError(videoError, 'Video error details');
        
        // Let's also check what videos are available
        const { data: availableVideos } = await supabase
          .from('demo_videos')
          .select('title')
          .eq('demo_id', demo.id);
        console.log('Available videos in demo:', availableVideos?.map(v => v.title));
        
        return NextResponse.json({ message: 'Video not found.' });
      }

      console.log(`Found video storage path: ${video.storage_url}`);

      // 3. Generate a signed URL for the video
      const { data: signedUrlData, error: signedUrlError } = await supabase.storage
        .from('demo-videos')
        .createSignedUrl(video.storage_url, 3600); // 1 hour expiry

      if (signedUrlError || !signedUrlData) {
        logError(signedUrlError, 'Error creating signed URL');
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
    } else if (toolName === 'show_trial_cta') {
      console.log('Processing show_trial_cta tool call');
      
      // 1. Find the demo associated with this conversation
      const { data: demo, error: demoError } = await supabase
        .from('demos')
        .select('id')
        .eq('tavus_conversation_id', conversation_id)
        .single();

      if (demoError || !demo) {
        logError(`Webhook Error: Could not find demo for conversation_id: ${conversation_id}`);
        return NextResponse.json({ message: 'Demo not found for conversation.' });
      }

      // 2. Broadcast the CTA event to the frontend
      const channel = supabase.channel(`demo-${demo.id}`);
      await channel.send({
        type: 'broadcast',
        event: 'show_trial_cta',
        payload: { message: 'Ready to start your trial?' },
      });

      console.log(`Broadcasted show_trial_cta event for demo ${demo.id}`);
    }

    // Acknowledge receipt of the webhook
    return NextResponse.json({ received: true });

  } catch (error: unknown) {
    logError(error, 'Tavus Webhook Error');
    const message = getErrorMessage(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export const POST = wrapRouteHandlerWithSentry(handlePOST, {
  method: 'POST',
  parameterizedRoute: '/api/tavus-webhook',
});
