'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { Demo } from '@/app/demos/[demoId]/configure/types';

export interface UseDemosRealtimeOptions {
  subscribeToAnalyticsUpdated?: boolean;
}

export interface UseDemosRealtimeResult {
  demos: Demo[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export function useDemosRealtime(
  options: UseDemosRealtimeOptions = {}
): UseDemosRealtimeResult {
  const { subscribeToAnalyticsUpdated = true } = options;
  const isE2E = process.env.NEXT_PUBLIC_E2E_TEST_MODE === 'true';

  const [demos, setDemos] = useState<Demo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const channelsRef = useRef<ReturnType<typeof supabase.channel>[]>([]);

  const cleanupChannels = useCallback(() => {
    channelsRef.current.forEach((ch) => {
      try {
        supabase.removeChannel(ch);
      } catch {}
    });
    channelsRef.current = [];
  }, []);

  const refresh = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('demos')
        .select('*')
        .order('updated_at', { ascending: false });
      if (error) throw error;
      setDemos((data as unknown as Demo[]) || []);
    } catch (err: any) {
      console.warn('useDemosRealtime: failed to load demos:', err?.message || err);
      setError('Failed to load demos.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setLoading(true);

    if (isE2E) {
      // Seed with deterministic demo stubs for tests
      const now = new Date();
      const stubDemos: Demo[] = [
        {
          id: 'e2e-1',
          name: 'E2E Demo A',
          user_id: 'e2e',
          created_at: new Date(now.getTime() - 3600_000).toISOString(),
          tavus_persona_id: 'persona-1',
          tavus_conversation_id: null,
          cta_title: null,
          cta_message: null,
          cta_button_text: null,
          cta_button_url: null,
          metadata: { analytics: { conversations: {} } },
        },
        {
          id: 'e2e-2',
          name: 'E2E Demo B',
          user_id: 'e2e',
          created_at: new Date(now.getTime() - 7200_000).toISOString(),
          tavus_persona_id: null,
          tavus_conversation_id: null,
          cta_title: null,
          cta_message: null,
          cta_button_text: null,
          cta_button_url: null,
          metadata: { analytics: { conversations: {} } },
        },
      ];

      setDemos(stubDemos);
      setError(null);
      setLoading(false);

      // Expose helpers for Playwright to drive state
      try {
        const w = window as any;
        w.__E2E__ = w.__E2E__ || {};
        w.__E2E__.setDemos = (list: Demo[]) => setDemos(list);
        w.__E2E__.analyticsUpdated = (demoId: string) => {
          setDemos((prev) =>
            prev.map((d) => {
              if (d.id !== demoId) return d;
              const analytics = (d.metadata as any)?.analytics || {};
              const conversations = { ...(analytics.conversations || {}) };
              const newKey = `conv_${Object.keys(conversations).length + 1}`;
              conversations[newKey] = { created_at: new Date().toISOString() };
              return {
                ...d,
                metadata: {
                  ...(d.metadata || {}),
                  analytics: {
                    ...analytics,
                    last_updated: new Date().toISOString(),
                    conversations,
                  },
                },
              } as Demo;
            })
          );
        };

        // Ensure only one event listener is registered at any time to avoid double handling
        // in Next.js dev mode or under React re-mounts. Remove a previous handler if present.
        const handler = (ev: Event) => {
          try {
            const detail = (ev as CustomEvent)?.detail || {};
            if (detail?.demoId) w.__E2E__.analyticsUpdated(detail.demoId);
          } catch {}
        };

        if (w.__E2E__._analyticsHandler) {
          try {
            window.removeEventListener('e2e:analytics_updated', w.__E2E__._analyticsHandler);
          } catch {}
        }
        w.__E2E__._analyticsHandler = handler as EventListener;
        window.addEventListener('e2e:analytics_updated', w.__E2E__._analyticsHandler);

        return () => {
          try {
            if (w.__E2E__?._analyticsHandler) {
              window.removeEventListener('e2e:analytics_updated', w.__E2E__._analyticsHandler);
              w.__E2E__._analyticsHandler = undefined;
            }
          } catch {}
          cleanupChannels();
        };
      } catch {
        return () => {
          cleanupChannels();
        };
      }
    }

    // Normal (non-E2E) path
    refresh();
    return () => {
      cleanupChannels();
    };
  }, [refresh, cleanupChannels, isE2E]);

  useEffect(() => {
    if (isE2E) return; // no realtime in E2E; driven via helpers/events
    if (!subscribeToAnalyticsUpdated) return;

    // Re-subscribe when demo IDs change
    cleanupChannels();

    if (!demos.length) return;

    channelsRef.current = demos.map((d) =>
      supabase
        .channel(`demo-${d.id}`)
        .on('broadcast', { event: 'analytics_updated' }, () => {
          // Coalesce bursts by just refetching; Supabase client deduplication handles parallel
          refresh();
        })
        .on(
          'postgres_changes',
          { event: 'UPDATE', schema: 'public', table: 'demos', filter: `id=eq.${d.id}` },
          () => {
            // Fallback: when demo row updates (e.g., metadata.analytics), refresh UI
            refresh();
          }
        )
        .subscribe()
    );

    return () => {
      cleanupChannels();
    };
  }, [demos, subscribeToAnalyticsUpdated, refresh, cleanupChannels, isE2E]);

  return { demos, loading, error, refresh };
}
