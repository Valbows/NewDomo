import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function GET(req: NextRequest) {
  const supabase = createClient();
  
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(req.url);
    const demoId = url.searchParams.get('demoId');
    
    if (!demoId) {
      return NextResponse.json({ error: 'Missing demoId parameter' }, { status: 400 });
    }

    // Get demo data
    const { data: demo, error: demoError } = await supabase
      .from('demos')
      .select('id, name, tavus_conversation_id, metadata')
      .eq('id', demoId)
      .eq('user_id', user.id)
      .single();

    if (demoError || !demo) {
      return NextResponse.json({ error: 'Demo not found' }, { status: 404 });
    }

    // Parse metadata to get conversation URL
    let metadata = demo.metadata;
    if (typeof metadata === 'string') {
      try {
        metadata = JSON.parse(metadata);
      } catch {
        metadata = {};
      }
    }

    return NextResponse.json({
      demoId: demo.id,
      demoName: demo.name,
      storedConversationId: demo.tavus_conversation_id,
      conversationUrl: metadata?.tavusShareableLink,
      metadata: metadata
    });

  } catch (error) {
    console.error('Debug conversation ID error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}