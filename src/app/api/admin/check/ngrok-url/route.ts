import { NextResponse } from 'next/server';
import { getCurrentNgrokUrl, checkNgrokUrlChanged, autoUpdateWebhookUrls } from '@/lib/ngrok/ngrok-utils';

/**
 * API route to check and auto-update ngrok URLs
 * GET: Check if ngrok URL has changed
 * POST: Auto-update webhook URLs if ngrok URL changed
 */

export async function GET() {
  try {
    const currentUrl = await getCurrentNgrokUrl();
    const { changed, envUrl } = await checkNgrokUrlChanged();
    
    return NextResponse.json({
      success: true,
      currentNgrokUrl: currentUrl,
      environmentUrl: envUrl,
      hasChanged: changed,
      message: changed 
        ? 'Ngrok URL has changed - consider updating webhook URLs' 
        : 'Ngrok URL is up to date'
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function POST() {
  try {
    console.log('🔍 Checking for ngrok URL changes...');
    
    const updated = await autoUpdateWebhookUrls();
    const { currentUrl, envUrl } = await checkNgrokUrlChanged();
    
    return NextResponse.json({
      success: true,
      updated,
      currentNgrokUrl: currentUrl,
      environmentUrl: envUrl,
      message: updated 
        ? 'Webhook URLs updated with new ngrok URL' 
        : 'No ngrok URL changes detected'
    });
  } catch (error) {
    console.error('❌ Error in auto-update:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to auto-update webhook URLs'
    }, { status: 500 });
  }
}