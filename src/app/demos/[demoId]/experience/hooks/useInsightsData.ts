/**
 * useInsightsData Hook
 *
 * Custom React hook that manages the data for the Domo Insights panel.
 * Handles both initial data fetching from Supabase and real-time updates
 * via Supabase Realtime broadcasts.
 *
 * Data Sources (Supabase Tables):
 * - qualification_data: First name, last name, email, position
 * - video_showcase_data: Array of video titles shown
 * - product_interest_data: Primary interest and pain points
 *
 * Real-time Events (from objectiveHandlers.ts):
 * - field_captured: Individual qualification field updates
 * - topics_captured: Primary interest and pain points updates
 *
 * Usage:
 * ```tsx
 * const { insightsData, loading, addVideoWatched } = useInsightsData({
 *   conversationId: 'conv-123',
 *   demoId: 'demo-456',
 * });
 * ```
 *
 * @see DomoInsightsPanel for the component that consumes this data
 * @see objectiveHandlers.ts for the webhook handlers that broadcast updates
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import type { InsightsData } from '@/components/insights/DomoInsightsPanel';
import type { QualificationFields } from '@/components/insights/QualificationChecklist';
import type { RealtimeChannel } from '@supabase/supabase-js';

/**
 * Default empty state for qualification fields.
 * All fields start as uncaptured with null values.
 */
const defaultQualificationFields: QualificationFields = {
  firstName: { captured: false, value: null },
  lastName: { captured: false, value: null },
  email: { captured: false, value: null },
  position: { captured: false, value: null },
};

/**
 * Default empty state for all insights data.
 * Used as initial state and when no conversation data exists.
 */
const defaultInsightsData: InsightsData = {
  qualificationFields: defaultQualificationFields,
  videosWatched: [],
  topicsDiscussed: {
    primaryInterest: null,
    painPoints: [],
  },
};

interface UseInsightsDataParams {
  /** The Tavus conversation ID - used to fetch data from Supabase tables */
  conversationId: string | null;
  /** The demo ID - used for Supabase Realtime channel subscription */
  demoId: string;
}

interface UseInsightsDataResult {
  /** Current insights data to display in the panel */
  insightsData: InsightsData;
  /** Whether initial data is being fetched */
  loading: boolean;
  /** Error message if data fetching failed */
  error: string | null;
  /** Manually update a single qualification field (called from DemoExperienceView) */
  updateField: (field: keyof QualificationFields, value: string) => void;
  /** Add a video to the watched list (called when fetch_video tool is used) */
  addVideoWatched: (videoTitle: string) => void;
  /** Set the topics discussed (primary interest and pain points) */
  setTopics: (primaryInterest: string | null, painPoints: string[]) => void;
  /** Refetch all data from Supabase (useful for manual refresh) */
  refetch: () => Promise<void>;
}

/**
 * Main hook function that manages insights data state and subscriptions.
 */
