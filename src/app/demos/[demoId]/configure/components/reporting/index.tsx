"use client";

import { useState, useEffect, useRef } from "react";
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
    hasPendingAnalysis,
    refreshAllData,
  } = useConversationData({ demoId: demo?.id });

  const { syncing, syncError, syncConversations, initialSyncComplete } = useConversationSync({
    demoId: demo?.id,
    onSyncComplete: refreshAllData,
    autoSync: true, // Auto-sync when page loads
  });

  // Track auto-sync state with retry limits
  const autoSyncIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const autoSyncAttemptsRef = useRef<number>(0);
  const autoSyncStartTimeRef = useRef<number | null>(null);
  const MAX_AUTO_SYNC_ATTEMPTS = 3; // Reduced from 10
  const MAX_AUTO_SYNC_DURATION_MS = 1 * 60 * 1000; // 1 minute (changed from 5 minutes)

  // Check if any conversation ended recently (within 1 minute)
  const hasRecentlyEndedConversation = conversationDetails.some((c) => {
    if (c.status !== 'ended' && c.status !== 'completed') return false;
    if (!c.completed_at) return false;
    const completedTime = new Date(c.completed_at).getTime();
    const oneMinuteAgo = Date.now() - 60 * 1000;
    return completedTime > oneMinuteAgo;
  });

  // Auto-sync from Tavus API ONLY when:
  // 1. Initial sync is complete
  // 2. There are pending analyses
  // 3. A conversation ended recently (within 1 minute)
  useEffect(() => {
    // Only start auto-sync if initial sync is complete, there are pending analyses, AND a conversation ended recently
    if (!initialSyncComplete || !hasPendingAnalysis || !hasRecentlyEndedConversation) {
      // Reset counters when conditions not met
      if (!hasPendingAnalysis || !hasRecentlyEndedConversation) {
        autoSyncAttemptsRef.current = 0;
        autoSyncStartTimeRef.current = null;
      }
      if (autoSyncIntervalRef.current) {
        clearInterval(autoSyncIntervalRef.current);
        autoSyncIntervalRef.current = null;
      }
      return;
    }

    // Initialize start time on first run
    if (!autoSyncStartTimeRef.current) {
      autoSyncStartTimeRef.current = Date.now();
    }

    // Check if we've exceeded limits
    const hasExceededAttempts = autoSyncAttemptsRef.current >= MAX_AUTO_SYNC_ATTEMPTS;
    const hasExceededTime = Date.now() - (autoSyncStartTimeRef.current || Date.now()) > MAX_AUTO_SYNC_DURATION_MS;

    if (hasExceededAttempts || hasExceededTime) {
      if (autoSyncIntervalRef.current) {
        clearInterval(autoSyncIntervalRef.current);
        autoSyncIntervalRef.current = null;
      }
      return;
    }

    // Start polling Tavus API every 20 seconds for perception analysis (reduced from 30)
    const syncInterval = () => {
      if (!syncing) {
        autoSyncAttemptsRef.current += 1;
        syncConversations();
      }
    };

    // Start interval if not already running
    if (!autoSyncIntervalRef.current) {
      autoSyncIntervalRef.current = setInterval(syncInterval, 20000);
    }

    return () => {
      if (autoSyncIntervalRef.current) {
        clearInterval(autoSyncIntervalRef.current);
        autoSyncIntervalRef.current = null;
      }
    };
  }, [initialSyncComplete, hasPendingAnalysis, hasRecentlyEndedConversation, syncing, syncConversations]);

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
        <button
          onClick={syncConversations}
          disabled={syncing || !demo?.tavus_conversation_id}
          className="inline-flex items-center px-4 py-2 bg-domo-primary text-white rounded-lg hover:bg-domo-secondary disabled:bg-domo-bg-elevated disabled:text-domo-text-muted disabled:cursor-not-allowed transition-colors"
          title="Fetch perception analysis from Domo"
        >
          {syncing ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <RefreshCw className="w-4 h-4 mr-2" />
          )}
          {syncing ? "Fetching..." : "Fetch Domo"}
        </button>
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
