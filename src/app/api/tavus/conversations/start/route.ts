import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/utils/supabase';
import { wrapRouteHandlerWithSentry } from '@/lib/sentry-utils';
import { getErrorMessage, logError } from '@/lib/errors';
import { getTavusService } from '@/lib/services/tavus';
import { withAuth, getRequestUser, type AuthenticatedRequest } from '@/lib/services/auth/middleware';

// Simple in-memory lock to dedupe concurrent starts per demo within a single server instance
const startLocks = new Map<string, Promise<unknown>>();

async function handlePOST(req: AuthenticatedRequest): Promise<NextResponse> {
  const supabase = createClient();

  try {
    const user = getRequestUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { demoId, forceNew = false } = await req.json();

    if (!demoId) {
      return NextResponse.json({ error: 'Missing demoId' }, { status: 400 });
    }

    // Use Tavus service to start conversation
    const tavusService = getTavusService();
    
    // Handle concurrent requests with in-memory lock
    if (!forceNew && startLocks.has(demoId)) {
      console.log('Conversation start already in progress for demo', demoId, '— waiting');
      try {
        await startLocks.get(demoId);
      } catch (_) {
        // ignore; we'll proceed to try again
      }
      
      // Check if conversation was created while waiting
      const statusResult = await tavusService.getConversationStatusForDemo(demoId, supabase);
      if (statusResult.success && statusResult.data?.hasActiveConversation) {
        return NextResponse.json({
          conversation_id: statusResult.data.conversationId || null,
          conversation_url: statusResult.data.conversationUrl,
        });
      }
    }

    // Define the creation flow so we can run it under the lock
    const doStart = async (): Promise<NextResponse | any> => {
      const result = await tavusService.startConversationForDemo(demoId, user.id, supabase, forceNew);
      
      if (!result.success) {
        const errorMsg = result.error || 'Failed to start conversation';
        
        if (process.env.NODE_ENV !== 'production') {
          return NextResponse.json({
            error: errorMsg,
            details: result.error,
          }, { status: 500 });
        }
        
        return NextResponse.json({ error: errorMsg }, { status: 500 });
      }

      return result.data;
    };

    // Execute under in-memory lock
    let result: any;
    if (startLocks.has(demoId)) {
      console.log('Conversation start already in progress for demo', demoId, '— waiting');
      try {
        await startLocks.get(demoId);
      } catch (_) {}
      
      // After wait, check if conversation exists
      const statusResult = await tavusService.getConversationStatusForDemo(demoId, supabase);
      if (statusResult.success && statusResult.data?.hasActiveConversation) {
        return NextResponse.json({
          conversation_id: statusResult.data.conversationId || null,
          conversation_url: statusResult.data.conversationUrl,
        });
      }
    }

    const p = doStart();
    startLocks.set(demoId, p);
    try {
      result = await p;
    } finally {
      startLocks.delete(demoId);
    }

    if (result instanceof NextResponse) {
      return result;
    }
    return NextResponse.json(result);

  } catch (error: unknown) {
    logError(error, 'Start Conversation Error');
    const message = getErrorMessage(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export const POST = wrapRouteHandlerWithSentry(withAuth(handlePOST), {
  method: 'POST',
  parameterizedRoute: '/api/tavus/conversations/start',
});