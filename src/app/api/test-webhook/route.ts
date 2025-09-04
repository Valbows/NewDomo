import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import * as Sentry from '@sentry/nextjs';
import { getErrorMessage, logError } from '@/lib/errors';
import crypto from 'crypto';

async function handlePOST(req: NextRequest) {
  // Initialize to keep consistent server context; not directly used here
  createClient();

  try {
    const body = await req.json().catch(() => ({}));
    const secret = (process.env.TAVUS_WEBHOOK_SECRET || '').trim();
    if (!secret) {
      return NextResponse.json(
        { error: 'TAVUS_WEBHOOK_SECRET is not set. Please configure it in your environment.' },
        { status: 400 }
      );
    }

    // Allow overriding fields via request body for flexible testing
    const conversation_id =
      typeof body.conversation_id === 'string' && body.conversation_id.trim()
        ? body.conversation_id.trim()
        : 'smoke-conv-1';

    // Default to an analytics/perception style event that the ingest path will accept
    const event_type = typeof body.event_type === 'string' ? body.event_type : 'conversation_completed';
    const data = body.data || { perception: { summary: 'Smoke test perception', score: 0.9 } };

    const testEvent = {
      event_type,
      conversation_id,
      data,
      // Optional realistic fields to resemble provider payloads
      id: body.id || undefined,
      created_at: new Date().toISOString(),
    } as Record<string, any>;

    const raw = JSON.stringify(testEvent);
    const sigHex = crypto.createHmac('sha256', secret).update(raw, 'utf8').digest('hex');

    const webhookResponse = await fetch('http://localhost:3000/api/tavus-webhook', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Support the header formats accepted by the webhook verifier
        'x-tavus-signature': `sha256=${sigHex}`,
      },
      body: raw,
    });

    const contentType = webhookResponse.headers.get('content-type') || '';
    const webhookResult = contentType.includes('application/json')
      ? await webhookResponse.json().catch(async () => ({ text: await webhookResponse.text() }))
      : await webhookResponse.text();

    return NextResponse.json({
      message: 'Signed test webhook forwarded',
      status: webhookResponse.status,
      conversation_id,
      result: webhookResult,
    });
  } catch (error: unknown) {
    logError(error, 'Test webhook error');
    const message = getErrorMessage(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export const POST = Sentry.wrapRouteHandlerWithSentry(handlePOST, {
  method: 'POST',
  parameterizedRoute: '/api/test-webhook',
});
