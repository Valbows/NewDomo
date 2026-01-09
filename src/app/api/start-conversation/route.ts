import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { createServiceClient } from '@/utils/supabase/service';
import { wrapRouteHandlerWithSentry } from '@/lib/sentry-utils';
import { getErrorMessage, logError } from '@/lib/errors';
import { logger } from '@/lib/debug-logger';

// Maximum concurrent conversations allowed per account (Tavus Starter plan = 3)
const MAX_CONCURRENT_CONVERSATIONS = parseInt(process.env.TAVUS_MAX_CONCURRENT || '3', 10);

// Simple in-memory lock to dedupe concurrent starts per user session
const startLocks = new Map<string, Promise<unknown>>();

// Count active conversations across all demos owned by a user
async function countActiveConversationsForUser(userId: string): Promise<number> {
  const supabase = createServiceClient();

  // First get all demo IDs owned by this user
  const { data: demos, error: demosError } = await supabase
    .from('demos')
    .select('id')
    .eq('user_id', userId);

  if (demosError || !demos || demos.length === 0) {
    return 0;
  }

  const demoIds = demos.map(d => d.id);

  // Count active conversations for these demos
  const { count, error } = await supabase
    .from('conversation_details')
    .select('*', { count: 'exact', head: true })
    .in('demo_id', demoIds)
    .in('status', ['active', 'starting', 'waiting']);

  if (error) {
    logger.warn('Error counting active conversations for user', { error, userId });
    return 0;
  }

  logger.info(`User ${userId} has ${count || 0} active conversations`);
  return count || 0;
}

