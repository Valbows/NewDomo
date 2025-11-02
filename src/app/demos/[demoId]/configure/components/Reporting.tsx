import { Demo } from "@/app/demos/[demoId]/configure/types";
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { Loader2, RefreshCw } from "lucide-react";

// Import split components
import {
  ContactInfoCard,
  ProductInterestCard,
  VideoShowcaseCard,
  CtaTrackingCard,
  DomoScoreCard,
} from "./reporting/index";
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
  objective_name: string;
  event_type: string;
  raw_payload: any;
  received_at: string;
}

interface ProductInterestData {
  id: string;
  conversation_id: string;
  objective_name: string;
  primary_interest: string | null;
  pain_points: string[] | null;
  event_type: string;
  raw_payload: any;
  received_at: string;
}

interface VideoShowcaseData {
  id: string;
  conversation_id: string;
  objective_name: string;
  requested_videos: string[] | null;
  videos_shown: string[] | null;
  event_type: string;
  raw_payload: any;
  received_at: string;
  updated_at?: string;
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
        // Fetch contact info (from qualification_data table)
        const { data: contactData } = await supabase
          .from("qualification_data")
          .select("*")
          .in("conversation_id", conversationIds);

        // Fetch product interest
        const { data: productData } = await supabase
          .from("product_interest_data")
          .select("*")
          .in("conversation_id", conversationIds);

        // Fetch video showcase
        const { data: videoData } = await supabase
          .from("video_showcase_data")
          .select("*")
          .in("conversation_id", conversationIds);

        // Fetch CTA tracking
        const { data: ctaData } = await supabase
          .from("cta_tracking")
          .select("*")
          .in("conversation_id", conversationIds);

        console.log(`📊 Fetched related data:`, {
          contactData: contactData?.length || 0,
          productData: productData?.length || 0,
          videoData: videoData?.length || 0,
          ctaData: ctaData?.length || 0,
        });

        console.log(
          "📊 Sample conversation IDs being searched:",
          conversationIds.slice(0, 3)
        );
        console.log("📊 Sample contact data:", contactData?.slice(0, 2));
        console.log("📊 Sample product data:", productData?.slice(0, 2));

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
    (c) => c.status === "completed" || c.status === "ended"
  ).length;
  const totalDuration = conversations.reduce(
    (sum, c) => sum + (c.duration_seconds || 0),
    0
  );
  const averageDuration =
    completedConversations > 0 ? totalDuration / completedConversations : 0;

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

      {/* Debug Info */}
      {process.env.NODE_ENV === "development" && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <h4 className="font-medium text-gray-700 mb-2">Debug Info</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="font-medium">Contact Info:</span>
              <span className="ml-2">{Object.keys(contactInfo).length}</span>
            </div>
            <div>
              <span className="font-medium">Product Interest:</span>
              <span className="ml-2">
                {Object.keys(productInterestData).length}
              </span>
            </div>
            <div>
              <span className="font-medium">Video Showcase:</span>
              <span className="ml-2">
                {Object.keys(videoShowcaseData).length}
              </span>
            </div>
            <div>
              <span className="font-medium">CTA Tracking:</span>
              <span className="ml-2">
                {Object.keys(ctaTrackingData).length}
              </span>
            </div>
          </div>
        </div>
      )}

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
        {conversations.map((conversation) => {
          const isExpanded = expandedConversations.has(conversation.tavus_conversation_id);
          const hasContact = !!contactInfo[conversation.tavus_conversation_id];
          const hasProductInterest = !!productInterestData[conversation.tavus_conversation_id];
          const hasVideoShowcase = !!videoShowcaseData[conversation.tavus_conversation_id];
          const hasCTA = !!ctaTrackingData[conversation.tavus_conversation_id];
          const hasPerception = !!conversation.perception_analysis;

          return (
            <div
              key={conversation.id}
              className="bg-white rounded-lg shadow border"
            >
              {/* Conversation Header */}
              <div className="p-4">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">
                      {conversation.conversation_name ||
                        `Conversation ${conversation.id.slice(0, 8)}`}
                    </h4>
                    <p className="text-sm text-gray-600 mb-3">
                      {formatDate(conversation.started_at)} •{" "}
                      {conversation.duration_seconds
                        ? Math.round(conversation.duration_seconds / 60)
                        : 0}
                      m
                    </p>
                    
                    {/* Data Tags */}
                    <div className="flex flex-wrap gap-2">
                      {hasContact && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          👤 Contact Info
                        </span>
                      )}
                      {hasProductInterest && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          🎯 Product Interest
                        </span>
                      )}
                      {hasVideoShowcase && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                          🎬 Video Showcase
                        </span>
                      )}
                      {hasCTA && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                          🎯 CTA Tracking
                        </span>
                      )}
                      {hasPerception && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                          🧠 AI Analysis
                        </span>
                      )}
                      {!hasContact && !hasProductInterest && !hasVideoShowcase && !hasCTA && !hasPerception && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                          No data captured
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <button
                    onClick={() =>
                      toggleConversationExpansion(
                        conversation.tavus_conversation_id
                      )
                    }
                    className="ml-4 text-blue-600 hover:text-blue-800 font-medium"
                  >
                    {isExpanded ? "Collapse" : "Expand"}
                  </button>
                </div>
              </div>

              {/* Expanded Details - Inline */}
              {isExpanded && (
                <div className="border-t bg-gray-50 p-6">
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left Column - Data Cards */}
                    <div className="lg:col-span-2 space-y-6">
                      <ContactInfoCard
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
                      />

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

                    {/* Right Column - Domo Score */}
                    <div className="lg:col-span-1">
                      <div className="sticky top-4">
                        <DomoScoreCard
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
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>



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
