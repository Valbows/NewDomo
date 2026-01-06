import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: NextRequest) {

  try {
    const body = await request.json();

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

    // Validate this is a video showcase objective
    if (objectiveName !== 'demo_video_showcase') {
      return NextResponse.json({ 
        message: 'Not a video showcase objective', 
        objective: objectiveName 
      });
    }

    // Extract video data (only videos_shown after schema update)
    const videosShown = outputVariables.videos_shown;

    // Convert single strings to arrays if needed
    let videosShownArray = null;
    if (videosShown) {
      if (Array.isArray(videosShown)) {
        videosShownArray = videosShown;
      } else if (typeof videosShown === 'string') {
        videosShownArray = [videosShown];
      }
    }

    // Store in database (only videos_shown column after schema update)
    const { data, error } = await supabase
      .from('video_showcase_data')
      .insert({
        conversation_id: conversationId,
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

    return NextResponse.json({
      success: true,
      message: 'Video showcase data captured successfully',
      data: {
        conversation_id: conversationId,
        objective_name: objectiveName,
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
    endpoint: '/api/webhook/video-showcase',
    method: 'POST',
    purpose: 'Captures video showcase data from Tavus demo_video_showcase objective'
  });
}