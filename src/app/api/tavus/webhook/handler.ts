import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getErrorMessage, logError } from '@/lib/errors';
import { getWebhookProcessingService } from '@/lib/services/webhooks';

// Testable handler for Tavus webhook; used by tests directly and by the route wrapper.
export async function handlePOST(req: NextRequest) {
  // Create Supabase client with service role for webhook authentication
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SECRET_KEY!
  );

  try {
    const rawBody = await req.text();
    
    // Extract headers for webhook service
    const headers: Record<string, string | null> = {
      'content-type': req.headers.get('content-type'),
      'x-tavus-signature': req.headers.get('x-tavus-signature'),
      'tavus-signature': req.headers.get('tavus-signature'),
      'x-signature': req.headers.get('x-signature'),
      'user-agent': req.headers.get('user-agent'),
    };

    // Extract URL parameters
    const urlObj = (req as any)?.nextUrl ?? new URL((req as any)?.url);
    const urlParams = urlObj.searchParams;

    // Get webhook processing service
    const webhookService = getWebhookProcessingService();

    // Parse event from raw body
    let event;
    try {
      event = JSON.parse(rawBody);
    } catch (error) {
      return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 });
    }

    // Verify webhook authenticity
    const signature = 
      headers['x-tavus-signature'] ||
      headers['tavus-signature'] ||
      headers['x-signature'];
    const tokenParam = urlParams.get('t') || urlParams.get('token');

    const config = webhookService.services.security.getSecurityConfig();
    const verificationResult = await webhookService.services.eventProcessing.verifyWebhook(
      rawBody,
      signature,
      tokenParam,
      config
    );

    if (!verificationResult.isValid) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log(`Webhook authenticated via ${verificationResult.method}`);

    // Check idempotency for tool-call events
    const idempotencyResult = await webhookService.services.eventProcessing.checkIdempotency(
      event,
      rawBody,
      supabase
    );

    if (idempotencyResult.isDuplicate) {
      console.log('Idempotency: duplicate tool-call event detected, skipping processing:', idempotencyResult.eventId);
      return NextResponse.json({ received: true });
    }

    // Process the webhook event
    const processingResult = await webhookService.services.eventProcessing.processEvent(
      event,
      supabase
    );

    if (!processingResult.success) {
      console.error('Webhook processing failed:', processingResult.error);
      // Still return success to prevent Tavus from retrying
    }

    // Ingest event data for analytics if the event was processed successfully
    if (processingResult.success && processingResult.processed) {
      await webhookService.services.dataIngestion.processDataIngestion(
        event,
        event.conversation_id || '',
        supabase
      );
    }

    // Acknowledge receipt of the webhook
    return NextResponse.json({ received: true });

  } catch (error: unknown) {
    logError(error, 'Tavus Webhook Error');
    const message = getErrorMessage(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}