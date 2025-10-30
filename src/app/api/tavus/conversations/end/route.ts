import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/utils/supabase';
import { wrapRouteHandlerWithSentry } from '@/lib/sentry-utils';
import { getErrorMessage, logError } from '@/lib/errors';
import { getTavusService } from '@/lib/services/tavus';
import { withAuth, getRequestUser, type AuthenticatedRequest } from '@/lib/services/auth/middleware';

async function handlePOST(req: AuthenticatedRequest) {
  const supabase = createClient();

  try {
    const user = getRequestUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Handle both JSON and sendBeacon (text) requests
    let conversationId: string;
    let demoId: string;
    
    const contentType = req.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      const body = await req.json();
      conversationId = body.conversationId;
      demoId = body.demoId;
    } else {
      // Handle sendBeacon request (sent as text)
      const text = await req.text();
      try {
        const body = JSON.parse(text);
        conversationId = body.conversationId;
        demoId = body.demoId;
      } catch {
        return NextResponse.json({ error: 'Invalid request format' }, { status: 400 });
      }
    }

    // We need either conversationId or demoId to proceed
    if (!conversationId && !demoId) {
      return NextResponse.json({ error: 'Missing conversationId or demoId' }, { status: 400 });
    }

    // Use Tavus service to end conversation
    const tavusService = getTavusService();
    const result = await tavusService.endConversationForDemo(demoId, user.id, conversationId, supabase);

    if (!result.success) {
      return NextResponse.json({ 
        error: result.error,
        details: process.env.NODE_ENV !== 'production' ? result.error : undefined
      }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Conversation ended successfully',
      conversationId: result.data?.conversation_id,
      result: result.data
    });

  } catch (error: unknown) {
    console.error('❌ End conversation error:', error);
    logError(error, 'End conversation error');
    const message = getErrorMessage(error);
    return NextResponse.json({ 
      error: message,
      details: process.env.NODE_ENV !== 'production' ? String(error) : undefined
    }, { status: 500 });
  }
}

export const POST = wrapRouteHandlerWithSentry(withAuth(handlePOST), {
  method: 'POST',
  parameterizedRoute: '/api/tavus/conversations/end',
});