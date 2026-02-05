import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { createServiceClient } from '@/utils/supabase/service';
import { wrapRouteHandlerWithSentry } from '@/lib/sentry-utils';
import { getErrorMessage, logError } from '@/lib/errors';
import { logger } from '@/lib/debug-logger';

// Maximum concurrent conversations allowed per account (Tavus Starter plan = 3)
const MAX_CONCURRENT_CONVERSATIONS = parseInt(process.env.TAVUS_MAX_CONCURRENT || '3', 10);

// Public demo ID that can be accessed without authentication (Workday demo)
const PUBLIC_DEMO_ID = 'cbb04ff3-07e7-46bf-bfc3-db47ceaf85de';

// Simple in-memory lock to dedupe concurrent starts per user session
const startLocks = new Map<string, Promise<unknown>>();

// Clean up stale conversations by checking actual status with Tavus API
async function cleanupStaleConversations(userId: string): Promise<void> {
  const supabase = createServiceClient();
  const tavusApiKey = process.env.TAVUS_API_KEY;

  if (!tavusApiKey) return;

  // Get all demo IDs owned by this user
  const { data: demos, error: demosError } = await supabase
    .from('demos')
    .select('id')
    .eq('user_id', userId);

  if (demosError || !demos || demos.length === 0) return;

  const demoIds = demos.map(d => d.id);

  // Get all "active" conversations for these demos
  const { data: activeConversations, error: fetchError } = await supabase
    .from('conversation_details')
    .select('id, tavus_conversation_id, status, started_at')
    .in('demo_id', demoIds)
    .in('status', ['active', 'starting', 'waiting']);

  if (fetchError || !activeConversations || activeConversations.length === 0) return;

  // Check each conversation with Tavus API and clean up stale ones
  for (const conv of activeConversations) {
    try {
      // Skip if no tavus_conversation_id
      if (!conv.tavus_conversation_id) {
        // Mark as ended if started more than 1 hour ago with no conversation ID
        const startedAt = new Date(conv.started_at || 0).getTime();
        const oneHourAgo = Date.now() - (60 * 60 * 1000);
        if (startedAt < oneHourAgo) {
          await supabase
            .from('conversation_details')
            .update({ status: 'ended', completed_at: new Date().toISOString() })
            .eq('id', conv.id);
          logger.info(`Cleaned up stale conversation without tavus_id: ${conv.id}`);
        }
        continue;
      }

      // Check actual status with Tavus API
      const response = await fetch(
        `https://tavusapi.com/v2/conversations/${conv.tavus_conversation_id}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': tavusApiKey,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        // If Tavus says it's ended, update our record
        if (data.status === 'ended' || data.status === 'completed') {
          await supabase
            .from('conversation_details')
            .update({
              status: 'ended',
              completed_at: data.updated_at || new Date().toISOString(),
            })
            .eq('id', conv.id);
          logger.info(`Cleaned up stale conversation ${conv.tavus_conversation_id} - Tavus status: ${data.status}`);
        }
      } else if (response.status === 404) {
        // Conversation doesn't exist in Tavus, mark as ended
        await supabase
          .from('conversation_details')
          .update({ status: 'ended', completed_at: new Date().toISOString() })
          .eq('id', conv.id);
        logger.info(`Cleaned up conversation ${conv.tavus_conversation_id} - not found in Tavus`);
      }
    } catch (err) {
      logger.warn(`Error checking conversation ${conv.tavus_conversation_id}:`, { error: err });
    }
  }
}

// Count active conversations across all demos owned by a user
async function countActiveConversationsForUser(userId: string): Promise<number> {
  const supabase = createServiceClient();

  // First clean up any stale conversations
  await cleanupStaleConversations(userId);

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
    const body = await req.json();
    const { demoId, viewerMode, viewerEmail } = body;

    if (!demoId) {
      return NextResponse.json({ error: 'Missing demoId' }, { status: 400 });
    }

    let user: { id: string } | null = null;
    let demo: { user_id: string; tavus_persona_id: string | null; metadata: any; name: string } | null = null;

    // Check if this is a viewer mode request for the public demo
    if (viewerMode && demoId === PUBLIC_DEMO_ID) {
      // Use service client to fetch public demo data (bypasses RLS)
      const { data: publicDemo, error: publicDemoError } = await serviceSupabase
        .from('demos')
        .select('user_id, tavus_persona_id, metadata, name')
        .eq('id', demoId)
        .single();

      if (publicDemoError || !publicDemo) {
        return NextResponse.json({ error: 'Demo not found.' }, { status: 404 });
      }

      demo = publicDemo;
      // Use the demo owner's ID for tracking purposes
      user = { id: publicDemo.user_id };
      logger.info('Public viewer mode: starting conversation for Workday demo', { viewerEmail });
    } else {
      // Standard authenticated flow
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      user = authUser;

      // Verify user owns the demo and get the persona ID
      const { data: userDemo, error: demoError } = await supabase
        .from('demos')
        .select('user_id, tavus_persona_id, metadata, name')
        .eq('id', demoId)
        .single();

      if (demoError || !userDemo || userDemo.user_id !== authUser.id) {
        return NextResponse.json({ error: 'Demo not found or you do not have permission.' }, { status: 404 });
      }

      demo = userDemo;
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

    // Determine replica_id AND ensure raven-0 perception is enabled
    let finalReplicaId = (process.env.TAVUS_REPLICA_ID || '').trim();
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
        if (!finalReplicaId) {
          finalReplicaId = (persona?.default_replica_id || '').trim();
        }

        // Auto-enable raven-0 perception if not set (ensures perception_analysis is captured)
        if (persona.perception_model !== 'raven-0') {
          try {
            await fetch(`https://tavusapi.com/v2/personas/${demo.tavus_persona_id}`, {
              method: 'PATCH',
              headers: {
                'Content-Type': 'application/json',
                'x-api-key': tavusApiKey,
              },
              body: JSON.stringify([
                { op: 'add', path: '/perception_model', value: 'raven-0' }
              ])
            });
            if (process.env.NODE_ENV !== 'production') {
              console.log(`[start-conversation] Auto-enabled raven-0 for persona ${demo.tavus_persona_id}`);
            }
          } catch (patchErr) {
            logger.warn('Failed to auto-enable raven-0 perception:', { error: patchErr });
          }
        }
      }
    } catch (e) {
      logger.warn('Error fetching persona:', { error: e });
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
        // Add no-cache headers to prevent any caching of conversation URLs
        result.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
        result.headers.set('Pragma', 'no-cache');
        return result;
      }
      // SECURITY: Each conversation URL is unique and must never be cached or shared
      const response = NextResponse.json(result);
      response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
      response.headers.set('Pragma', 'no-cache');
      return response;
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
