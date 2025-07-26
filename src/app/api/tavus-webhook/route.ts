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

    console.log('=== TAVUS WEBHOOK EVENT RECEIVED ===');
    console.log('Event Type:', event.event_type);
    console.log('Conversation ID:', event.conversation_id);
    console.log('Full Event:', JSON.stringify(event, null, 2));
    console.log('=====================================');

    // HYBRID LISTENER IMPLEMENTATION
    const TOOL_CALL_REGEX = /^([a-zA-Z_]+)\((.*)\)$/;
    const KNOWN_TOOLS = ['fetch_video', 'show_trial_cta'];

    let toolName = null;
    let toolArgs = null;
    let conversation_id = event.conversation_id;

    if (event.event_type === 'conversation_toolcall' || event.event_type === 'tool_call') {
      // Official path: trusted event
      console.log('Official tool call event detected:', event.event_type);
      toolName = event.data?.name;
      toolArgs = event.data?.args || {};
      console.log(`Official tool call: ${toolName}`, toolArgs);
    } else if (event.event_type === 'application.transcription_ready') {
      // Parse tool calls from transcript
      console.log('Parsing tool calls from transcript');
      const transcript = event.data?.transcript || [];
      console.log('Transcript length:', transcript.length);
      
      // Find the last assistant message with tool calls
      const assistantMessages = transcript.filter((msg: any) => msg.role === 'assistant' && msg.tool_calls);
      console.log('Assistant messages with tool calls:', assistantMessages.length);
      
      if (assistantMessages.length > 0) {
        const lastToolCall = assistantMessages[assistantMessages.length - 1];
        console.log('Last tool call message:', lastToolCall);
        
        if (lastToolCall.tool_calls?.length > 0) {
          const toolCall = lastToolCall.tool_calls[0];
          console.log('Tool call details:', toolCall);
          
          if (toolCall.function?.name === 'fetch_video') {
            console.log('Found fetch_video tool call in transcript:', toolCall.function);
            toolName = 'fetch_video';
            
            // Parse arguments
            try {
              const args = JSON.parse(toolCall.function.arguments);
              toolArgs = args;
              console.log('Parsed tool args:', toolArgs);
            } catch (error) {
              console.log('Failed to parse arguments, using default:', error);
              toolArgs = { title: 'Fourth Video' };
            }
          }
        }
      }
      console.log(`Extracted tool call: ${toolName}`, toolArgs);
    } else if (event.event_type === 'conversation_utterance' || event.event_type === 'utterance') {
      const speech = event.data?.speech || event.speech || '';
      console.log('Utterance detected:', speech);
      
      if (KNOWN_TOOLS.includes(speech)) {
        // Handle no-arg case (e.g., just 'fetch_video')
        toolName = speech;
        toolArgs = {};
        console.log(`No-arg tool call detected: ${toolName}`);
      } else {
        const match = speech.match(TOOL_CALL_REGEX);
        if (match) {
          // Parse malformed tool call from utterance
          toolName = match[1];
          const argsString = match[2];
          try {
            // Try to parse as JSON first
            toolArgs = JSON.parse(argsString);
          } catch {
            // If not JSON, treat as simple string argument
            if (toolName === 'fetch_video') {
              toolArgs = { video_title: argsString.replace(/["']/g, '') };
            } else {
              toolArgs = { arg: argsString };
            }
          }
          console.log(`Parsed tool call from utterance: ${toolName}`, toolArgs);
        } else {
          // Normal conversational speech - ignore
          console.log('Normal speech, no tool call detected');
          return NextResponse.json({ received: true });
        }
      }
    } else {
      // Other event types - acknowledge but don't process
      return NextResponse.json({ received: true });
    }

    // Process tool calls
    if (toolName === 'fetch_video' || toolName === 'play_video') {
      const video_title = toolArgs.video_title || toolArgs.title || 'Fourth Video';
      console.log('Extracted video title:', video_title);

      console.log(`Processing video request for: ${video_title}`);

      // 1. Find the demo associated with this conversation
      const { data: demo, error: demoError } = await supabase
        .from('demos')
        .select('id')
        .eq('tavus_conversation_id', conversation_id)
        .single();

      if (demoError || !demo) {
        console.error('Webhook Error: Could not find demo for conversation_id:', conversation_id);
        console.error('Demo error details:', demoError);
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
        console.error(`Webhook Error: Could not find video with title '${video_title}' in demo ${demo.id}`);
        console.error('Video error details:', videoError);
        
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
    } else if (toolName === 'show_trial_cta') {
      console.log('Processing show_trial_cta tool call');
      
      // 1. Find the demo associated with this conversation
      const { data: demo, error: demoError } = await supabase
        .from('demos')
        .select('id')
        .eq('tavus_conversation_id', conversation_id)
        .single();

      if (demoError || !demo) {
        console.error('Webhook Error: Could not find demo for conversation_id:', conversation_id);
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

  } catch (error: any) {
    console.error('Tavus Webhook Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
