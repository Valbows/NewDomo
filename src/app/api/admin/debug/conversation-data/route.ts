import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/utils/supabase';
import { adminAuth } from '../../middleware';

async function handleGET(req: NextRequest) {
  try {
    // Check admin authentication
    const authError = await adminAuth(req);
    if (authError) return authError;

    const supabase = createClient();
    
    const url = new URL(req.url);
    const demoId = url.searchParams.get('demoId');
    const conversationId = url.searchParams.get('conversationId') || 'cd9c38355945c4ec';

    console.log(`🔍 Debug conversation data for demo: ${demoId}, conversation: ${conversationId}`);

    // Get all conversation details for this user
    const { data: allConversations, error: allError } = await supabase
      .from('conversation_details')
      .select('*')
      .order('created_at', { ascending: false });

    if (allError) {
      console.error('Error fetching all conversations:', allError);
    } else {
      console.log(`📊 Found ${allConversations?.length || 0} total conversation records`);
    }

    // Get specific conversation if provided
    let specificConversation = null;
    if (conversationId) {
      const { data: conv, error: convError } = await supabase
        .from('conversation_details')
        .select('*')
        .eq('tavus_conversation_id', conversationId)
        .single();

      if (convError) {
        console.log('❌ Specific conversation not found:', convError.message);
      } else {
        specificConversation = conv;
        console.log('✅ Found specific conversation:', conv?.id);
      }
    }

    // Get demo-specific conversations if demoId provided
    let demoConversations = null;
    if (demoId) {
      const { data: demoConv, error: demoError } = await supabase
        .from('conversation_details')
        .select('*')
        .eq('demo_id', demoId)
        .order('completed_at', { ascending: false });

      if (demoError) {
        console.error('Error fetching demo conversations:', demoError);
      } else {
        demoConversations = demoConv;
        console.log(`📋 Found ${demoConv?.length || 0} conversations for demo ${demoId}`);
      }
    }

    // Get demo info if demoId provided
    let demoInfo = null;
    if (demoId) {
      const { data: demo, error: demoInfoError } = await supabase
        .from('demos')
        .select('id, name, tavus_conversation_id, tavus_persona_id')
        .eq('id', demoId)
        .single();

      if (!demoInfoError) {
        demoInfo = demo;
      }
    }

    const response = {
      debug: {
        requested_demo_id: demoId,
        requested_conversation_id: conversationId,
        total_conversations_in_db: allConversations?.length || 0,
        demo_info: demoInfo,
        specific_conversation: specificConversation ? {
          id: specificConversation.id,
          demo_id: specificConversation.demo_id,
          tavus_conversation_id: specificConversation.tavus_conversation_id,
          conversation_name: specificConversation.conversation_name,
          has_transcript: !!specificConversation.transcript,
          transcript_type: typeof specificConversation.transcript,
          transcript_length: specificConversation.transcript ? 
            (Array.isArray(specificConversation.transcript) ? specificConversation.transcript.length : 'string') : 'none',
          has_perception: !!specificConversation.perception_analysis,
          perception_type: typeof specificConversation.perception_analysis,
          perception_preview: specificConversation.perception_analysis ? 
            (typeof specificConversation.perception_analysis === 'string' ? 
              specificConversation.perception_analysis.substring(0, 100) + '...' : 
              'object') : 'none',
          status: specificConversation.status,
          created_at: specificConversation.created_at
        } : null,
        demo_conversations: demoConversations?.map(conv => ({
          id: conv.id,
          tavus_conversation_id: conv.tavus_conversation_id,
          conversation_name: conv.conversation_name,
          has_transcript: !!conv.transcript,
          has_perception: !!conv.perception_analysis,
          status: conv.status
        })) || [],
        all_conversations: allConversations?.map(conv => ({
          id: conv.id,
          demo_id: conv.demo_id,
          tavus_conversation_id: conv.tavus_conversation_id,
          has_transcript: !!conv.transcript,
          has_perception: !!conv.perception_analysis
        })) || []
      }
    };

    return NextResponse.json(response, { status: 200 });

  } catch (error) {
    console.error('Debug error:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}

export const GET = handleGET;