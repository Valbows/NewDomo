import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/utils/supabase/service';
import { wrapRouteHandlerWithSentry } from '@/lib/sentry-utils';
import { getErrorMessage, logError } from '@/lib/errors';
import { logger } from '@/lib/debug-logger';

// Maximum concurrent conversations allowed per account (Tavus Starter plan = 3)
const MAX_CONCURRENT_CONVERSATIONS = parseInt(process.env.TAVUS_MAX_CONCURRENT || '3', 10);

// In-memory lock to prevent duplicate starts per session
const startLocks = new Map<string, Promise<unknown>>();

// Cleanup stale conversations that are marked active but actually ended in Tavus
async function cleanupStaleConversationsForDemo(
  supabase: any,
  demoId: string,
  tavusApiKey: string
): Promise<void> {
  try {
    // Get the user who owns this demo
    const { data: demo } = await supabase
      .from('demos')
      .select('user_id')
      .eq('id', demoId)
      .single();

    if (!demo) return;

    // Get all demos owned by this user
    const { data: userDemos } = await supabase
      .from('demos')
      .select('id')
      .eq('user_id', demo.user_id);

    if (!userDemos || userDemos.length === 0) return;

    const demoIds = userDemos.map((d: { id: string }) => d.id);

    // Find conversations marked as active/starting
    const { data: activeConvs } = await supabase
      .from('conversation_details')
      .select('id, tavus_conversation_id, status')
      .in('demo_id', demoIds)
      .in('status', ['active', 'starting', 'waiting']);

    if (!activeConvs || activeConvs.length === 0) return;

    // Check each with Tavus API (limit to 3 to avoid slowing down start)
    const toCheck = activeConvs.slice(0, 3);

    for (const conv of toCheck) {
      if (!conv.tavus_conversation_id) continue;

      try {
        const response = await fetch(
          `https://tavusapi.com/v2/conversations/${conv.tavus_conversation_id}`,
          {
            method: 'GET',
            headers: { 'x-api-key': tavusApiKey },
          }
        );

        const shouldMarkEnded = response.status === 404 ||
          (response.ok && ['ended', 'completed', 'failed'].includes((await response.json()).status));

        if (shouldMarkEnded) {
          await supabase
            .from('conversation_details')
            .update({
              status: 'ended',
              completed_at: new Date().toISOString(),
            })
            .eq('id', conv.id);

          logger.info(`[Embed] Auto-cleaned stale conversation ${conv.tavus_conversation_id}`);
        }
      } catch {
        // Ignore errors for individual conversation checks
      }
    }
  } catch (error) {
    logger.warn('[Embed] Auto-cleanup failed (non-fatal)', { error });
  }
}

// Count active conversations for a demo's owner
async function countActiveConversationsForDemo(demoId: string): Promise<{ count: number; userId: string | null }> {
  const supabase = createServiceClient();

  // Get the user who owns this demo
  const { data: demo, error: demoError } = await supabase
    .from('demos')
    .select('user_id')
    .eq('id', demoId)
    .single();

  if (demoError || !demo) {
    return { count: 0, userId: null };
  }

  // Get all demos owned by this user
  const { data: userDemos, error: demosError } = await supabase
    .from('demos')
    .select('id')
    .eq('user_id', demo.user_id);

  if (demosError || !userDemos || userDemos.length === 0) {
    return { count: 0, userId: demo.user_id };
  }

  const demoIds = userDemos.map(d => d.id);

  // Count active conversations for these demos
  const { count, error } = await supabase
    .from('conversation_details')
    .select('*', { count: 'exact', head: true })
    .in('demo_id', demoIds)
    .in('status', ['active', 'starting', 'waiting']);

  if (error) {
    logger.warn('Error counting active conversations', { error });
    return { count: 0, userId: demo.user_id };
  }

  logger.info(`Demo owner ${demo.user_id} has ${count || 0} active conversations`);
  return { count: count || 0, userId: demo.user_id };
}

