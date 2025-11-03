import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(
  request: NextRequest,
  { params }: { params: { demoId: string } }
) {
  try {
    const demoId = params.demoId;

    if (!demoId) {
      return NextResponse.json({ error: 'Demo ID is required' }, { status: 400 });
    }

    // Get the demo to verify it exists
    const { data: demo, error: demoError } = await supabase
      .from('demos')
      .select('id, name, tavus_persona_id')
      .eq('id', demoId)
      .single();

    if (demoError || !demo) {
      return NextResponse.json({ error: 'Demo not found' }, { status: 404 });
    }

    // Get all conversations for this demo
    const { data: conversations, error: conversationsError } = await supabase
      .from('conversation_details')
      .select('tavus_conversation_id')
      .eq('demo_id', demoId);

    if (conversationsError) {
      throw conversationsError;
    }

    if (!conversations || conversations.length === 0) {
      return NextResponse.json({ 
        message: 'No conversations found for this demo',
        demo_id: demoId,
        conversations_synced: 0
      });
    }

    // Sync each conversation using the Tavus conversations sync endpoint
    const syncResults = [];
    
    for (const conversation of conversations) {
      try {
        const syncResponse = await fetch(`${request.nextUrl.origin}/api/tavus/conversations/sync`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            conversation_id: conversation.tavus_conversation_id,
            demo_id: demoId
          }),
        });

        if (syncResponse.ok) {
          const syncResult = await syncResponse.json();
          syncResults.push({
            conversation_id: conversation.tavus_conversation_id,
            status: 'success',
            result: syncResult
          });
        } else {
          syncResults.push({
            conversation_id: conversation.tavus_conversation_id,
            status: 'error',
            error: `HTTP ${syncResponse.status}`
          });
        }
      } catch (error) {
        syncResults.push({
          conversation_id: conversation.tavus_conversation_id,
          status: 'error',
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    const successCount = syncResults.filter(r => r.status === 'success').length;
    const errorCount = syncResults.filter(r => r.status === 'error').length;

    return NextResponse.json({
      message: `Sync completed for demo ${demo.name}`,
      demo_id: demoId,
      conversations_total: conversations.length,
      conversations_synced: successCount,
      conversations_failed: errorCount,
      results: syncResults
    });

  } catch (error) {
    console.error('Demo sync error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to sync demo conversations', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}