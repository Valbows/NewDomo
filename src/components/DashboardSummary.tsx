"use client";

import React from "react";
import type { Demo } from "@/app/demos/[demoId]/configure/types";

interface Props {
  demos: Demo[];
  loading?: boolean;
}

function getAnalyticsMeta(demo: Demo) {
  const analytics = (demo?.metadata as any)?.analytics as
    | { last_updated?: string; conversations?: Record<string, any> }
    | undefined;
  return {
    lastUpdated: analytics?.last_updated || null,
    conversationCount: analytics?.conversations
      ? Object.keys(analytics.conversations).length
      : 0,
  };
}

function aggregate(demos: Demo[]) {
  let totalConversations = 0;
  let lastUpdated: string | null = null;
  let active = 0;

  for (const d of demos) {
    const { lastUpdated: lu, conversationCount } = getAnalyticsMeta(d);
    totalConversations += conversationCount;
    if (lu && (!lastUpdated || new Date(lu) > new Date(lastUpdated))) {
      lastUpdated = lu;
    }
    if (d.tavus_persona_id || d.tavus_conversation_id) active += 1;
  }

  return {
    totalDemos: demos.length,
    activeDemos: active,
    totalConversations,
    lastUpdated,
  };
}

const DashboardSummary: React.FC<Props> = ({ demos, loading = false }) => {
  const { totalDemos, activeDemos, totalConversations, lastUpdated } =
    aggregate(demos);

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
            {totalDemos}
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
        {loading ? (
          <div className="h-7 w-16 bg-gray-200 animate-pulse rounded"></div>
        ) : (
          <p
            className="text-2xl font-semibold text-domo-dark-text"
            data-testid="summary-total-conversations"
          >
            {totalConversations}
          </p>
        )}
      </div>
      <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-100">
        <p className="text-xs text-gray-500">Last Analytics Update</p>
        {loading ? (
          <div className="h-5 w-40 bg-gray-200 animate-pulse rounded"></div>
        ) : (
          <p
            className="text-sm font-medium text-domo-dark-text"
            data-testid="summary-last-updated"
          >
            {lastUpdated ? new Date(lastUpdated).toLocaleString() : "—"}
          </p>
        )}
      </div>
    </div>
  );
};

export default DashboardSummary;
