/**
 * ============================================================================
 * ⚠️  DOMO SCORE DEPENDENCY - DO NOT MODIFY WITHOUT TESTING SCORE ⚠️
 * ============================================================================
 *
 * This API endpoint writes to the `video_showcase_data` table which directly
 * affects the "Platform Feature Interest" criterion of the Domo Score.
 *
 * Before modifying this file:
 *   1. Run existing tests: npm run test:all
 *   2. After changes, verify Domo Score still calculates correctly
 *   3. Test video tracking in a real conversation
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
    const { conversation_id, demo_id, video_title } = body;

    if (!conversation_id || !video_title) {
      return NextResponse.json(
        { error: 'Missing required fields: conversation_id and video_title' },
        { status: 400 }
      );
    }

    const now = new Date().toISOString();

    // Check if we already have a record for this conversation
    const { data: existing } = await supabase
      .from('video_showcase_data')
      .select('id, videos_shown')
      .eq('conversation_id', conversation_id)
      .single();

    if (existing?.id) {
      // Update existing record by adding the new video to the array
      const currentVideos = Array.isArray(existing.videos_shown) ? existing.videos_shown : [];
      const updatedVideos = Array.from(new Set([...currentVideos, video_title]));
      
      const { error: updateErr } = await supabase
        .from('video_showcase_data')
        .update({
          videos_shown: updatedVideos,
          received_at: now,
        })
        .eq('id', existing.id);

      if (updateErr) {
        console.error('Failed to update video showcase data:', updateErr);
        return NextResponse.json(
          { error: 'Failed to track video view' },
          { status: 500 }
        );
      }
    } else {
      // Create new record
      const { error: insertErr } = await supabase
        .from('video_showcase_data')
        .insert({
          conversation_id,
          videos_shown: [video_title],
          objective_name: 'video_showcase',
          received_at: now,
        });

      if (insertErr) {
        console.error('Failed to insert video showcase data:', insertErr);
        return NextResponse.json(
          { error: 'Failed to track video view' },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Error in track-video-view API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}