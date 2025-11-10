import { NextRequest, NextResponse } from 'next/server';
import { getTavusService } from '@/lib/services/tavus/integration-service';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const { demoId, conversationId } = await request.json();

    if (!demoId) {
      return NextResponse.json(
        { error: 'Demo ID is required' },
        { status: 400 }
      );
    }

    console.log('🎯 Ending conversation for demo:', demoId, 'conversation:', conversationId);

    // Get the Tavus service
    const tavusService = getTavusService();

    // End the conversation if we have a conversation ID
    if (conversationId) {
      console.log('🔚 Ending Tavus conversation:', conversationId);
      const endResult = await tavusService.endConversationForDemo(
        demoId,
        null, // userId not needed for ending
        conversationId,
        supabase
      );

      if (!endResult.success) {
        console.warn('Failed to end conversation via Tavus API:', endResult.error);
        // Don't fail the request - conversation might have already ended
      } else {
        console.log('✅ Conversation ended successfully');
      }
    }

    // Update demo record to clear conversation ID
    const { error: updateError } = await supabase
      .from('demos')
      .update({ 
        tavus_conversation_id: null,
        metadata: {}
      })
      .eq('id', demoId);

    if (updateError) {
      console.warn('Failed to update demo record:', updateError);
      // Don't fail the request - the main goal is ending the conversation
    }

    return NextResponse.json({
      success: true,
      message: 'Conversation ended successfully'
    });

  } catch (error) {
    console.error('Error ending conversation:', error);
    return NextResponse.json(
      { 
        error: 'Failed to end conversation',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}