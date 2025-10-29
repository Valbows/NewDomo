import { NextResponse } from 'next/server';
import { getWebhookUrl } from '@/lib/tavus';

/**
 * Simple API route to get the current webhook URL
 * Used by the WebhookUrlDisplay component
 */
export async function GET() {
  try {
    const webhookUrl = getWebhookUrl();
    
    return NextResponse.json({
      success: true,
      webhookUrl,
      isNgrok: webhookUrl.includes('ngrok'),
      isLocalhost: webhookUrl.includes('localhost'),
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}