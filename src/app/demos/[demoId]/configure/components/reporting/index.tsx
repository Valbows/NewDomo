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

  const { syncing, syncError, syncConversations, initialSyncComplete } = useConversationSync({
    demoId: demo?.id,
    onSyncComplete: refreshAllData,
    autoSync: true, // Auto-sync when page loads
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

  // Show loading state during initial sync
  if (!initialSyncComplete && syncing) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-indigo-200 rounded-full"></div>
          <div className="w-16 h-16 border-4 border-indigo-600 rounded-full border-t-transparent animate-spin absolute top-0 left-0"></div>
        </div>
        <h3 className="mt-6 text-lg font-semibold text-gray-900">Loading Conversation Data</h3>
        <p className="mt-2 text-gray-600 text-center max-w-md">
          Syncing your latest conversations and generating perception analysis...
        </p>
        <p className="mt-1 text-sm text-gray-500">This may take a few moments</p>
      </div>
    );
  }

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
          className="inline-flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors"
          title="Manually refresh conversation data"
        >
          {syncing ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <RefreshCw className="w-4 h-4 mr-2" />
          )}
          {syncing ? "Syncing..." : "Refresh"}
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