/**
 * POST /api/embed/[token]/start-conversation
 *
 * Public endpoint to start a Tavus conversation for an embedded demo.
 * No authentication required - access is controlled via embed_token.
 */
async function handlePOST(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
): Promise<NextResponse> {
  try {
    const { token } = await params;

    if (!token) {
      return NextResponse.json({ error: 'Missing embed token' }, { status: 400 });
    }

    const supabase = createServiceClient();

    // Fetch demo by embed token
    const { data: demo, error: demoError } = await supabase
      .from('demos')
      .select(`
        id,
        name,
        tavus_persona_id,
        tavus_conversation_id,
        metadata,
        is_embeddable,
        allowed_domains
      `)
      .eq('embed_token', token)
      .eq('is_embeddable', true)
      .single();

    if (demoError || !demo) {
      return NextResponse.json(
        { error: 'Demo not found or embedding is not enabled' },
        { status: 404 }
      );
    }

    // Validate origin if allowed_domains is configured
    const origin = req.headers.get('origin');
    if (demo.allowed_domains && demo.allowed_domains.length > 0 && origin) {
      const allowedOrigins = demo.allowed_domains;
      const isAllowed = allowedOrigins.some((domain: string) => {
        if (domain.startsWith('*.')) {
          const baseDomain = domain.slice(2);
          return origin.endsWith(baseDomain) || origin.endsWith('.' + baseDomain);
        }
        return origin === `https://${domain}` || origin === `http://${domain}`;
      });

      if (!isAllowed) {
        return NextResponse.json(
          { error: 'This domain is not authorized to embed this demo' },
          { status: 403 }
        );
      }
    }

    if (!demo.tavus_persona_id) {
      return NextResponse.json(
        { error: 'This demo does not have a configured agent persona' },
        { status: 400 }
      );
    }

    const tavusApiKey = process.env.TAVUS_API_KEY;
    if (!tavusApiKey) {
      return NextResponse.json(
        { error: 'Tavus API key is not configured' },
        { status: 500 }
      );
    }

    const demoId = demo.id;

    // Auto-cleanup stale conversations before checking limit
    // This prevents phantom "active" conversations from blocking new ones
    await cleanupStaleConversationsForDemo(supabase, demoId, tavusApiKey);

    // Check concurrent conversation limit AFTER cleanup
    const { count: activeCount, userId: demoOwnerId } = await countActiveConversationsForDemo(demoId);
    if (activeCount >= MAX_CONCURRENT_CONVERSATIONS) {
      logger.warn(`[Embed] Demo owner ${demoOwnerId} at max capacity: ${activeCount}/${MAX_CONCURRENT_CONVERSATIONS}`);
      return createCorsResponse({
        error: 'Maximum concurrent conversations reached',
        message: `The demo service is currently at capacity. Please try again in a few minutes.`,
        code: 'MAX_CAPACITY_REACHED',
        activeCount,
        maxAllowed: MAX_CONCURRENT_CONVERSATIONS,
      }, origin, 429);
    }

    // Generate unique session ID for this embed request to prevent duplicate starts
    const sessionId = `embed-${demoId}-${Date.now()}`;

    // Wait if another request is already starting a conversation for this session
    if (startLocks.has(sessionId)) {
      logger.info('[Embed] Duplicate start request detected, waiting for existing request');
      await startLocks.get(sessionId);
    }

    // Get replica ID AND ensure raven-0 perception is enabled
    let replicaId = (process.env.TAVUS_REPLICA_ID || '').trim();
    try {
      const personaResp = await fetch(
        `https://tavusapi.com/v2/personas/${demo.tavus_persona_id}`,
        { headers: { 'Content-Type': 'application/json', 'x-api-key': tavusApiKey } }
      );
      if (personaResp.ok) {
        const persona = await personaResp.json();
        if (!replicaId) {
          replicaId = (persona?.default_replica_id || '').trim();
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
              console.log(`[Embed] Auto-enabled raven-0 for persona ${demo.tavus_persona_id}`);
            }
          } catch (patchErr) {
            logger.warn('[Embed] Failed to auto-enable raven-0 perception:', { error: patchErr });
          }
        }
      }
    } catch (e) {
      logger.warn('[Embed] Error fetching persona:', { error: e });
    }

    if (!replicaId) {
      return NextResponse.json(
        { error: 'Missing replica configuration' },
        { status: 500 }
      );
    }

    // Build callback URL for webhooks
    const baseUrl = (process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000').replace(/\/$/, '');
    const urlToken = (process.env.TAVUS_WEBHOOK_TOKEN || '').trim();
    const callbackUrl = `${baseUrl}/api/tavus-webhook${urlToken ? `?t=${encodeURIComponent(urlToken)}` : ''}`;

    const doStart = async () => {
      const response = await fetch('https://tavusapi.com/v2/conversations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': tavusApiKey,
        },
        body: JSON.stringify({
          persona_id: demo.tavus_persona_id,
          replica_id: replicaId,
          callback_url: callbackUrl,
        }),
      });

      if (!response.ok) {
        const errorBody = await response.text();
        logError(errorBody, '[Embed] Tavus Conversation API Error');
        throw new Error(`Tavus API error: ${response.status}`);
      }

      const conversationData = await response.json();

      // Save conversation to database
      const { data: currentDemo } = await supabase
        .from('demos')
        .select('metadata')
        .eq('id', demoId)
        .single();

      const currentMetadata = typeof currentDemo?.metadata === 'string'
        ? JSON.parse(currentDemo.metadata)
        : currentDemo?.metadata;

      await supabase
        .from('demos')
        .update({
          tavus_conversation_id: conversationData.conversation_id,
          metadata: {
            ...currentMetadata,
            tavusShareableLink: conversationData.conversation_url,
          },
        })
        .eq('id', demoId);

      // Create conversation_details record immediately so webhooks can find it
      // and it shows up in reporting
      const { error: detailsError } = await supabase
        .from('conversation_details')
        .upsert({
          tavus_conversation_id: conversationData.conversation_id,
          demo_id: demoId,
          conversation_name: `${demo.name || 'Demo'} - ${new Date().toLocaleString()}`,
          status: 'active',
          started_at: new Date().toISOString(),
        }, {
          onConflict: 'tavus_conversation_id',
        });

      if (detailsError) {
        logger.warn('[Embed] Failed to create conversation_details record', { error: detailsError });
      } else {
        logger.info(`[Embed] Created conversation_details for ${conversationData.conversation_id}`);
      }

      return conversationData;
    };

    // Execute under lock to prevent duplicate starts from rapid clicks
    const p = doStart();
    startLocks.set(sessionId, p);

    try {
      const result = await p;
      return createCorsResponse(result, origin);
    } finally {
      startLocks.delete(sessionId);
    }

  } catch (error: unknown) {
    logError(error, '[Embed] Start Conversation Error');
    const message = getErrorMessage(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

function createCorsResponse(data: any, origin: string | null, status: number = 200): NextResponse {
  const response = NextResponse.json(data, { status });
  // SECURITY: Prevent caching of conversation URLs - each user must get unique conversation
  response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
  response.headers.set('Pragma', 'no-cache');
  if (origin) {
    response.headers.set('Access-Control-Allow-Origin', origin);
    response.headers.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type');
  }
  return response;
}

async function handleOPTIONS(req: NextRequest): Promise<NextResponse> {
  const origin = req.headers.get('origin');
  const response = new NextResponse(null, { status: 204 });

  if (origin) {
    response.headers.set('Access-Control-Allow-Origin', origin);
    response.headers.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type');
    response.headers.set('Access-Control-Max-Age', '86400');
  }

  return response;
}

export const POST = wrapRouteHandlerWithSentry(handlePOST, {
  method: 'POST',
  parameterizedRoute: '/api/embed/[token]/start-conversation',
});

export const OPTIONS = handleOPTIONS;
