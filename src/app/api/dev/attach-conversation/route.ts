import { NextRequest, NextResponse } from 'next/server';
import * as Sentry from '@sentry/nextjs';
import { createClient as createServiceClient } from '@supabase/supabase-js';
import { getErrorMessage, logError } from '@/lib/errors';

async function handle(req: NextRequest) {
  try {
    // Disable in production for security
    if (process.env.NODE_ENV === 'production') {
      return NextResponse.json({ error: 'Not available' }, { status: 404 });
    }

    const url = req.nextUrl;
    const method = req.method || 'GET';

    let demoId: string | null = null;
    let conversationId: string | null = null;
    let withUrl = false;

    if (method === 'GET') {
      demoId = url.searchParams.get('demoId');
      conversationId = url.searchParams.get('conversationId');
      withUrl = url.searchParams.get('withUrl') === 'true';
    } else {
      const body = (await req.json().catch(() => ({}))) as any;
      demoId = body.demoId ?? null;
      conversationId = body.conversationId ?? null;
      withUrl = Boolean(body.withUrl);
    }

    if (!demoId) {
      return NextResponse.json({ error: 'Missing demoId' }, { status: 400 });
    }

    if (!conversationId) {
      conversationId = `conv_${Date.now()}`;
    }

    const supabase = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SECRET_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // Fetch existing metadata to merge
    const { data: existing, error: fetchErr } = await supabase
      .from('demos')
      .select('metadata')
      .eq('id', demoId)
      .single();

    if (fetchErr) {
      logError(fetchErr, 'attach-conversation: fetch demo');
    }

    const rawMd = (existing as any)?.metadata;
    const mdObj =
      typeof rawMd === 'string'
        ? (() => {
            try {
              return JSON.parse(rawMd);
            } catch {
              return {} as any;
            }
          })()
        : rawMd || {};

    if (withUrl && !mdObj.tavusShareableLink) {
      const roomSlug = `room_${String(conversationId).slice(0, 8)}`;
      // Best-effort Daily-like URL for UX testing only
      mdObj.tavusShareableLink = `https://demo.daily.co/${roomSlug}`;
    }

    const { data, error: updateErr } = await supabase
      .from('demos')
      .update({ tavus_conversation_id: conversationId, metadata: mdObj })
      .eq('id', demoId)
      .select('id, tavus_conversation_id, metadata')
      .single();

    if (updateErr) {
      logError(updateErr, 'attach-conversation: update demo');
      return NextResponse.json({ error: getErrorMessage(updateErr) }, { status: 500 });
    }

    return NextResponse.json({ success: true, demo: data });
  } catch (err: any) {
    logError(err, 'attach-conversation: error');
    return NextResponse.json({ error: getErrorMessage(err) }, { status: 500 });
  }
}

export const GET = Sentry.wrapRouteHandlerWithSentry(handle, {
  method: 'GET',
  parameterizedRoute: '/api/dev/attach-conversation',
});

export const POST = Sentry.wrapRouteHandlerWithSentry(handle, {
  method: 'POST',
  parameterizedRoute: '/api/dev/attach-conversation',
});
