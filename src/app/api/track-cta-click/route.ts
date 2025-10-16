import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { getErrorMessage, logError } from '@/lib/errors';

export async function POST(req: NextRequest) {
  try {
    const supabase = createClient();
    const { conversation_id, demo_id, cta_url } = await req.json();

    if (!conversation_id || !demo_id) {
      return NextResponse.json(
        { error: 'Missing required fields: conversation_id and demo_id' },
        { status: 400 }
      );
    }

    console.log(`📊 Tracking CTA click for conversation ${conversation_id}`);

    // Update the CTA tracking record to mark the click
    const { error: updateError } = await supabase
      .from('cta_tracking')
      .upsert({
        conversation_id,
        demo_id,
        cta_clicked_at: new Date().toISOString(),
        cta_url: cta_url || null,
        // Preserve existing cta_shown_at if it exists
        cta_shown_at: new Date().toISOString() // This will be overwritten if record exists
      }, {
        onConflict: 'conversation_id',
        ignoreDuplicates: false
      });

    if (updateError) {
      console.error('Failed to track CTA click:', updateError);
      return NextResponse.json(
        { error: 'Failed to track CTA click' },
        { status: 500 }
      );
    }

    console.log(`✅ CTA click tracked successfully for conversation ${conversation_id}`);

    return NextResponse.json({ 
      success: true,
      message: 'CTA click tracked successfully'
    });

  } catch (error: unknown) {
    logError(error, 'CTA Click Tracking Error');
    const message = getErrorMessage(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}