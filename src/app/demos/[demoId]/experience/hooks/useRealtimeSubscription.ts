import { useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { UIState } from '@/lib/tavus/UI_STATES';

// CTA override payload shape from Realtime broadcasts
export type CtaOverrides = {
  cta_title?: string | null;
  cta_message?: string | null;
  cta_button_text?: string | null;
  cta_button_url?: string | null;
};

interface UseRealtimeSubscriptionParams {
  demoId: string;
  onPlayVideo: (url: string) => void;
  onShowCTA: (overrides: CtaOverrides) => void;
  onAnalyticsUpdated?: (payload: any) => void;
  onConversationEnded?: (payload: { conversation_id: string; ended_at: string }) => void;
}

export function useRealtimeSubscription({
  demoId,
  onPlayVideo,
  onShowCTA,
  onAnalyticsUpdated,
  onConversationEnded,
}: UseRealtimeSubscriptionParams): void {
  // Use ref to hold the latest callbacks to avoid stale closures
  const callbacksRef = useRef({ onPlayVideo, onShowCTA, onAnalyticsUpdated, onConversationEnded });

  useEffect(() => {
    callbacksRef.current = { onPlayVideo, onShowCTA, onAnalyticsUpdated, onConversationEnded };
  }, [onPlayVideo, onShowCTA, onAnalyticsUpdated, onConversationEnded]);

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
