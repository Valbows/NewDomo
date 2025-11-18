import { useState, useEffect, useCallback } from "react";
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
  fetchConversationDetails: () => Promise<void>;
  fetchContactInfo: () => Promise<void>;
  fetchProductInterestData: () => Promise<void>;
  fetchVideoShowcaseData: () => Promise<void>;
  fetchCtaTrackingData: () => Promise<void>;
  refreshAllData: () => Promise<void>;
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

  // Fetch detailed conversation data from our new table
  const fetchConversationDetails = useCallback(async () => {
    if (!demoId) return;

    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase
        .from("conversation_details")
        .select("*")
        .eq("demo_id", demoId)
        .order("completed_at", { ascending: false, nullsFirst: false })
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Sort conversations to ensure latest are on top
      const sortedData = (data || []).sort((a, b) => {
        // First try to sort by completed_at (most recent first)
        const aCompleted = a.completed_at ? new Date(a.completed_at).getTime() : 0;
        const bCompleted = b.completed_at ? new Date(b.completed_at).getTime() : 0;

        if (aCompleted !== bCompleted) {
          return bCompleted - aCompleted; // Descending order (latest first)
        }

        // Fallback to created_at if completed_at is the same or null
        const aCreated = new Date(a.created_at).getTime();
        const bCreated = new Date(b.created_at).getTime();
        return bCreated - aCreated; // Descending order (latest first)
      });

      setConversationDetails(sortedData);
    } catch (err) {
      console.error("Failed to fetch conversation details:", err);
      setError("Failed to load conversation details");
    } finally {
      setLoading(false);
    }
  }, [demoId]);

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

  // Auto-refresh data every 30 seconds to catch real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      fetchContactInfo();
      fetchProductInterestData();
      fetchVideoShowcaseData();
      fetchCtaTrackingData();
    }, 30000);

    return () => clearInterval(interval);
  }, [
    fetchContactInfo,
    fetchProductInterestData,
    fetchVideoShowcaseData,
    fetchCtaTrackingData,
  ]);

  return {
    conversationDetails,
    contactInfo,
    productInterestData,
    videoShowcaseData,
    ctaTrackingData,
    loading,
    error,
    fetchConversationDetails,
    fetchContactInfo,
    fetchProductInterestData,
    fetchVideoShowcaseData,
    fetchCtaTrackingData,
    refreshAllData,
  };
}
