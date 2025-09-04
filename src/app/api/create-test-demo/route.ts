import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { createClient as createServiceClient } from '@supabase/supabase-js';
import * as Sentry from '@sentry/nextjs';
import { getErrorMessage, logError } from '@/lib/errors';

async function handlePOST(req: NextRequest) {
  // Use service role client to bypass RLS for testing
  const supabase = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SECRET_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  );

  try {
    console.log('Creating test demo with videos...');

    // Create a test demo
    const testDemoId = '12345678-1234-1234-1234-123456789012';
    const testUserId = '12345678-1234-1234-1234-123456789012'; // Use same UUID for simplicity

    // First, check if demo already exists
    const { data: existingDemo } = await supabase
      .from('demos')
      .select('id')
      .eq('id', testDemoId)
      .single();

    if (existingDemo) {
      console.log('Test demo already exists, ensuring videos exist');

      // Check if videos already exist for this demo
      const { data: existingVideos, error: existingVideosError } = await supabase
        .from('demo_videos')
        .select('id')
        .eq('demo_id', testDemoId);

      if (existingVideosError) {
        logError(existingVideosError, 'Existing videos check error');
        return NextResponse.json(
          { error: getErrorMessage(existingVideosError, 'Failed to check existing videos') },
          { status: 500 }
        );
      }

      if (!existingVideos || existingVideos.length === 0) {
        console.log('No videos found for existing demo. Inserting default test videos...');
        const testVideosWhenDemoExists = [
          { demo_id: testDemoId, title: 'First Video',  storage_url: 'test-videos/first-video.mp4',  order_index: 1, duration_seconds: 120 },
          { demo_id: testDemoId, title: 'Second Video', storage_url: 'test-videos/second-video.mp4', order_index: 2, duration_seconds: 180 },
          { demo_id: testDemoId, title: 'Third Video',  storage_url: 'test-videos/third-video.mp4',  order_index: 3, duration_seconds: 150 },
          { demo_id: testDemoId, title: 'Fourth Video', storage_url: 'test-videos/fourth-video.mp4', order_index: 4, duration_seconds: 200 },
        ];

        const { error: insertMissingVideosError } = await supabase
          .from('demo_videos')
          .insert(testVideosWhenDemoExists);

        if (insertMissingVideosError) {
          logError(insertMissingVideosError, 'Insert default videos for existing demo error');
          return NextResponse.json(
            { error: getErrorMessage(insertMissingVideosError, 'Failed to create test videos for existing demo') },
            { status: 500 }
          );
        }
      }

      return NextResponse.json({ 
        success: true, 
        message: 'Test demo already exists',
        demoId: testDemoId 
      });
    }

    // Create the demo
    const { data: demo, error: demoError } = await supabase
      .from('demos')
      .insert({
        id: testDemoId,
        name: 'Test Demo',
        user_id: testUserId,
        tavus_persona_id: null,
        video_storage_path: 'test-videos/',
        metadata: {
          // Required fields for database validation
          uploadId: testDemoId,
          userId: testUserId,
          fileName: 'test-demo.json',
          fileType: 'application/json',
          fileSize: '1024',
          uploadTimestamp: new Date().toISOString(),
          // Demo-specific fields
          agentName: 'Test Agent',
          agentPersonality: 'Helpful and knowledgeable',
          agentGreeting: 'Hello! I can help you with demo videos.'
        }
      })
      .select()
      .single();

    if (demoError) {
      logError(demoError, 'Demo creation error');
      return NextResponse.json({ error: getErrorMessage(demoError, 'Failed to create demo') }, { status: 500 });
    }

    console.log('Demo created:', demo);

    // Create test videos
    const testVideos = [
      {
        demo_id: testDemoId,
        title: 'First Video',
        storage_url: 'test-videos/first-video.mp4',
        order_index: 1,
        duration_seconds: 120
      },
      {
        demo_id: testDemoId,
        title: 'Second Video',
        storage_url: 'test-videos/second-video.mp4',
        order_index: 2,
        duration_seconds: 180
      },
      {
        demo_id: testDemoId,
        title: 'Third Video',
        storage_url: 'test-videos/third-video.mp4',
        order_index: 3,
        duration_seconds: 150
      },
      {
        demo_id: testDemoId,
        title: 'Fourth Video',
        storage_url: 'test-videos/fourth-video.mp4',
        order_index: 4,
        duration_seconds: 200
      }
    ];

    const { data: videos, error: videosError } = await supabase
      .from('demo_videos')
      .insert(testVideos)
      .select();

    if (videosError) {
      logError(videosError, 'Videos creation error');
      return NextResponse.json({ error: getErrorMessage(videosError, 'Failed to create videos') }, { status: 500 });
    }

    console.log('Videos created:', videos);

    return NextResponse.json({ 
      success: true, 
      message: 'Test demo and videos created successfully',
      demoId: testDemoId,
      videosCreated: videos?.length || 0
    });

  } catch (error: unknown) {
    logError(error, 'Test demo creation error');
    const message = getErrorMessage(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

async function handleGET(req: NextRequest) {
  // Allow GET requests to create test data for easy testing
  try {
    return await handlePOST(req);
  } catch (error: unknown) {
    logError(error, 'Test demo GET error');
    const message = getErrorMessage(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export const POST = Sentry.wrapRouteHandlerWithSentry(handlePOST, {
  method: 'POST',
  parameterizedRoute: '/api/create-test-demo',
});

export const GET = Sentry.wrapRouteHandlerWithSentry(handleGET, {
  method: 'GET',
  parameterizedRoute: '/api/create-test-demo',
});