async function handlePOST(req: NextRequest): Promise<NextResponse> {
  const supabase = createClient();
  const serviceSupabase = createServiceClient();

  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { demoId } = await req.json();

    if (!demoId) {
      return NextResponse.json({ error: 'Missing demoId' }, { status: 400 });
    }

    // Verify user owns the demo and get the persona ID
    const { data: demo, error: demoError } = await supabase
      .from('demos')
      .select('user_id, tavus_persona_id, metadata, name')
      .eq('id', demoId)
      .single();

    if (demoError || !demo || demo.user_id !== user.id) {
      return NextResponse.json({ error: 'Demo not found or you do not have permission.' }, { status: 404 });
    }

    if (!demo.tavus_persona_id) {
      return NextResponse.json({ error: 'This demo does not have a configured agent persona.' }, { status: 400 });
    }

    const tavusApiKey = process.env.TAVUS_API_KEY;
    if (!tavusApiKey) {
      return NextResponse.json({ error: 'Tavus API key is not configured.' }, { status: 500 });
    }

    // Check concurrent conversation limit BEFORE creating a new one
    const activeCount = await countActiveConversationsForUser(user.id);
    if (activeCount >= MAX_CONCURRENT_CONVERSATIONS) {
      logger.warn(`User ${user.id} at max capacity: ${activeCount}/${MAX_CONCURRENT_CONVERSATIONS}`);
      return NextResponse.json({
        error: 'Maximum concurrent conversations reached',
        message: `You have reached the maximum of ${MAX_CONCURRENT_CONVERSATIONS} active conversations. Please wait for an existing conversation to end before starting a new one.`,
        code: 'MAX_CAPACITY_REACHED',
        activeCount,
        maxAllowed: MAX_CONCURRENT_CONVERSATIONS,
      }, { status: 429 });
    }

    // Generate unique session ID for this user's conversation request
    const sessionId = `${user.id}-${Date.now()}`;

    // Use lock to prevent duplicate starts from rapid clicks
    if (startLocks.has(sessionId)) {
      logger.info('Duplicate start request detected, waiting for existing request');
      await startLocks.get(sessionId);
    }

    // Determine replica_id: prefer env override, else fetch persona default
    let finalReplicaId = (process.env.TAVUS_REPLICA_ID || '').trim();
    if (!finalReplicaId) {
      try {
        const personaResp = await fetch(`https://tavusapi.com/v2/personas/${demo.tavus_persona_id}` , {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': tavusApiKey,
          },
        });
        if (personaResp.ok) {
          const persona = await personaResp.json();
          finalReplicaId = (persona?.default_replica_id || '').trim();
        }
      } catch (e) {
        logger.warn('Error fetching persona default_replica_id:', { error: e });
      }
    }

    // Per Tavus docs, conversations accept callback_url for webhooks
    const baseUrlForWebhook = (process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000').replace(/\/$/, '');
    const urlToken = (process.env.TAVUS_WEBHOOK_TOKEN || '').trim();
    const callbackUrl = `${baseUrlForWebhook}/api/tavus-webhook${urlToken ? `?t=${encodeURIComponent(urlToken)}` : ''}`;

    const conversationPayload: any = {
      persona_id: demo.tavus_persona_id,
      callback_url: callbackUrl,
      ...(finalReplicaId ? { replica_id: finalReplicaId } : {}),
    };
    if (!conversationPayload.replica_id) {
      const msg = 'Missing replica_id: Set TAVUS_REPLICA_ID or assign a default replica to the persona.';
      if (process.env.NODE_ENV !== 'production') {
        return NextResponse.json({
          error: msg,
          hint: 'See Tavus docs: Create Conversation requires persona_id and replica_id unless persona has a default replica.',
          payload: { persona_id: conversationPayload.persona_id },
        }, { status: 400 });
      }
      return NextResponse.json({ error: msg }, { status: 500 });
    }

    // Create conversation with Tavus
    const doStart = async (): Promise<NextResponse | any> => {
      const conversationResponse = await fetch('https://tavusapi.com/v2/conversations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': tavusApiKey,
        },
        body: JSON.stringify(conversationPayload),
      });

      if (!conversationResponse.ok) {
        const contentType = conversationResponse.headers.get('content-type') || '';
        let errorBody: any;
        try {
          errorBody = contentType.includes('application/json')
            ? await conversationResponse.json()
            : await conversationResponse.text();
        } catch (_) {
          try {
            errorBody = await conversationResponse.text();
          } catch {
            errorBody = 'Unable to parse error body';
          }
        }
        logError(errorBody, 'Tavus Conversation API Error');

        // Check if this is a concurrent limit error from Tavus
        const errorStr = JSON.stringify(errorBody).toLowerCase();
        if (errorStr.includes('concurrent') || errorStr.includes('limit') || conversationResponse.status === 429) {
          return NextResponse.json({
            error: 'Maximum concurrent conversations reached',
            message: 'The demo service is currently at capacity. Please try again in a few minutes.',
            code: 'TAVUS_CAPACITY_REACHED',
          }, { status: 429 });
        }

        const base = {
          error: `Failed to start Tavus conversation: ${conversationResponse.status} ${conversationResponse.statusText}`,
        } as any;

        if (process.env.NODE_ENV !== 'production') {
          return NextResponse.json(
            {
              ...base,
              tavusError: errorBody,
              payload: {
                persona_id: conversationPayload.persona_id,
                replica_id: conversationPayload.replica_id,
              },
            },
            { status: conversationResponse.status }
          );
        }
        return NextResponse.json(base, { status: conversationResponse.status });
      }

      const conversationData = await conversationResponse.json();

      logger.info('New conversation created:', {
        conversation_id: conversationData.conversation_id,
        demo_id: demoId,
        user_id: user.id,
      });

      // Create conversation_details record immediately to track active conversations
      const { error: detailsError } = await serviceSupabase
        .from('conversation_details')
        .upsert({
          tavus_conversation_id: conversationData.conversation_id,
          demo_id: demoId,
          conversation_name: `${demo.name || 'Demo'} - ${new Date().toLocaleString()}`,
          status: 'active',
          started_at: new Date().toISOString(),
          created_at: new Date().toISOString(),
        }, {
          onConflict: 'tavus_conversation_id',
        });

      if (detailsError) {
        logger.warn('Failed to create conversation_details record', { error: detailsError });
      } else {
        logger.info(`Created conversation_details for ${conversationData.conversation_id}`);
      }

      // Update demo with latest conversation info (for reference only, not for sharing)
      const { data: currentDemo } = await supabase
        .from('demos')
        .select('metadata')
        .eq('id', demoId)
        .single();

      const currentMetadata = typeof currentDemo?.metadata === 'string'
        ? (() => { try { return JSON.parse(currentDemo?.metadata as any) } catch { return {} } })()
        : currentDemo?.metadata || {};

      await supabase
        .from('demos')
        .update({
          tavus_conversation_id: conversationData.conversation_id,
          metadata: {
            ...currentMetadata,
            tavusShareableLink: conversationData.conversation_url,
            lastConversationStarted: new Date().toISOString(),
          },
        })
        .eq('id', demoId);

      return conversationData;
    };

    // Execute under session lock to prevent duplicate rapid clicks
    const p = doStart();
    startLocks.set(sessionId, p);
    try {
      const result = await p;
      if (result instanceof NextResponse) {
        return result;
      }
      return NextResponse.json(result);
    } finally {
      startLocks.delete(sessionId);
    }

  } catch (error: unknown) {
    logError(error, 'Start Conversation Error');
    const message = getErrorMessage(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export const POST = wrapRouteHandlerWithSentry(handlePOST, {
  method: 'POST',
  parameterizedRoute: '/api/start-conversation',
});
