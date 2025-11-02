import { Demo } from "@/app/demos/[demoId]/configure/types";
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { Loader2, RefreshCw } from "lucide-react";

// Import split components - TEMPORARILY DISABLED DUE TO SYNTAX ERRORS
// import {
//   ContactInfoCard,
//   ProductInterestCard,
//   VideoShowcaseCard,
//   CtaTrackingCard,
//   DomoScoreCard,
// } from "./reporting/index";
// Note: ReportingFilters and ReportingTables need interface updates
// Utility functions
function isValidPerceptionAnalysis(perceptionAnalysis: any): boolean {
  if (!perceptionAnalysis) return false;
  if (typeof perceptionAnalysis === "string") {
    const analysis = perceptionAnalysis.trim().toLowerCase();
    if (analysis.length === 0) return false;
    const blackScreenIndicators = [
      "completely black",
      "black screen",
      "no visual",
    ];
    return !blackScreenIndicators.some((indicator) =>
      analysis.includes(indicator)
    );
  }
  return !!(
    perceptionAnalysis.overall_score || perceptionAnalysis.engagement_score
  );
}

function renderTranscript(transcript: any) {
  if (!transcript)
    return <div className="text-sm text-gray-500">No transcript available</div>;
  if (Array.isArray(transcript)) {
    return (
      <div className="space-y-2 max-h-64 overflow-y-auto">
        {transcript.map((entry: any, index: number) => (
          <div key={index} className="flex gap-3 p-2 rounded bg-gray-50">
            <div className="text-xs font-medium text-gray-700">
              {entry.speaker || "Unknown"}:
            </div>
            <div className="text-sm text-gray-800">
              {entry.text || String(entry)}
            </div>
          </div>
        ))}
      </div>
    );
  }
  return (
    <div className="text-sm text-gray-800 bg-gray-50 rounded p-4">
      {String(transcript)}
    </div>
  );
}

function renderPerceptionAnalysis(perception: any) {
  if (!perception)
    return (
      <div className="text-sm text-gray-500">
        No perception analysis available
      </div>
    );
  return (
    <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-lg border">
      <div className="text-sm text-gray-700 whitespace-pre-wrap">
        {String(perception)}
      </div>
    </div>
  );
}

interface ReportingProps {
  demo: Demo | null;
}

interface ConversationDetail {
  id: string;
  tavus_conversation_id: string;
  conversation_name: string;
  transcript: any;
  perception_analysis: any;
  started_at: string;
  completed_at: string;
  duration_seconds: number;
  status: string;
  created_at: string;
  updated_at: string;
}

interface ContactInfo {
  id: string;
  conversation_id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  position: string | null;
  received_at: string;
}

interface ProductInterestData {
  id: string;
  conversation_id: string;
  primary_interest: string | null;
  pain_points: string[] | null;
  received_at: string;
}

interface VideoShowcaseData {
  id: string;
  conversation_id: string;
  requested_videos: string[] | null;
  videos_shown: string[] | null;
  objective_name: string;
  received_at: string;
}

interface CtaTrackingData {
  id: string;
  conversation_id: string;
  demo_id: string;
  cta_shown_at: string | null;
  cta_clicked_at: string | null;
  cta_url: string | null;
}

function formatDate(iso?: string) {
  try {
    return iso ? new Date(iso).toLocaleString() : "—";
  } catch {
    return "—";
  }
}