export function useInsightsData({ conversationId, demoId }: UseInsightsDataParams): UseInsightsDataResult {
  const [insightsData, setInsightsData] = useState<InsightsData>(defaultInsightsData);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Fetch initial data from Supabase tables.
   * Called on mount and when conversationId changes.
   * Fetches from three tables in parallel for performance.
   */
  const fetchData = useCallback(async () => {
    if (!conversationId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Fetch from all three tables in parallel for better performance
      const [qualificationResult, videoShowcaseResult, productInterestResult] = await Promise.all([
        // Qualification data: name, email, position
        supabase
          .from('qualification_data')
          .select('first_name, last_name, email, position')
          .eq('conversation_id', conversationId)
          .maybeSingle(),
        // Video showcase data: array of videos shown
        supabase
          .from('video_showcase_data')
          .select('videos_shown')
          .eq('conversation_id', conversationId)
          .maybeSingle(),
        // Product interest data: primary interest and pain points
        supabase
          .from('product_interest_data')
          .select('primary_interest, pain_points')
          .eq('conversation_id', conversationId)
          .maybeSingle(),
      ]);

      // Transform qualification data into QualificationFields structure
      const qualData = qualificationResult.data;
      const qualificationFields: QualificationFields = {
        firstName: {
          captured: !!qualData?.first_name,
          value: qualData?.first_name || null,
        },
        lastName: {
          captured: !!qualData?.last_name,
          value: qualData?.last_name || null,
        },
        email: {
          captured: !!qualData?.email,
          value: qualData?.email || null,
        },
        position: {
          captured: !!qualData?.position,
          value: qualData?.position || null,
        },
      };

      // Extract videos watched array (handle null/undefined)
      const videosWatched: string[] = Array.isArray(videoShowcaseResult.data?.videos_shown)
        ? videoShowcaseResult.data.videos_shown
        : [];

      // Extract topics discussed
      const productData = productInterestResult.data;
      const topicsDiscussed = {
        primaryInterest: productData?.primary_interest || null,
        painPoints: Array.isArray(productData?.pain_points) ? productData.pain_points : [],
      };

      setInsightsData({
        qualificationFields,
        videosWatched,
        topicsDiscussed,
      });
    } catch (err) {
      console.error('Error fetching insights data:', err);
      setError('Failed to load insights data');
    } finally {
      setLoading(false);
    }
  }, [conversationId]);

  // Fetch data on mount and when conversationId changes
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  /**
   * Subscribe to Supabase Realtime for live updates.
   * Listens for field_captured and topics_captured events broadcast
   * from the Tavus webhook handlers (objectiveHandlers.ts).
   *
   * Channel name format: `demo-{demoId}`
   */
  useEffect(() => {
    if (!demoId) return;

    const channelName = `demo-${demoId}`;
    const channel = supabase.channel(channelName);

    channel
      // Handle individual field captures (from contact_information_collection objective)
      .on('broadcast', { event: 'field_captured' }, (payload: any) => {
        try {
          const p = payload?.payload || {};
          if (p.field && p.value) {
            setInsightsData((prev) => ({
              ...prev,
              qualificationFields: {
                ...prev.qualificationFields,
                [p.field]: { captured: true, value: p.value },
              },
            }));
          }
        } catch (e) {
          console.warn('Realtime field_captured handler error', e);
        }
      })
      // Handle topics/interests captured (from product_interest_discovery objective)
      .on('broadcast', { event: 'topics_captured' }, (payload: any) => {
        try {
          const p = payload?.payload || {};
          setInsightsData((prev) => ({
            ...prev,
            topicsDiscussed: {
              primaryInterest: p.primary_interest || null,
              painPoints: Array.isArray(p.pain_points) ? p.pain_points : [],
            },
          }));
        } catch (e) {
          console.warn('Realtime topics_captured handler error', e);
        }
      })
      .subscribe();

    // Cleanup: remove channel subscription on unmount
    return () => {
      try {
        supabase.removeChannel(channel);
      } catch {}
    };
  }, [demoId]);

  /**
   * Manually update a single qualification field.
   * Called by parent components when they detect a field has been captured
   * (e.g., through local tool call handling before webhook broadcast).
   */
  const updateField = useCallback((field: keyof QualificationFields, value: string) => {
    setInsightsData((prev) => ({
      ...prev,
      qualificationFields: {
        ...prev.qualificationFields,
        [field]: { captured: true, value },
      },
    }));
  }, []);

  /**
   * Add a video to the watched list.
   * Called by DemoExperienceView when fetch_video tool is invoked.
   * Prevents duplicate entries.
   */
  const addVideoWatched = useCallback((videoTitle: string) => {
    setInsightsData((prev) => {
      // Don't add duplicates
      if (prev.videosWatched.includes(videoTitle)) {
        return prev;
      }
      return {
        ...prev,
        videosWatched: [...prev.videosWatched, videoTitle],
      };
    });
  }, []);

  /**
   * Set topics discussed (primary interest and pain points).
   * Can be called for manual updates outside of realtime events.
   */
  const setTopics = useCallback((primaryInterest: string | null, painPoints: string[]) => {
    setInsightsData((prev) => ({
      ...prev,
      topicsDiscussed: {
        primaryInterest,
        painPoints,
      },
    }));
  }, []);

  return {
    insightsData,
    loading,
    error,
    updateField,
    addVideoWatched,
    setTopics,
    refetch: fetchData,
  };
}
