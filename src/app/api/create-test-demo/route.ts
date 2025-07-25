import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { createClient as createServiceClient } from '@supabase/supabase-js';

export async function POST(req: NextRequest) {
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
      console.log('Test demo already exists, skipping creation');
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
        tavus_conversation_id: 'test-conversation-id',
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
          agentGreeting: 'Hello! I can help you with demo videos.',
          tavusAgentId: 'test-agent-id',
          tavusShareableLink: 'https://tavus.daily.co/test-conversation-id'
        }
      })
      .select()
      .single();

    if (demoError) {
      console.error('Demo creation error:', demoError);
      console.error('Demo error details:', JSON.stringify(demoError, null, 2));
      return NextResponse.json({ error: 'Failed to create demo: ' + demoError.message }, { status: 500 });
    }

    console.log('Demo created:', demo);

    // Create test videos
    const testVideos = [
      {
        demo_id: testDemoId,
        title: 'First Video',
        description: 'Introduction to our platform',
        storage_url: 'test-videos/first-video.mp4',
        metadata: { duration: 120, category: 'intro' }
      },
      {
        demo_id: testDemoId,
        title: 'Second Video',
        description: 'Advanced features walkthrough',
        storage_url: 'test-videos/second-video.mp4',
        metadata: { duration: 180, category: 'features' }
      },
      {
        demo_id: testDemoId,
        title: 'Third Video',
        description: 'Integration examples',
        storage_url: 'test-videos/third-video.mp4',
        metadata: { duration: 150, category: 'integration' }
      },
      {
        demo_id: testDemoId,
        title: 'Fourth Video',
        description: 'Success stories and case studies',
        storage_url: 'test-videos/fourth-video.mp4',
        metadata: { duration: 200, category: 'success' }
      }
    ];

    const { data: videos, error: videosError } = await supabase
      .from('demo_videos')
      .insert(testVideos)
      .select();

    if (videosError) {
      console.error('Videos creation error:', videosError);
      return NextResponse.json({ error: 'Failed to create videos: ' + videosError.message }, { status: 500 });
    }

    console.log('Videos created:', videos);

    return NextResponse.json({ 
      success: true, 
      message: 'Test demo and videos created successfully',
      demoId: testDemoId,
      videosCreated: videos?.length || 0
    });

  } catch (error: any) {
    console.error('Test demo creation error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  // Allow GET requests to create test data for easy testing
  return POST(req);
}
