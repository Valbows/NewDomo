/**
 * ============================================================================
 * ⚠️  DOMO SCORE DEPENDENCY - DO NOT MODIFY WITHOUT TESTING SCORE ⚠️
 * ============================================================================
 *
 * This API endpoint writes to the `cta_tracking` table which directly
 * affects the "CTA Execution" criterion of the Domo Score.
 *
 * Before modifying this file:
 *   1. Run existing tests: npm run test:all
 *   2. After changes, verify Domo Score still calculates correctly
 *   3. Test CTA click tracking in a real conversation
 *
 * See: src/lib/domo-score/index.ts for centralized Domo Score documentation
 * ============================================================================
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
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

    // Ensure we capture clicks even if the 'show_trial_cta' tool call didn't run on the server
    const now = new Date().toISOString();
    const { data: existing } = await supabase
      .from('cta_tracking')
      .select('id, cta_url')
      .eq('conversation_id', conversation_id)
      .single();

    if (existing?.id) {
      const { error: updateErr } = await supabase
        .from('cta_tracking')
        .update({
          cta_clicked_at: now,
          user_agent: userAgent,
          ip_address: ipAddress,
          updated_at: now,
          cta_url: cta_url || existing.cta_url || null,
        })
        .eq('id', existing.id);

      if (updateErr) {
        console.error('Failed to update CTA click:', updateErr);
        return NextResponse.json(
          { error: 'Failed to track CTA click' },
          { status: 500 }
        );
      }
    } else {
      const { error: insertErr } = await supabase
        .from('cta_tracking')
        .insert({
          conversation_id,
          demo_id,
          cta_clicked_at: now,
          user_agent: userAgent,
          ip_address: ipAddress,
          updated_at: now,
          cta_url: cta_url || null,
        });

      if (insertErr) {
        console.error('Failed to insert CTA click:', insertErr);
        return NextResponse.json(
          { error: 'Failed to track CTA click' },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Error in track-cta-click API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}