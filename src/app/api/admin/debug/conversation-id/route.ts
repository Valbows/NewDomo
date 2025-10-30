import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/utils/supabase';
import { adminAuth } from '../../middleware';

export async function GET(req: NextRequest) {
  const supabase = createClient();
  
  try {
    // Check admin authentication
    const authError = await adminAuth(req);
    if (authError) return authError;

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