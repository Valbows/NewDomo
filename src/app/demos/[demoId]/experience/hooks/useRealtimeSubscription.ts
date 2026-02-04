/**
 * useRealtimeSubscription Hook
 *
 * Subscribes to Supabase Realtime broadcasts for a specific demo session.
 * Handles various events triggered by the Tavus webhook handlers and dashboard actions.
 *
 * Channel: demo-{demoId}
 *
 * Events Handled:
 * - play_video: Triggered when a video should be played
 * - show_trial_cta: Triggered when CTA banner should be shown
 * - analytics_updated: Triggered when analytics data changes
 * - conversation_ended: Triggered when conversation ends
 * - field_captured: Triggered when a qualification field is captured (for insights panel)
 * - topics_captured: Triggered when interests/pain points are captured (for insights panel)
 *
 * Event Sources:
 * - play_video, show_trial_cta: Dashboard or tool calls
 * - conversation_ended: End conversation API
 * - field_captured, topics_captured: objectiveHandlers.ts (Tavus webhook)
 *
 * @see objectiveHandlers.ts for field_captured and topics_captured event sources
 * @see useInsightsData for how insights events are consumed (duplicate subscription)
 */

import { useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import type { QualificationFields } from '@/components/insights/QualificationChecklist';

/**
 * Payload for CTA override broadcasts.
 * Allows dashboard to customize the CTA banner shown during demos.
 */
export type CtaOverrides = {
  cta_title?: string | null;
  cta_message?: string | null;
  cta_button_text?: string | null;
  cta_button_url?: string | null;
};

/**
 * Payload for field_captured broadcasts.
 * Sent when a qualification field is captured during conversation.
 * Field names use camelCase to match frontend state structure.
 */
export type FieldCapturedPayload = {
  /** Field key matching QualificationFields (firstName, lastName, email, position) */
  field: keyof QualificationFields;
  /** The captured value */
  value: string;
};

/**
 * Payload for topics_captured broadcasts.
 * Sent when product interest discovery objective completes.
 */
export type TopicsCapturedPayload = {
  /** Main area of interest identified */
  primary_interest: string | null;
  /** List of pain points/challenges mentioned */
  pain_points: string[];
};

interface UseRealtimeSubscriptionParams {
  /** The demo ID - used to construct the channel name (demo-{demoId}) */
  demoId: string;
  /** Callback when play_video event is received */
  onPlayVideo: (url: string) => void;
  /** Callback when show_trial_cta event is received */
  onShowCTA: (overrides: CtaOverrides) => void;
  /** Optional callback when analytics_updated event is received */
  onAnalyticsUpdated?: (payload: any) => void;
  /** Optional callback when conversation_ended event is received */
  onConversationEnded?: (payload: { conversation_id: string; ended_at: string }) => void;
  /** Optional callback when field_captured event is received (for insights panel) */
  onFieldCaptured?: (payload: FieldCapturedPayload) => void;
  /** Optional callback when topics_captured event is received (for insights panel) */
  onTopicsCaptured?: (payload: TopicsCapturedPayload) => void;
}

/**
 * Main hook that sets up and manages the Supabase Realtime subscription.
 * Uses a ref to hold callbacks to prevent stale closure issues.
 */
export function useRealtimeSubscription({
  demoId,
  onPlayVideo,
  onShowCTA,
  onAnalyticsUpdated,
  onConversationEnded,
  onFieldCaptured,
  onTopicsCaptured,
}: UseRealtimeSubscriptionParams): void {
  // Use ref to hold the latest callbacks to avoid stale closures
  const callbacksRef = useRef({ onPlayVideo, onShowCTA, onAnalyticsUpdated, onConversationEnded, onFieldCaptured, onTopicsCaptured });

  useEffect(() => {
    callbacksRef.current = { onPlayVideo, onShowCTA, onAnalyticsUpdated, onConversationEnded, onFieldCaptured, onTopicsCaptured };
  }, [onPlayVideo, onShowCTA, onAnalyticsUpdated, onConversationEnded, onFieldCaptured, onTopicsCaptured]);

  useEffect(() => {
    if (!demoId) return;

    const channelName = `demo-${demoId}`;
    const channel = supabase.channel(channelName);

    channel
      .on('broadcast', { event: 'play_video' }, (payload: any) => {
        try {
          const url = payload?.payload?.url as string | undefined;
          if (url && typeof url === 'string') {
            callbacksRef.current.onPlayVideo(url);
          }
        } catch (e) {
          console.warn('Realtime play_video handler error', e);
        }
      })
      .on('broadcast', { event: 'show_trial_cta' }, (payload: any) => {
        try {
          const p = payload?.payload || {};
          callbacksRef.current.onShowCTA({
            cta_title: p?.cta_title ?? undefined,
            cta_message: p?.cta_message ?? undefined,
            cta_button_text: p?.cta_button_text ?? undefined,
            cta_button_url: p?.cta_button_url ?? undefined,
          });
        } catch (e) {
          console.warn('Realtime show_trial_cta handler error', e);
          callbacksRef.current.onShowCTA({});
        }
      })
      .on('broadcast', { event: 'analytics_updated' }, (payload: any) => {
        callbacksRef.current.onAnalyticsUpdated?.(payload?.payload);
      })
      .on('broadcast', { event: 'conversation_ended' }, (payload: any) => {
        try {
          const p = payload?.payload || {};
          callbacksRef.current.onConversationEnded?.({
            conversation_id: p.conversation_id || '',
            ended_at: p.ended_at || new Date().toISOString(),
          });
        } catch (e) {
          console.warn('Realtime conversation_ended handler error', e);
        }
      })
      .on('broadcast', { event: 'field_captured' }, (payload: any) => {
        try {
          const p = payload?.payload || {};
          if (p.field && p.value) {
            callbacksRef.current.onFieldCaptured?.({
              field: p.field,
              value: p.value,
            });
          }
        } catch (e) {
          console.warn('Realtime field_captured handler error', e);
        }
      })
      .on('broadcast', { event: 'topics_captured' }, (payload: any) => {
        try {
          const p = payload?.payload || {};
          callbacksRef.current.onTopicsCaptured?.({
            primary_interest: p.primary_interest || null,
            pain_points: Array.isArray(p.pain_points) ? p.pain_points : [],
          });
        } catch (e) {
          console.warn('Realtime topics_captured handler error', e);
        }
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
        }
      });

    return () => {
      try {
        supabase.removeChannel(channel);
      } catch {}
    };
  }, [demoId]);
}
