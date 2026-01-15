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
  const MAX_AUTO_SYNC_ATTEMPTS = 10;
  const MAX_AUTO_SYNC_DURATION_MS = 5 * 60 * 1000; // 5 minutes

  // Auto-sync from Tavus API when there are conversations missing perception analysis
  useEffect(() => {
    // Only start auto-sync if initial sync is complete and there are pending analyses
    if (!initialSyncComplete || !hasPendingAnalysis) {
      // Reset counters when no pending analysis
      if (!hasPendingAnalysis) {
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

    // Start polling Tavus API every 30 seconds for perception analysis
    const syncInterval = () => {
      if (!syncing) {
        autoSyncAttemptsRef.current += 1;
        syncConversations();
      }
    };

    // Start interval if not already running
    if (!autoSyncIntervalRef.current) {
      autoSyncIntervalRef.current = setInterval(syncInterval, 30000);
    }

    return () => {
      if (autoSyncIntervalRef.current) {
        clearInterval(autoSyncIntervalRef.current);
        autoSyncIntervalRef.current = null;
      }
    };
  }, [initialSyncComplete, hasPendingAnalysis, syncing, syncConversations]);

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
          className="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:bg-purple-300 disabled:cursor-not-allowed transition-colors"
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
