import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { wrapRouteHandlerWithSentry } from '@/lib/sentry-utils';
import { getErrorMessage, logError } from '@/lib/errors';
import { getWebhookDataIngestionService } from '@/lib/services/webhooks';

async function handlePOST(request: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
    const serviceKey = process.env.SUPABASE_SECRET_KEY as string;
    if (!supabaseUrl || !serviceKey) {
      console.error('Supabase service credentials missing');
      return NextResponse.json(
        { error: 'Server not configured' },
        { status: 500 }
      );
    }
    const supabase = createClient(supabaseUrl, serviceKey);
    const body = await request.json();
    const { conversation_id, demo_id, cta_url } = body;

    if (!conversation_id || !demo_id) {
      return NextResponse.json(
        { error: 'Missing required fields: conversation_id and demo_id' },
        { status: 400 }
      );
    }

    // Get user agent and IP for tracking
    const userAgent = request.headers.get('user-agent') || '';
    const forwardedFor = request.headers.get('x-forwarded-for');
    const realIp = request.headers.get('x-real-ip');
    const ipAddress = forwardedFor?.split(',')[0] || realIp || request.ip || '';

    // Use webhook data ingestion service to track CTA click
    const dataIngestionService = getWebhookDataIngestionService();
    const result = await dataIngestionService.trackCTAClick({
      conversationId: conversation_id,
      demoId: demo_id,
      ctaUrl: cta_url,
      userAgent,
      ipAddress,
      timestamp: new Date().toISOString()
    }, supabase);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to track CTA click' },
        { status: 500 }
      );
    }

    console.log(`Tracked CTA click for conversation ${conversation_id}, demo ${demo_id}`);
    return NextResponse.json({ success: true });

  } catch (error: unknown) {
    logError(error, 'CTA Click Tracking Error');
    const message = getErrorMessage(error);
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}

export const POST = wrapRouteHandlerWithSentry(handlePOST, {
  method: 'POST',
  parameterizedRoute: '/api/track-cta-click',
});