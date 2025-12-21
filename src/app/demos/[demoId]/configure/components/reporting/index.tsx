"use client";

import { useState } from "react";
import { Loader2, RefreshCw } from "lucide-react";
import { ReportingProps } from "./types";
import { useConversationData } from "./hooks/useConversationData";
import { useConversationSync } from "./hooks/useConversationSync";
import { calculateDomoScore } from "./utils/domo-score";
import { StatsDashboard } from "./components/StatsDashboard";
import { ConversationList } from "./components/ConversationList";

export const Reporting = ({ demo }: ReportingProps) => {
  const [expandedConversation, setExpandedConversation] = useState<string | null>(null);

  // Use custom hooks for data management
  const {
    conversationDetails,
    contactInfo,
    productInterestData,
    videoShowcaseData,
    ctaTrackingData,
    loading,
    error: dataError,
    refreshAllData,
  } = useConversationData({ demoId: demo?.id });

  const { syncing, syncError, syncConversations } = useConversationSync({
    demoId: demo?.id,
    onSyncComplete: refreshAllData,
  });

  // Combine errors
  const error = dataError || syncError;

  // Calculate statistics
  const totalConversations = conversationDetails.length;
  // Count both "completed" and "ended" as finished conversations
  const completedConversations = conversationDetails.filter(
    (c) => c.status === "completed" || c.status === "ended"
  ).length;
  // Only average duration for conversations that have duration data
  const conversationsWithDuration = conversationDetails.filter(c => c.duration_seconds != null && c.duration_seconds > 0);
  const averageDuration =
    conversationsWithDuration.length > 0
      ? conversationsWithDuration.reduce((sum, c) => sum + (c.duration_seconds || 0), 0) /
        conversationsWithDuration.length
      : 0;

  // Calculate average Domo Score
  const averageDomoScore =
    conversationDetails.length > 0
      ? conversationDetails.reduce((sum, conversation) => {
          const { score } = calculateDomoScore(
            contactInfo[conversation.tavus_conversation_id] || null,
            productInterestData[conversation.tavus_conversation_id] || null,
            videoShowcaseData[conversation.tavus_conversation_id] || null,
            ctaTrackingData[conversation.tavus_conversation_id] || null,
            conversation.perception_analysis
          );
          return sum + score;
        }, 0) / conversationDetails.length
      : 0;

  const lastConversationDate =
    conversationDetails.length > 0
      ? conversationDetails[0].completed_at || conversationDetails[0].created_at
      : "";

  const handleToggleExpand = (conversationId: string) => {
    setExpandedConversation(expandedConversation === conversationId ? null : conversationId);
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-semibold">Reporting & Analytics</h2>
          <p className="text-gray-600 mt-1">
            View detailed conversation transcripts and perception analysis from Domo.
          </p>
        </div>
        <button
          onClick={syncConversations}
          disabled={syncing || !demo?.tavus_conversation_id}
          className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
        >
          {syncing ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <RefreshCw className="w-4 h-4 mr-2" />
          )}
          {syncing ? "Syncing..." : "Sync from Domo"}
        </button>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-6 p-4 bg-red-100 border border-red-300 text-red-700 rounded-md">
          {error}
        </div>
      )}

      {/* Statistics Dashboard */}
      <StatsDashboard
        totalConversations={totalConversations}
        completedConversations={completedConversations}
        averageDuration={averageDuration}
        averageDomoScore={averageDomoScore}
        lastConversationDate={lastConversationDate}
      />

      {/* Conversation List */}
      <ConversationList
        conversations={conversationDetails}
        contactInfo={contactInfo}
        productInterestData={productInterestData}
        videoShowcaseData={videoShowcaseData}
        ctaTrackingData={ctaTrackingData}
        loading={loading}
        expandedConversation={expandedConversation}
        onToggleExpand={handleToggleExpand}
        hasTavusConversation={!!demo?.tavus_conversation_id}
      />

      {/* Privacy Notice */}
      <div className="mt-6 text-xs text-gray-500">
        <p className="mb-1 font-medium">Privacy Notice</p>
        <p>
          Conversation data is stored securely with appropriate privacy controls. Personal
          information is handled according to our privacy policy. This view is for insights and
          compliance purposes.
        </p>
      </div>
    </div>
  );
};
