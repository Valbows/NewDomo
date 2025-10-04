import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
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

    // Update the CTA tracking record with click timestamp
    const { error } = await supabase
      .from('cta_tracking')
      .update({
        cta_clicked_at: new Date().toISOString(),
        user_agent: userAgent,
        ip_address: ipAddress,
        updated_at: new Date().toISOString()
      })
      .eq('conversation_id', conversation_id)
      .eq('demo_id', demo_id);

    if (error) {
      console.error('Failed to track CTA click:', error);
      return NextResponse.json(
        { error: 'Failed to track CTA click' },
        { status: 500 }
      );
    }

    console.log(`Tracked CTA click for conversation ${conversation_id}, demo ${demo_id}`);
    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Error in track-cta-click API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}