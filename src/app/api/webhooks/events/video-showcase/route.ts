import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  console.log('🎬 Video Showcase Webhook received');

  try {
    const body = await request.json();
    console.log('📊 Video Showcase Webhook payload:', JSON.stringify(body, null, 2));

    // Extract data from webhook payload
    const event = body;
    const conversationId = event?.conversation_id;
    const eventType = event?.event_type || 'conversation.objective.completed';

    if (!conversationId) {
      console.error('❌ Missing conversation_id in webhook payload');
      return NextResponse.json(
        { error: 'Missing conversation_id' },
        { status: 400 }
      );
    }

    // Extract objective data - support multiple payload formats
    const objectiveName = 
      event?.properties?.objective_name || 
      event?.data?.objective_name || 
      event?.objective_name;

    const outputVariables = 
      event?.properties?.output_variables || 
      event?.data?.output_variables || 
      event?.output_variables || 
      {};

    console.log(`🎯 Processing objective completion: ${objectiveName}`);
    console.log(`📊 Output variables:`, JSON.stringify(outputVariables, null, 2));

    // Validate this is a video showcase objective
    if (objectiveName !== 'demo_video_showcase') {
      console.log(`⚠️ Ignoring non-video-showcase objective: ${objectiveName}`);
      return NextResponse.json({ 
        message: 'Not a video showcase objective', 
        objective: objectiveName 
      });
    }

    // Extract video data
    const requestedVideos = outputVariables.requested_videos;
    const videosShown = outputVariables.videos_shown;

    // Convert single strings to arrays if needed
    let requestedVideosArray = null;
    if (requestedVideos) {
      if (Array.isArray(requestedVideos)) {
        requestedVideosArray = requestedVideos;
      } else if (typeof requestedVideos === 'string') {
        requestedVideosArray = [requestedVideos];
      }
    }

    let videosShownArray = null;
    if (videosShown) {
      if (Array.isArray(videosShown)) {
        videosShownArray = videosShown;
      } else if (typeof videosShown === 'string') {
        videosShownArray = [videosShown];
      }
    }

    console.log(`🎬 Video data extracted:`, {
      requested: requestedVideosArray,
      shown: videosShownArray
    });

    // Store in database
    const { data, error } = await supabase
      .from('video_showcase_data')
      .insert({
        conversation_id: conversationId,
        requested_videos: requestedVideosArray,
        videos_shown: videosShownArray,
        objective_name: objectiveName,
        event_type: eventType,
        raw_payload: body,
        received_at: new Date().toISOString(),
      })
      .select();

    if (error) {
      console.error('❌ Database error:', error);
      return NextResponse.json(
        { error: 'Database error', details: error.message },
        { status: 500 }
      );
    }

    console.log('✅ Video showcase data stored successfully:', data);

    return NextResponse.json({
      success: true,
      message: 'Video showcase data captured successfully',
      data: {
        conversation_id: conversationId,
        objective_name: objectiveName,
        requested_videos: requestedVideosArray,
        videos_shown: videosShownArray,
        stored_at: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('❌ Video Showcase Webhook error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// Handle GET requests for testing
export async function GET() {
  return NextResponse.json({
    message: 'Video Showcase Webhook endpoint is active',
    endpoint: '/api/webhooks/events/video-showcase',
    method: 'POST',
    purpose: 'Captures video showcase data from Tavus demo_video_showcase objective'
  });
}