/**
 * ============================================================================
 * ⚠️  DOMO SCORE DEPENDENCY - DO NOT MODIFY WITHOUT TESTING SCORE ⚠️
 * ============================================================================
 *
 * These handlers write to tables that directly affect Domo Score:
 *   - handleFetchVideo → video_showcase_data → "Platform Feature Interest" criterion
 *   - handleShowTrialCTA → cta_tracking → "CTA Execution" criterion
 *
 * Before modifying these handlers:
 *   1. Run existing tests: npm run test:all
 *   2. After changes, verify Domo Score still calculates correctly
 *   3. Test with a real Tavus tool call event
 *
 * See: src/lib/domo-score/index.ts for centralized Domo Score documentation
 * ============================================================================
 */

import { NextResponse } from 'next/server';
import { logError } from '@/lib/errors';
import { broadcastToDemo } from '../utils/broadcast';

export async function handleFetchVideo(
  supabase: any,
  conversationId: string,
  videoTitle: string
): Promise<NextResponse> {
  if (!videoTitle || typeof videoTitle !== 'string' || !videoTitle.trim()) {
    logError('Webhook: Missing or invalid video title for fetch_video/play_video', 'ToolCall Validation');

    // Alert: Guardrail violation detected
    console.warn('🚨 GUARDRAIL VIOLATION: Invalid video title in tool call', {
      conversation_id: conversationId,
      timestamp: new Date().toISOString()
    });

    return NextResponse.json({ message: 'Invalid or missing video title.' });
  }

  // 1. Find the demo associated with this conversation
  const { data: demo, error: demoError } = await supabase
    .from('demos')
    .select('id')
    .eq('tavus_conversation_id', conversationId)
    .single();

  if (demoError || !demo) {
    logError(`Webhook Error: Could not find demo for conversation_id: ${conversationId}`);
    logError(demoError, 'Demo error details');
    // Return 200 to prevent Tavus from retrying, as this is a permanent error.
    return NextResponse.json({ message: 'Demo not found for conversation.' });
  }

  // 2. Find the video in that demo
  const { data: video, error: videoError } = await supabase
    .from('demo_videos')
    .select('storage_url')
    .eq('demo_id', demo.id)
    .eq('title', videoTitle)
    .single();

  if (videoError || !video) {
    logError(`Webhook Error: Could not find video with title '${videoTitle}' in demo ${demo.id}`);
    logError(videoError, 'Video error details');

    // Let's also check what videos are available
    const { data: availableVideos } = await supabase
      .from('demo_videos')
      .select('title')
      .eq('demo_id', demo.id);

    return NextResponse.json({ message: 'Video not found.' });
  }

  // 3. Generate a signed URL for the video
  const { data: signedUrlData, error: signedUrlError } = await supabase.storage
    .from('demo-videos')
    .createSignedUrl(video.storage_url, 3600); // 1 hour expiry

  if (signedUrlError || !signedUrlData) {
    logError(signedUrlError, 'Error creating signed URL');
    return NextResponse.json({ message: 'Could not generate video URL.' });
  }

  // 4. Broadcast the signed video URL to the frontend via Supabase Realtime
  await broadcastToDemo(supabase, demo.id, 'play_video', { url: signedUrlData.signedUrl });

  // 5. Track video showcase data for Domo Score
  await trackVideoShowcase(supabase, conversationId, demo.id, videoTitle);

  return NextResponse.json({ received: true });
}

async function trackVideoShowcase(
  supabase: any,
  conversationId: string,
  demoId: string,
  videoTitle: string
): Promise<void> {
  try {
    // Read existing record (if any)
    const { data: existingShowcase } = await supabase
      .from('video_showcase_data')
      .select('id, videos_shown, objective_name')
      .eq('conversation_id', conversationId)
      .single();

    const prevShown = Array.isArray(existingShowcase?.videos_shown)
      ? existingShowcase!.videos_shown as string[]
      : [];
    const updatedVideosShown = Array.from(new Set([...
      prevShown,
      videoTitle,
    ]));

    const payload = {
      conversation_id: conversationId,
      objective_name: existingShowcase?.objective_name || 'video_showcase',
      videos_shown: updatedVideosShown,
      received_at: new Date().toISOString(),
    } as any;

    // Perform update if exists, else insert (avoid relying on unique constraint for upsert)
    if (existingShowcase?.id) {
      const { error: updateErr } = await supabase
        .from('video_showcase_data')
        .update({
          videos_shown: updatedVideosShown,
          received_at: new Date().toISOString(),
        })
        .eq('id', existingShowcase.id);

      if (updateErr) {
        console.warn('Failed to update video_showcase_data:', updateErr);
      } else {
      }
    } else {
      const { error: insertErr } = await supabase
        .from('video_showcase_data')
        .insert(payload);

      if (insertErr) {
        console.warn('Failed to insert video_showcase_data:', insertErr);
      } else {
      }
    }
  } catch (trackErr) {
    console.warn('Error tracking video showcase data:', trackErr);
  }
}

export async function handleShowTrialCTA(
  supabase: any,
  conversationId: string
): Promise<NextResponse> {

  // 1. Find the demo associated with this conversation
  const { data: demo, error: demoError } = await supabase
    .from('demos')
    .select('id, cta_title, cta_message, cta_button_text, cta_button_url')
    .eq('tavus_conversation_id', conversationId)
    .single();

  if (demoError || !demo) {
    logError(`Webhook Error: Could not find demo for conversation_id: ${conversationId}`);
    return NextResponse.json({ message: 'Demo not found for conversation.' });
  }

  // 2. Track CTA shown event (select-then-update-or-insert)
  await trackCTAShown(supabase, conversationId, demo);

  // 3. Broadcast the CTA event to the frontend
  await broadcastToDemo(supabase, demo.id, 'show_trial_cta', {
    cta_title: (demo as any).cta_title ?? null,
    cta_message: (demo as any).cta_message ?? null,
    cta_button_text: (demo as any).cta_button_text ?? null,
    cta_button_url: (demo as any).cta_button_url ?? null,
  });

  return NextResponse.json({ received: true });
}

async function trackCTAShown(
  supabase: any,
  conversationId: string,
  demo: any
): Promise<void> {
  try {
    const { data: existingCta } = await supabase
      .from('cta_tracking')
      .select('id, cta_url')
      .eq('conversation_id', conversationId)
      .single();

    const now = new Date().toISOString();
    if (existingCta?.id) {
      const { error: updateErr } = await supabase
        .from('cta_tracking')
        .update({
          cta_shown_at: now,
          cta_url: (demo as any).cta_button_url ?? existingCta.cta_url ?? null,
          updated_at: now,
        })
        .eq('id', existingCta.id);

      if (updateErr) {
        console.warn('Failed to update CTA shown event:', updateErr);
      } else {
      }
    } else {
      const { error: insertErr } = await supabase
        .from('cta_tracking')
        .insert({
          conversation_id: conversationId,
          demo_id: demo.id,
          cta_shown_at: now,
          cta_url: (demo as any).cta_button_url ?? null,
          updated_at: now,
        });

      if (insertErr) {
        console.warn('Failed to insert CTA shown event:', insertErr);
      } else {
      }
    }
  } catch (trackingError) {
    console.warn('Error tracking CTA shown event:', trackingError);
  }
}
