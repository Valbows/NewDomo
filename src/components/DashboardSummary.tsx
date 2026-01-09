"use client";

import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { Demo } from "@/app/demos/[demoId]/configure/types";

interface Props {
  demos: Demo[];
  loading?: boolean;
}

interface ConversationStats {
  totalConversations: number;
  lastUpdated: string | null;
  byDemo: Record<string, number>;
}

const DashboardSummary: React.FC<Props> = ({ demos, loading = false }) => {
  const [conversationStats, setConversationStats] = useState<ConversationStats>({
    totalConversations: 0,
    lastUpdated: null,
    byDemo: {},
  });
  const [statsLoading, setStatsLoading] = useState(true);

  // Fetch conversation counts from the database
  useEffect(() => {
    const fetchConversationStats = async () => {
      if (demos.length === 0) {
        setStatsLoading(false);
        return;
      }

      try {
        const demoIds = demos.map((d) => d.id);

        // Fetch conversation details for all demos
        const { data, error } = await supabase
          .from("conversation_details")
          .select("demo_id, completed_at, created_at")
          .in("demo_id", demoIds);

        if (error) {
          console.error("Failed to fetch conversation stats:", error);
          setStatsLoading(false);
          return;
        }

        // Aggregate the data
        const byDemo: Record<string, number> = {};
        let lastUpdated: string | null = null;

        for (const conv of data || []) {
          // Count by demo
          byDemo[conv.demo_id] = (byDemo[conv.demo_id] || 0) + 1;

          // Track most recent conversation
          const convDate = conv.completed_at || conv.created_at;
          if (convDate && (!lastUpdated || new Date(convDate) > new Date(lastUpdated))) {
            lastUpdated = convDate;
          }
        }

        setConversationStats({
          totalConversations: data?.length || 0,
          lastUpdated,
          byDemo,
        });
      } catch (err) {
        console.error("Error fetching conversation stats:", err);
      } finally {
        setStatsLoading(false);
      }
    };

    fetchConversationStats();
  }, [demos]);

  // Calculate active demos
  const activeDemos = demos.filter(
    (d) => d.tavus_persona_id || d.tavus_conversation_id
  ).length;

  const isLoading = loading || statsLoading;

  return (
    <div
      className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
      aria-live="polite"
    >
      <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-100">
        <p className="text-xs text-gray-500">Total Demos</p>
        {loading ? (
          <div className="h-7 w-12 bg-gray-200 animate-pulse rounded"></div>
        ) : (
          <p
            className="text-2xl font-semibold text-domo-dark-text"
            data-testid="summary-total-demos"
          >
            {demos.length}
          </p>
        )}
      </div>
      <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-100">
        <p className="text-xs text-gray-500">Active Demos</p>
        {loading ? (
          <div className="h-7 w-12 bg-gray-200 animate-pulse rounded"></div>
        ) : (
          <p
            className="text-2xl font-semibold text-domo-dark-text"
            data-testid="summary-active-demos"
          >
            {activeDemos}
          </p>
        )}
      </div>
      <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-100">
        <p className="text-xs text-gray-500">Conversations Tracked</p>
        {isLoading ? (
          <div className="h-7 w-16 bg-gray-200 animate-pulse rounded"></div>
        ) : (
          <p
            className="text-2xl font-semibold text-domo-dark-text"
            data-testid="summary-total-conversations"
          >
            {conversationStats.totalConversations}
          </p>
        )}
      </div>
      <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-100">
        <p className="text-xs text-gray-500">Last Analytics Update</p>
        {isLoading ? (
          <div className="h-5 w-40 bg-gray-200 animate-pulse rounded"></div>
        ) : (
          <p
            className="text-sm font-medium text-domo-dark-text"
            data-testid="summary-last-updated"
          >
            {conversationStats.lastUpdated
              ? new Date(conversationStats.lastUpdated).toLocaleString()
              : "—"}
          </p>
        )}
      </div>
    </div>
  );
};

// Export conversation stats getter for use by DemoList
export function getConversationCountForDemo(
  byDemo: Record<string, number>,
  demoId: string
): number {
  return byDemo[demoId] || 0;
}

export default DashboardSummary;
