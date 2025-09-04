import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { wrapRouteHandlerWithSentry } from '@/lib/sentry-utils';
import { getErrorMessage, logError } from '@/lib/errors';

async function handlePOST(req: NextRequest) {
  const supabase = createClient();

  try {
    const { conversationId, demoId } = await req.json();

    if (!conversationId || !demoId) {
      return NextResponse.json({ error: 'Missing conversationId or demoId' }, { status: 400 });
    }

    const tavusApiKey = process.env.TAVUS_API_KEY;
    if (!tavusApiKey) {
      return NextResponse.json({ error: 'Tavus API key not configured' }, { status: 500 });
    }

    // Try to get conversation details first to verify it exists
    const conversationResponse = await fetch(`https://tavusapi.com/v2/conversations/${conversationId}`, {
      method: 'GET',
      headers: {
        'x-api-key': tavusApiKey,
      },
    });

    if (!conversationResponse.ok) {
      logError(conversationResponse.statusText, 'Failed to fetch conversation');
      return NextResponse.json({ error: 'Conversation not found' }, { status: conversationResponse.status });
    }

    const conversationData = await conversationResponse.json();
    console.log('Conversation status:', conversationData.status);

    // Just verify conversation is active - don't auto-trigger videos
    // The webhook handler will handle actual video requests
    if (conversationData.status === 'active') {
      console.log('Conversation is active and ready for tool calls');
      
      return NextResponse.json({ 
        success: true, 
        conversationActive: true,
        message: 'Conversation is active, waiting for video requests'
      });
    }

    return NextResponse.json({ 
      success: true, 
      videoTriggered: false,
      message: 'Conversation not active'
    });

  } catch (error: unknown) {
    logError(error, 'Conversation monitor error');
    const message = getErrorMessage(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export const POST = wrapRouteHandlerWithSentry(handlePOST, {
  method: 'POST',
  parameterizedRoute: '/api/monitor-conversation',
});
