import { NextRequest, NextResponse } from 'next/server';
import * as Sentry from '@sentry/nextjs';
import { createClient as createServiceClient } from '@supabase/supabase-js';
import crypto from 'crypto';
import { getErrorMessage, logError } from '@/lib/errors';

async function handle(req: NextRequest) {
  try {
    // Disable in production for security
    if (process.env.NODE_ENV === 'production') {
      return NextResponse.json({ error: 'Not available' }, { status: 404 });
    }

    const secret = process.env.TAVUS_WEBHOOK_SECRET;
    if (!secret) {
      return NextResponse.json({ error: 'TAVUS_WEBHOOK_SECRET not configured' }, { status: 500 });
    }

    const isGet = (req.method || 'GET') === 'GET';
    const url = req.nextUrl;

    let conversation_id: string | null = null;
    let demoId: string | null = null;
    let event_type: string = 'application.conversation.completed';
    let payloadOverride: any = null;
    let baseUrlOverride: string | null = null;

    if (isGet) {
      conversation_id = url.searchParams.get('conversation_id');
      demoId = url.searchParams.get('demoId');
      event_type = url.searchParams.get('event_type') || event_type;
      const payloadStr = url.searchParams.get('payload');
      baseUrlOverride = url.searchParams.get('baseUrl');
      if (payloadStr) {
        try {
          payloadOverride = JSON.parse(payloadStr);
        } catch {}
      }
    } else {
      const body = (await req.json().catch(() => ({}))) as any;
      conversation_id = body.conversation_id ?? null;
      demoId = body.demoId ?? null;
      event_type = body.event_type || event_type;
      payloadOverride = body.payload || null;
      baseUrlOverride = body.baseUrl || null;
    }

    if (!conversation_id && demoId) {
      const supabase = createServiceClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SECRET_KEY!,
        { auth: { autoRefreshToken: false, persistSession: false } }
      );
      const { data: d } = await supabase
        .from('demos')
        .select('tavus_conversation_id')
        .eq('id', demoId)
        .single();
      conversation_id = (d as any)?.tavus_conversation_id || null;
    }

    if (!conversation_id) {
      return NextResponse.json(
        { error: 'Missing conversation_id (or provide demoId with existing tavus_conversation_id)' },
        { status: 400 }
      );
    }

    const event =
      payloadOverride ?? {
        id: `evt_${Date.now()}`,
        event_type,
        conversation_id,
        data: {
          perception: {
            sentiment_score: 0.82,
            emotion: 'positive',
            user_email: 'user@example.com',
            utterances: Array.from({ length: 300 }).map((_, i) => `u${i}`),
            media: '...large...',
            notes: 'Sample dev event for perception ingestion',
          },
          summary: {
            overall: 'Great conversation',
            score: 0.9,
          },
        },
      };

    const payload = JSON.stringify(event);
    const sig = crypto.createHmac('sha256', secret).update(payload, 'utf8').digest('base64');
    const baseUrl =
      baseUrlOverride || url.origin || process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const target = `${baseUrl.replace(/\/$/, '')}/api/tavus/webhook`;

    const res = await fetch(target, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-tavus-signature': `sha256=${sig}`,
      },
      body: payload,
    });

    const text = await res.text();
    let json: any = null;
    try {
      json = JSON.parse(text);
    } catch {
      json = { raw: text };
    }

    return NextResponse.json({
      sent: true,
      target,
      status: res.status,
      webhook_response: json,
      event,
    });
  } catch (err: any) {
    logError(err, 'send-tavus-event: error');
    return NextResponse.json({ error: getErrorMessage(err) }, { status: 500 });
  }
}

export const GET = Sentry.wrapRouteHandlerWithSentry(handle, {
  method: 'GET',
  parameterizedRoute: '/api/dev/send-tavus-event',
});

export const POST = Sentry.wrapRouteHandlerWithSentry(handle, {
  method: 'POST',
  parameterizedRoute: '/api/dev/send-tavus-event',
});
