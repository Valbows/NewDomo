import { NextRequest, NextResponse } from 'next/server';
import { updateWebhookUrlsForAllObjectives, getWebhookUrlStatus } from '@/lib/tavus';

/**
 * API route to update webhook URLs when ngrok restarts
 * GET: Check current webhook URL status
 * POST: Update all objectives with new webhook URL
 */

export async function GET() {
  try {
    const status = getWebhookUrlStatus();
    
    return NextResponse.json({
      success: true,
      status,
      message: status.warning || 'Webhook URL status OK'
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const { newWebhookUrl } = body;
    
    console.log('🔄 Updating webhook URLs for all objectives...');
    
    await updateWebhookUrlsForAllObjectives(newWebhookUrl);
    
    const status = getWebhookUrlStatus();
    
    return NextResponse.json({
      success: true,
      message: 'All webhook URLs updated successfully',
      newWebhookUrl: status.webhookUrl,
      status
    });
  } catch (error) {
    console.error('❌ Error updating webhook URLs:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update webhook URLs'
    }, { status: 500 });
  }
}