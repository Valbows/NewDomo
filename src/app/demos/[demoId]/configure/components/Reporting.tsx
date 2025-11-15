import React, { useState, useEffect, useCallback } from "react";
import { Loader2, RefreshCw } from "lucide-react";
import {
  ReportingProps,
  ConversationDetail,
  ConversationDataSets,
} from "./reporting/types";
import { ReportingDataService } from "./reporting/data-service";
import { ConversationList } from "./reporting/ConversationList";
import { calculateConversationStats } from "./reporting/utils";

export const Reporting = ({ demo }: ReportingProps) => {
  const [conversations, setConversations] = useState<ConversationDetail[]>([]);
  const [dataSets, setDataSets] = useState<ConversationDataSets>({
    contactInfo: {},
    productInterestData: {},
    videoShowcaseData: {},
    ctaTrackingData: {},
  });
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedConversations, setExpandedConversations] = useState<
    Set<string>
  >(new Set());

  const fetchConversationData = useCallback(async () => {
    if (!demo?.id) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { conversations: fetchedConversations, dataSets: fetchedDataSets } =
        await ReportingDataService.fetchConversationData(demo.id);

      setConversations(fetchedConversations);
      setDataSets(fetchedDataSets);
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
      setError(null);
      await ReportingDataService.syncConversations(demo.id);
      await fetchConversationData();
    } catch (error) {
      console.error("Error syncing conversations:", error);
      setError("Failed to sync conversations. Please try again.");
    } finally {
      setSyncing(false);
    }
  };

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

  useEffect(() => {
    if (demo?.id) {
      setLoading(true);
      fetchConversationData();
    }
  }, [fetchConversationData, demo?.id]);

  // Always render the UI structure, show loading state only in the conversation list area

  const stats = calculateConversationStats(conversations);

  return (
    <div className="space-y-6">
      {/* Header with Sync Button */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            Reporting & Analytics
          </h3>
          <p className="text-sm text-gray-600">
            View detailed conversation transcripts and analytics
          </p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <button
            onClick={syncConversations}
            disabled={syncing}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${syncing ? "animate-spin" : ""}`} data-testid="refresh-icon" />
            {syncing ? "Syncing..." : "Sync from Domo"}
          </button>
          {error && (
            <div className="text-sm text-red-600 bg-red-50 px-3 py-1 rounded">
              {error}
            </div>
          )}
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-white p-4 rounded-lg shadow border">
          <div className="text-2xl font-bold text-gray-900">
            {stats.totalConversations}
          </div>
          <div className="text-sm text-gray-600">Total Conversations</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border">
          <div className="text-2xl font-bold text-green-600">
            {stats.completedConversations}
          </div>
          <div className="text-sm text-gray-600">Completed</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border">
          <div className="text-2xl font-bold text-blue-600">
            {Math.round(stats.averageDuration / 60)}m
          </div>
          <div className="text-sm text-gray-600">Avg Duration</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border">
          <div className="text-2xl font-bold text-purple-600">
            {stats.averageDomoScore ? `${stats.averageDomoScore}/5` : '0/5'}
          </div>
          <div className="text-sm text-gray-600">Avg Domo Score</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border">
          <div className="text-2xl font-bold text-orange-600">
            {stats.lastConversation || 'None'}
          </div>
          <div className="text-sm text-gray-600">Last Conversation</div>
        </div>
      </div>

      {/* Conversation Details Section */}
      <div className="bg-white rounded-lg shadow border p-6">
        <h4 className="text-lg font-semibold text-gray-900 mb-2">
          Conversation Details
        </h4>
        <p className="text-sm text-gray-600 mb-4">
          Detailed transcripts and perception analysis for each conversation
        </p>
        
        {/* Conversations List */}
        <div data-testid="conversation-list">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
              <span className="ml-2 text-gray-600">Loading conversation data...</span>
            </div>
          ) : (
            <ConversationList
              conversations={conversations}
              dataSets={dataSets}
              expandedConversations={expandedConversations}
              onToggleExpansion={toggleConversationExpansion}
            />
          )}
        </div>
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
