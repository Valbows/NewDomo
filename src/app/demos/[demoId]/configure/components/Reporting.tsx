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
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [expandedConversations, setExpandedConversations] = useState<
    Set<string>
  >(new Set());

  const fetchConversationData = useCallback(async () => {
    if (!demo?.id) return;

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
      await ReportingDataService.syncConversations(demo.id);
      await fetchConversationData();
    } catch (error) {
      console.error("Error syncing conversations:", error);
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
    fetchConversationData();
  }, [fetchConversationData]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
        <span className="ml-2 text-gray-600">Loading conversation data...</span>
      </div>
    );
  }

  const stats = calculateConversationStats(conversations);

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
          <RefreshCw className={`w-4 h-4 ${syncing ? "animate-spin" : ""}`} data-testid="refresh-icon" />
          {syncing ? "Syncing..." : "Sync Data"}
        </button>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
            {stats.status}
          </div>
          <div className="text-sm text-gray-600">Status</div>
        </div>
      </div>

      {/* Conversations List */}
      <div data-testid="conversation-list">
        <ConversationList
          conversations={conversations}
          dataSets={dataSets}
          expandedConversations={expandedConversations}
          onToggleExpansion={toggleConversationExpansion}
        />
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
