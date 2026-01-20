import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/lib/supabase";
import {
  ConversationDetail,
  ContactInfo,
  ProductInterestData,
  VideoShowcaseData,
  CtaTrackingData,
} from "../types";

interface UseConversationDataProps {
  demoId: string | undefined;
}

interface UseConversationDataReturn {
  conversationDetails: ConversationDetail[];
  contactInfo: Record<string, ContactInfo>;
  productInterestData: Record<string, ProductInterestData>;
  videoShowcaseData: Record<string, VideoShowcaseData>;
  ctaTrackingData: Record<string, CtaTrackingData>;
  loading: boolean;
  error: string | null;
  hasPendingAnalysis: boolean; // True if any ended conversation is missing perception_analysis
  fetchConversationDetails: () => Promise<void>;
  fetchContactInfo: () => Promise<void>;
  fetchProductInterestData: () => Promise<void>;
  fetchVideoShowcaseData: () => Promise<void>;
  fetchCtaTrackingData: () => Promise<void>;
  refreshAllData: () => Promise<void>;
  pauseRealtime: () => void; // Pause realtime updates during sync
  resumeRealtime: () => void; // Resume realtime updates after sync
}

export function useConversationData({
  demoId,
}: UseConversationDataProps): UseConversationDataReturn {
  const [conversationDetails, setConversationDetails] = useState<ConversationDetail[]>([]);
  const [contactInfo, setContactInfo] = useState<Record<string, ContactInfo>>({});
  const [productInterestData, setProductInterestData] = useState<
    Record<string, ProductInterestData>
  >({});
  const [videoShowcaseData, setVideoShowcaseData] = useState<
    Record<string, VideoShowcaseData>
  >({});
  const [ctaTrackingData, setCtaTrackingData] = useState<Record<string, CtaTrackingData>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Core fetch logic - shared between initial load and silent updates
  const doFetchConversationDetails = useCallback(async () => {
    if (!demoId) return;

    const { data, error } = await supabase
      .from("conversation_details")
      .select("*")
      .eq("demo_id", demoId)
      .order("completed_at", { ascending: false, nullsFirst: false })
      .order("created_at", { ascending: false });

    if (error) throw error;

    // Sort conversations by date (most recent first)
    const sortedData = (data || []).sort((a, b) => {
      const aDate = a.completed_at || a.created_at;
      const bDate = b.completed_at || b.created_at;
      const aTime = aDate ? new Date(aDate).getTime() : 0;
      const bTime = bDate ? new Date(bDate).getTime() : 0;
      return bTime - aTime;
    });

    setConversationDetails(sortedData);
  }, [demoId]);

  // Fetch with loading state - for initial load and manual refresh
  const fetchConversationDetails = useCallback(async () => {
    if (!demoId) return;

    setLoading(true);
    setError(null);

    try {
      await doFetchConversationDetails();
    } catch (err) {
      console.error("Failed to fetch conversation details:", err);
      setError("Failed to load conversation details");
    } finally {
      setLoading(false);
    }
  }, [demoId, doFetchConversationDetails]);

  // Silent fetch - for realtime updates (no loading spinner)
  const silentFetchConversationDetails = useCallback(async () => {
    try {
      await doFetchConversationDetails();
    } catch (err) {
      // Silent fail - don't show error for background updates
      console.error("Silent fetch failed:", err);
    }
  }, [doFetchConversationDetails]);

  // Fetch contact information for conversations
  const fetchContactInfo = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("qualification_data")
        .select("*")
        .order("received_at", { ascending: false });

      if (error) throw error;

      // Create a map of conversation_id to contact info
      const contactMap: Record<string, ContactInfo> = {};
      data?.forEach((contact) => {
        contactMap[contact.conversation_id] = contact;
      });

      setContactInfo(contactMap);
    } catch (err) {
      console.error("Failed to fetch contact information:", err);
    }
  }, []);

  // Fetch product interest data for conversations
  const fetchProductInterestData = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("product_interest_data")
        .select("*")
        .order("received_at", { ascending: false });

      if (error) throw error;

      // Create a map of conversation_id to product interest data
      const interestMap: Record<string, ProductInterestData> = {};
      data?.forEach((interest) => {
        interestMap[interest.conversation_id] = interest;
      });

      setProductInterestData(interestMap);
    } catch (err) {
      console.error("Failed to fetch product interest data:", err);
    }
  }, []);

  // Fetch video showcase data for conversations
  const fetchVideoShowcaseData = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("video_showcase_data")
        .select("*")
        .order("received_at", { ascending: false });

      if (error) throw error;

      // Create a map of conversation_id to video showcase data
      const showcaseMap: Record<string, VideoShowcaseData> = {};
      data?.forEach((showcase) => {
        showcaseMap[showcase.conversation_id] = showcase;
      });

      setVideoShowcaseData(showcaseMap);
    } catch (err) {
      console.error("Failed to fetch video showcase data:", err);
    }
  }, []);

  // Fetch CTA tracking data for conversations
  const fetchCtaTrackingData = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("cta_tracking")
        .select("*")
        .order("cta_shown_at", { ascending: false });

      if (error) throw error;

      // Create a map of conversation_id to CTA tracking data
      const ctaMap: Record<string, CtaTrackingData> = {};
      data?.forEach((cta) => {
        ctaMap[cta.conversation_id] = cta;
      });

      setCtaTrackingData(ctaMap);
    } catch (err) {
      console.error("Failed to fetch CTA tracking data:", err);
    }
  }, []);

  // Refresh all data
  const refreshAllData = useCallback(async () => {
    await Promise.all([
      fetchConversationDetails(),
      fetchContactInfo(),
      fetchProductInterestData(),
      fetchVideoShowcaseData(),
      fetchCtaTrackingData(),
    ]);
  }, [
    fetchConversationDetails,
    fetchContactInfo,
    fetchProductInterestData,
    fetchVideoShowcaseData,
    fetchCtaTrackingData,
  ]);

  // Load conversation details and contact info on component mount
  useEffect(() => {
    refreshAllData();
  }, [refreshAllData]);

  // Refs to control realtime behavior during sync
  const realtimePausedRef = useRef(false);
  const pendingUpdatesRef = useRef(0);

  // Pause realtime updates - call before starting sync
  const pauseRealtime = useCallback(() => {
    realtimePausedRef.current = true;
    pendingUpdatesRef.current = 0;
  }, []);

  // Resume realtime updates - call after sync completes, triggers ONE silent refresh
  const resumeRealtime = useCallback(() => {
    realtimePausedRef.current = false;
    // If there were any updates while paused, do one silent refresh
    if (pendingUpdatesRef.current > 0) {
      pendingUpdatesRef.current = 0;
      silentFetchConversationDetails();
    }
  }, [silentFetchConversationDetails]);

  // Subscribe to realtime updates for conversation_details
  // Uses SILENT fetch to avoid UI flickering on background updates
  // Ignores updates when paused (during manual sync)
  useEffect(() => {
    if (!demoId) return;

    const channel = supabase
      .channel(`conversation_details_${demoId}`)
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to INSERT, UPDATE, DELETE
          schema: 'public',
          table: 'conversation_details',
          filter: `demo_id=eq.${demoId}`,
        },
        () => {
          // If paused (during sync), just count updates - don't refresh
          if (realtimePausedRef.current) {
            pendingUpdatesRef.current++;
            return;
          }
          // Normal operation: silent refresh (no loading spinner)
          silentFetchConversationDetails();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [demoId, silentFetchConversationDetails]);

  // Compute if there are any ended conversations missing perception analysis
  // This is used by the parent component to trigger Tavus API sync
  const hasPendingAnalysis = conversationDetails.some((c) => {
    // Only check ended/completed conversations that don't have perception_analysis
    return (c.status === 'ended' || c.status === 'completed') && !c.perception_analysis;
  });

  return {
    conversationDetails,
    contactInfo,
    productInterestData,
    videoShowcaseData,
    ctaTrackingData,
    loading,
    error,
    hasPendingAnalysis,
    fetchConversationDetails,
    fetchContactInfo,
    fetchProductInterestData,
    fetchVideoShowcaseData,
    fetchCtaTrackingData,
    refreshAllData,
    pauseRealtime,
    resumeRealtime,
  };
}
