import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/utils/supabase/service';
import { wrapRouteHandlerWithSentry } from '@/lib/sentry-utils';
import { getErrorMessage, logError } from '@/lib/errors';
import { logger } from '@/lib/debug-logger';

/**
 * POST /api/embed/[token]/end-conversation
 *
 * Public endpoint to end a Tavus conversation for an embedded demo.
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

    const { conversationId } = await req.json();

    if (!conversationId) {
      return NextResponse.json({ error: 'Missing conversationId' }, { status: 400 });
    }

    const supabase = createServiceClient();

    // Fetch demo by embed token to validate access
    const { data: demo, error: demoError } = await supabase
      .from('demos')
      .select('id, tavus_conversation_id, is_embeddable, allowed_domains')
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

    // Verify the conversation belongs to this demo
    if (demo.tavus_conversation_id !== conversationId) {
      return NextResponse.json(
        { error: 'Conversation does not belong to this demo' },
        { status: 403 }
      );
    }

    const tavusApiKey = process.env.TAVUS_API_KEY;
    if (!tavusApiKey) {
      return NextResponse.json(
        { error: 'Tavus API key is not configured' },
        { status: 500 }
      );
    }

    // End the conversation via Tavus API
    const response = await fetch(
      `https://tavusapi.com/v2/conversations/${conversationId}/end`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': tavusApiKey,
        },
      }
    );

    if (!response.ok && response.status !== 404) {
      const errorText = await response.text();
      logger.warn(`[Embed] Failed to end conversation ${conversationId}: ${response.status}`, {
        error: errorText,
      });
    }

    // Update conversation_details with ended status and calculate duration
    const { data: convDetails } = await supabase
      .from('conversation_details')
      .select('started_at')
      .eq('tavus_conversation_id', conversationId)
      .single();

    const completedAt = new Date().toISOString();
    let durationSeconds = null;

    if (convDetails?.started_at) {
      const startTime = new Date(convDetails.started_at).getTime();
      const endTime = new Date(completedAt).getTime();
      durationSeconds = Math.round((endTime - startTime) / 1000);
    }

    await supabase
      .from('conversation_details')
      .update({
        status: 'ended',
        completed_at: completedAt,
        duration_seconds: durationSeconds,
      })
      .eq('tavus_conversation_id', conversationId);

    logger.info(`[Embed] Ended conversation ${conversationId}`, {
      duration_seconds: durationSeconds,
    });

    const corsResponse = NextResponse.json({ success: true });
    if (origin) {
      corsResponse.headers.set('Access-Control-Allow-Origin', origin);
      corsResponse.headers.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
      corsResponse.headers.set('Access-Control-Allow-Headers', 'Content-Type');
    }

    return corsResponse;

  } catch (error: unknown) {
    logError(error, '[Embed] End Conversation Error');
    const message = getErrorMessage(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
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
  parameterizedRoute: '/api/embed/[token]/end-conversation',
});

export const OPTIONS = handleOPTIONS;
