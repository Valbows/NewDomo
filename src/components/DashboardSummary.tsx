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

  useEffect(() => {
    const fetchConversationStats = async () => {
      if (demos.length === 0) {
        setStatsLoading(false);
        return;
      }

      try {
        const demoIds = demos.map((d) => d.id);

        const { data, error } = await supabase
          .from("conversation_details")
          .select("demo_id, completed_at, created_at")
          .in("demo_id", demoIds);

        if (error) {
          console.error("Failed to fetch conversation stats:", error);
          setStatsLoading(false);
          return;
        }

        const byDemo: Record<string, number> = {};
        let lastUpdated: string | null = null;

        for (const conv of data || []) {
          byDemo[conv.demo_id] = (byDemo[conv.demo_id] || 0) + 1;

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

  const activeDemos = demos.filter(
    (d) => d.tavus_persona_id || d.tavus_conversation_id
  ).length;

  const isLoading = loading || statsLoading;

  const stats = [
    {
      label: "Total Demos",
      value: demos.length,
      testId: "summary-total-demos",
      icon: (
        <svg className="w-5 h-5 text-domo-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
      ),
    },
    {
      label: "Active Demos",
      value: activeDemos,
      testId: "summary-active-demos",
      icon: (
        <svg className="w-5 h-5 text-domo-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    {
      label: "Conversations",
      value: conversationStats.totalConversations,
      testId: "summary-total-conversations",
      icon: (
        <svg className="w-5 h-5 text-domo-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      ),
    },
    {
      label: "Last Updated",
      value: conversationStats.lastUpdated
        ? new Date(conversationStats.lastUpdated).toLocaleDateString()
        : "—",
      testId: "summary-last-updated",
      isText: true,
      icon: (
        <svg className="w-5 h-5 text-domo-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
  ];

  return (
    <div
      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
      aria-live="polite"
    >
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="bg-domo-bg-card border border-domo-border rounded-xl p-5"
        >
          <div className="flex items-center gap-3 mb-3">
            {stat.icon}
            <p className="text-sm text-domo-text-muted">{stat.label}</p>
          </div>
          {isLoading ? (
            <div className="h-8 w-16 bg-domo-bg-elevated animate-pulse rounded"></div>
          ) : (
            <p
              className={`${stat.isText ? 'text-sm' : 'text-2xl'} font-semibold text-white`}
              data-testid={stat.testId}
            >
              {stat.value}
            </p>
          )}
        </div>
      ))}
    </div>
  );
};

export function getConversationCountForDemo(
  byDemo: Record<string, number>,
  demoId: string
): number {
  return byDemo[demoId] || 0;
}

export default DashboardSummary;