export const Reporting = ({ demo }: ReportingProps) => {
  const [conversations, setConversations] = useState<ConversationDetail[]>([]);
  const [contactInfo, setContactInfo] = useState<Record<string, ContactInfo>>(
    {}
  );
  const [productInterestData, setProductInterestData] = useState<
    Record<string, ProductInterestData>
  >({});
  const [videoShowcaseData, setVideoShowcaseData] = useState<
    Record<string, VideoShowcaseData>
  >({});
  const [ctaTrackingData, setCtaTrackingData] = useState<
    Record<string, CtaTrackingData>
  >({});
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [expandedConversations, setExpandedConversations] = useState<
    Set<string>
  >(new Set());

  const fetchConversationData = useCallback(async () => {
    if (!demo?.id) return;

    try {
      setLoading(true);

      // Fetch conversations
      const { data: conversationsData, error: conversationsError } =
        await supabase
          .from("conversation_details")
          .select("*")
          .eq("demo_id", demo.id)
          .order("started_at", { ascending: false });

      if (conversationsError) throw conversationsError;

      setConversations(conversationsData || []);

      // Fetch related data for each conversation
      const conversationIds =
        conversationsData?.map((c) => c.tavus_conversation_id) || [];

      if (conversationIds.length > 0) {
        // Fetch contact info
        const { data: contactData } = await supabase
          .from("contact_info")
          .select("*")
          .in("conversation_id", conversationIds);

        // Fetch product interest
        const { data: productData } = await supabase
          .from("product_interest")
          .select("*")
          .in("conversation_id", conversationIds);

        // Fetch video showcase
        const { data: videoData } = await supabase
          .from("video_showcase")
          .select("*")
          .in("conversation_id", conversationIds);

        // Fetch CTA tracking
        const { data: ctaData } = await supabase
          .from("cta_tracking")
          .select("*")
          .in("conversation_id", conversationIds);

        // Convert to lookup objects
        setContactInfo(
          contactData?.reduce(
            (acc, item) => ({ ...acc, [item.conversation_id]: item }),
            {}
          ) || {}
        );
        setProductInterestData(
          productData?.reduce(
            (acc, item) => ({ ...acc, [item.conversation_id]: item }),
            {}
          ) || {}
        );
        setVideoShowcaseData(
          videoData?.reduce(
            (acc, item) => ({ ...acc, [item.conversation_id]: item }),
            {}
          ) || {}
        );
        setCtaTrackingData(
          ctaData?.reduce(
            (acc, item) => ({ ...acc, [item.conversation_id]: item }),
            {}
          ) || {}
        );
      }
    } catch (error) {
      console.error("Error fetching conversation data:", error);
    } finally {
      setLoading(false);
    }
  }, [demo?.id]);

  const syncConversations = async () => {
    if (!demo?.id) return;

    try {
      setSyncing(true);
      const response = await fetch(`/api/demos/${demo.id}/sync`, {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error("Failed to sync conversations");
      }

      await fetchConversationData();
    } catch (error) {
      console.error("Error syncing conversations:", error);
    } finally {
      setSyncing(false);
    }
  };

  useEffect(() => {
    fetchConversationData();
  }, [fetchConversationData]);

  const toggleConversationExpansion = (conversationId: string) => {
    setExpandedConversations((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(conversationId)) {
        newSet.delete(conversationId);
      } else {
        newSet.add(conversationId);
      }
      return newSet;
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
        <span className="ml-2 text-gray-600">Loading conversation data...</span>
      </div>
    );
  }

  const completedConversations = conversations.filter(
    (c) => c.status === "completed"
  ).length;
  const totalDuration = conversations.reduce(
    (sum, c) => sum + (c.duration_seconds || 0),
    0
  );
  const averageDuration =
    conversations.length > 0 ? totalDuration / conversations.length : 0;

  return (
    <div className="space-y-6">
      {/* Header with Sync Button */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            Conversation Analytics
          </h3>
          <p className="text-sm text-gray-600">
            View detailed analytics and insights from your conversations
          </p>
        </div>
        <button
          onClick={syncConversations}
          disabled={syncing}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${syncing ? "animate-spin" : ""}`} />
          {syncing ? "Syncing..." : "Sync Data"}
        </button>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow border">
          <div className="text-2xl font-bold text-gray-900">
            {conversations.length}
          </div>
          <div className="text-sm text-gray-600">Total Conversations</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border">
          <div className="text-2xl font-bold text-green-600">
            {completedConversations}
          </div>
          <div className="text-sm text-gray-600">Completed</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border">
          <div className="text-2xl font-bold text-blue-600">
            {Math.round(averageDuration / 60)}m
          </div>
          <div className="text-sm text-gray-600">Avg Duration</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border">
          <div className="text-2xl font-bold text-purple-600">
            {conversations.length > 0 ? "Active" : "No Data"}
          </div>
          <div className="text-sm text-gray-600">Status</div>
        </div>
      </div>

      {/* Conversations List */}
      <div className="space-y-4">
        {conversations.map((conversation) => (
          <div
            key={conversation.id}
            className="bg-white rounded-lg shadow border p-4"
          >
            <div className="flex justify-between items-center">
              <div>
                <h4 className="font-medium text-gray-900">
                  {conversation.conversation_name ||
                    `Conversation ${conversation.id.slice(0, 8)}`}
                </h4>
                <p className="text-sm text-gray-600">
                  {formatDate(conversation.started_at)} •{" "}
                  {Math.round(conversation.duration_seconds / 60)}m
                </p>
              </div>
              <button
                onClick={() =>
                  toggleConversationExpansion(
                    conversation.tavus_conversation_id
                  )
                }
                className="text-blue-600 hover:text-blue-800"
              >
                {expandedConversations.has(conversation.tavus_conversation_id)
                  ? "Collapse"
                  : "Expand"}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Detailed Conversation Views */}
      {conversations.map(
        (conversation) =>
          expandedConversations.has(conversation.tavus_conversation_id) && (
            <div
              key={conversation.id}
              className="bg-white rounded-lg shadow border p-6"
            >
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column - Data Cards */}
                <div className="lg:col-span-2 space-y-6">
                  {/* TEMPORARILY DISABLED DUE TO SYNTAX ERRORS */}
                  {/* <ContactInfoCard
                    contact={
                      contactInfo[conversation.tavus_conversation_id] || null
                    }
                  />

                  <ProductInterestCard
                    productInterest={
                      productInterestData[conversation.tavus_conversation_id] ||
                      null
                    }
                  />

                  <VideoShowcaseCard
                    videoShowcase={
                      videoShowcaseData[conversation.tavus_conversation_id] ||
                      null
                    }
                  />

                  <CtaTrackingCard
                    ctaTracking={
                      ctaTrackingData[conversation.tavus_conversation_id] ||
                      null
                    }
                  /> */}

                  {/* Perception Analysis */}
                  {isValidPerceptionAnalysis(
                    conversation.perception_analysis
                  ) && (
                    <div className="mb-6">
                      <h5 className="font-medium text-gray-700 mb-3 flex items-center gap-2">
                        🧠 Perception Analysis
                      </h5>
                      {renderPerceptionAnalysis(
                        conversation.perception_analysis
                      )}
                    </div>
                  )}

                  {/* Transcript */}
                  {conversation.transcript && (
                    <div className="mb-6">
                      <h5 className="font-medium text-gray-700 mb-3 flex items-center gap-2">
                        💬 Conversation Transcript
                      </h5>
                      {renderTranscript(conversation.transcript)}
                    </div>
                  )}
                </div>

                {/* Right Column - Domo Score - TEMPORARILY DISABLED */}
                <div className="lg:col-span-1">
                  <div className="sticky top-4">
                    {/* <DomoScoreCard
                      contact={
                        contactInfo[conversation.tavus_conversation_id] || null
                      }
                      productInterest={
                        productInterestData[
                          conversation.tavus_conversation_id
                        ] || null
                      }
                      videoShowcase={
                        videoShowcaseData[conversation.tavus_conversation_id] ||
                        null
                      }
                      ctaTracking={
                        ctaTrackingData[conversation.tavus_conversation_id] ||
                        null
                      }
                      perceptionAnalysis={conversation.perception_analysis}
                    /> */}
                    <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <p className="text-sm text-yellow-700">Reporting components temporarily disabled due to syntax errors.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )
      )}

      {/* Privacy Notice */}
      <div className="mt-6 text-xs text-gray-500">
        <p className="mb-1 font-medium">Privacy Notice</p>
        <p>
          Conversation data is stored securely with appropriate privacy
          controls. Personal information is handled according to our privacy
          policy. This view is for insights and compliance purposes.
        </p>
      </div>
    </div>
  );
};
