import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/utils/supabase/service';
import { wrapRouteHandlerWithSentry } from '@/lib/sentry-utils';
import { getErrorMessage, logError } from '@/lib/errors';

/**
 * GET /api/embed/[token]/config
 *
 * Public endpoint to fetch demo configuration for embedding.
 * No authentication required - access is controlled via embed_token.
 */
async function handleGET(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
): Promise<NextResponse> {
  try {
    const { token } = await params;

    if (!token) {
      return NextResponse.json({ error: 'Missing embed token' }, { status: 400 });
    }

    // Use service client to bypass RLS for public embed access
    const supabase = createServiceClient();

    // Fetch demo by embed token - only if embeddable
    const { data: demo, error: demoError } = await supabase
      .from('demos')
      .select(`
        id,
        name,
        tavus_persona_id,
        tavus_conversation_id,
        cta_title,
        cta_message,
        cta_button_text,
        cta_button_url,
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

    // Optional: Validate allowed domains if configured
    const origin = req.headers.get('origin');
    if (demo.allowed_domains && demo.allowed_domains.length > 0 && origin) {
      const allowedOrigins = demo.allowed_domains;
      const isAllowed = allowedOrigins.some((domain: string) => {
        // Support both exact matches and wildcard subdomains
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

    // Extract agent name from metadata
    const metadata = typeof demo.metadata === 'string'
      ? JSON.parse(demo.metadata)
      : demo.metadata;

    // Return minimal config needed for embedding
    const config = {
      demoId: demo.id,
      name: demo.name,
      agentName: metadata?.agentName || 'AI Assistant',
      hasPersona: !!demo.tavus_persona_id,
      cta: {
        title: demo.cta_title || metadata?.ctaTitle,
        message: demo.cta_message || metadata?.ctaMessage,
        buttonText: demo.cta_button_text || metadata?.ctaButtonText,
        buttonUrl: demo.cta_button_url || metadata?.ctaButtonUrl,
      },
    };

    // Set CORS headers for embedding
    const response = NextResponse.json(config);

    if (origin) {
      response.headers.set('Access-Control-Allow-Origin', origin);
      response.headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
      response.headers.set('Access-Control-Allow-Headers', 'Content-Type');
    }

    return response;

  } catch (error: unknown) {
    logError(error, 'Embed Config Error');
    const message = getErrorMessage(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// Handle CORS preflight
async function handleOPTIONS(req: NextRequest): Promise<NextResponse> {
  const origin = req.headers.get('origin');
  const response = new NextResponse(null, { status: 204 });

  if (origin) {
    response.headers.set('Access-Control-Allow-Origin', origin);
    response.headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type');
    response.headers.set('Access-Control-Max-Age', '86400');
  }

  return response;
}

export const GET = wrapRouteHandlerWithSentry(handleGET, {
  method: 'GET',
  parameterizedRoute: '/api/embed/[token]/config',
});

export const OPTIONS = handleOPTIONS;
