import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/utils/supabase/service';
import { wrapRouteHandlerWithSentry } from '@/lib/sentry-utils';
import { getErrorMessage, logError } from '@/lib/errors';
import { logger } from '@/lib/debug-logger';

// Validate that a URL points to a Daily room
const isDailyRoomUrl = (url: string) => /^https?:\/\/[a-z0-9.-]+\.daily\.co\/.+/i.test(url);

// Check if a Tavus conversation is still active
async function isTavusConversationActive(conversationId: string, apiKey: string): Promise<boolean> {
  try {
    const resp = await fetch(`https://tavusapi.com/v2/conversations/${conversationId}`, {
      method: 'GET',
      headers: { 'x-api-key': apiKey },
    });

    if (!resp.ok) {
      if (resp.status === 404) {
        logger.info(`Tavus conversation ${conversationId} not found (404)`);
        return false;
      }
      logger.warn(`Tavus API returned ${resp.status} when checking conversation ${conversationId}`);
      return false;
    }

    const data = await resp.json();
    const activeStatuses = ['active', 'starting', 'waiting'];
    return activeStatuses.includes(data.status);
  } catch (e) {
    logger.warn(`Error checking Tavus conversation ${conversationId}`, { error: e });
    return false;
  }
}

// In-memory lock to prevent duplicate starts
const startLocks = new Map<string, Promise<unknown>>();

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

    // Check for existing active conversation
    const metadata = typeof demo.metadata === 'string'
      ? JSON.parse(demo.metadata)
      : demo.metadata;
    const existingUrl = metadata?.tavusShareableLink;
    const existingConvId = demo.tavus_conversation_id;

    if (existingUrl && isDailyRoomUrl(existingUrl) && existingConvId) {
      if (await isTavusConversationActive(existingConvId, tavusApiKey)) {
        logger.info(`[Embed] Reusing existing conversation ${existingConvId}`);
        return createCorsResponse(
          { conversation_id: existingConvId, conversation_url: existingUrl },
          origin
        );
      } else {
        // Clear stale conversation data
        const { tavusShareableLink, ...restMetadata } = metadata || {};
        await supabase
          .from('demos')
          .update({ tavus_conversation_id: null, metadata: restMetadata })
          .eq('id', demoId);
        logger.info(`[Embed] Cleared stale conversation for demo ${demoId}`);
      }
    }

    // Wait if another request is already starting a conversation
    if (startLocks.has(demoId)) {
      await startLocks.get(demoId);
      const { data: afterDemo } = await supabase
        .from('demos')
        .select('tavus_conversation_id, metadata')
        .eq('id', demoId)
        .single();

      const md = typeof afterDemo?.metadata === 'string'
        ? JSON.parse(afterDemo.metadata)
        : afterDemo?.metadata;
      const url = md?.tavusShareableLink;
      if (url && isDailyRoomUrl(url)) {
        return createCorsResponse(
          { conversation_id: afterDemo?.tavus_conversation_id, conversation_url: url },
          origin
        );
      }
    }

    // Get replica ID
    let replicaId = (process.env.TAVUS_REPLICA_ID || '').trim();
    if (!replicaId) {
      const personaResp = await fetch(
        `https://tavusapi.com/v2/personas/${demo.tavus_persona_id}`,
        { headers: { 'Content-Type': 'application/json', 'x-api-key': tavusApiKey } }
      );
      if (personaResp.ok) {
        const persona = await personaResp.json();
        replicaId = (persona?.default_replica_id || '').trim();
      }
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
          conversation_name: conversationData.conversation_name || `Embed Conversation ${new Date().toLocaleString()}`,
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

    // Execute under lock
    const p = doStart();
    startLocks.set(demoId, p);

    try {
      const result = await p;
      return createCorsResponse(result, origin);
    } finally {
      startLocks.delete(demoId);
    }

  } catch (error: unknown) {
    logError(error, '[Embed] Start Conversation Error');
    const message = getErrorMessage(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

function createCorsResponse(data: any, origin: string | null): NextResponse {
  const response = NextResponse.json(data);
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
