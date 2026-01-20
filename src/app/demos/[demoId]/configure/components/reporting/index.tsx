"use client";

import { useState, useRef, useCallback } from "react";
import { Loader2, RefreshCw } from "lucide-react";
import { ReportingProps } from "./types";
import { useConversationData } from "./hooks/useConversationData";
import { calculateDomoScore } from "./utils/domo-score";
import { StatsDashboard } from "./components/StatsDashboard";
import { ConversationList } from "./components/ConversationList";

export const Reporting = ({ demo }: ReportingProps) => {
  const [expandedConversation, setExpandedConversation] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  const syncingRef = useRef(false); // Prevent multiple simultaneous syncs

  // Use custom hooks for data management
  // Realtime subscription in useConversationData handles automatic updates
  const {
    conversationDetails,
    contactInfo,
    productInterestData,
    videoShowcaseData,
    ctaTrackingData,
    loading,
    error: dataError,
    hasPendingAnalysis,
    refreshAllData,
    pauseRealtime,
    resumeRealtime,
  } = useConversationData({ demoId: demo?.id });

  // Manual sync function - fetches perception analysis from Tavus API
  // Pauses realtime during sync to prevent multiple UI refreshes
  const syncConversations = useCallback(async () => {
    if (!demo?.id || syncingRef.current) return;

    syncingRef.current = true;
    setSyncing(true);
    setSyncError(null);

    // Pause realtime updates during sync to prevent UI flickering
    pauseRealtime();

    try {
      const response = await fetch(`/api/sync-tavus-conversations?demoId=${demo.id}`, {
        method: "GET",
      });

      if (!response.ok) {
        throw new Error("Failed to sync conversations");
      }

      // Sync complete - do ONE refresh of all data
      await refreshAllData();
    } catch (err) {
      console.error("Failed to sync conversations:", err);
      setSyncError("Failed to sync conversations from Domo");
    } finally {
      setSyncing(false);
      syncingRef.current = false;
      // Resume realtime updates
      resumeRealtime();
    }
  }, [demo?.id, pauseRealtime, resumeRealtime, refreshAllData]);

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

  // Note: We no longer block the UI during initial sync - content loads seamlessly

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-semibold text-white font-heading">Reporting & Analytics</h2>
          <p className="text-domo-text-secondary mt-1">
            View detailed conversation transcripts and perception analysis from Domo.
            {syncing && (
              <span className="ml-2 inline-flex items-center text-domo-primary">
                <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                <span className="text-xs">Syncing...</span>
              </span>
            )}
          </p>
        </div>
        {/* Fetch button - show when there are conversations missing perception analysis */}
        {hasPendingAnalysis && (
          <button
            onClick={syncConversations}
            disabled={syncing || !demo?.tavus_conversation_id}
            className="inline-flex items-center px-3 py-1.5 text-sm bg-domo-primary text-white rounded-md hover:bg-domo-secondary disabled:bg-domo-bg-elevated disabled:text-domo-text-muted disabled:cursor-not-allowed transition-colors"
            title="Fetch perception analysis from Domo"
          >
            {syncing ? (
              <Loader2 className="w-3 h-3 mr-1.5 animate-spin" />
            ) : (
              <RefreshCw className="w-3 h-3 mr-1.5" />
            )}
            {syncing ? "Fetching..." : "Fetch Domo"}
          </button>
        )}
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-6 p-4 bg-domo-error/10 border border-domo-error/20 text-domo-error rounded-xl">
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
      <div className="mt-6 text-xs text-domo-text-muted">
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
