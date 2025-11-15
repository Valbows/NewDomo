import React from 'react';

export function formatDate(iso?: string) {
  try {
    if (!iso) return "—";
    const date = new Date(iso);
    if (isNaN(date.getTime())) return "—";
    return date.toLocaleString();
  } catch {
    return "—";
  }
}

export function isValidPerceptionAnalysis(perceptionAnalysis: any): boolean {
  if (!perceptionAnalysis) return false;
  if (typeof perceptionAnalysis === "string") {
    const analysis = perceptionAnalysis.trim().toLowerCase();
    if (analysis.length === 0) return false;
    const blackScreenIndicators = [
      "completely black",
      "black screen",
      "no visual",
    ];
    return !blackScreenIndicators.some((indicator) =>
      analysis.includes(indicator)
    );
  }
  return !!(
    perceptionAnalysis.overall_score || perceptionAnalysis.engagement_score
  );
}

// JSX rendering functions moved to render-utils.tsx for proper JSX handling

export function calculateConversationStats(conversations: any[]) {
  const completedConversations = conversations.filter(
    (c) => c.status === "completed" || c.status === "ended"
  ).length;
  
  const totalDuration = conversations.reduce(
    (sum, c) => sum + (c.duration_seconds || 0),
    0
  );
  
  const averageDuration =
    completedConversations > 0 ? totalDuration / completedConversations : 0;

  // Calculate average Domo Score (0-5 scale)
  const conversationsWithScore = conversations.filter(c => c.domo_score != null);
  const averageDomoScore = conversationsWithScore.length > 0 
    ? (conversationsWithScore.reduce((sum, c) => sum + (c.domo_score || 0), 0) / conversationsWithScore.length).toFixed(1)
    : null;

  // Get last conversation time
  const lastConversation = conversations.length > 0 
    ? formatDate(conversations[0].started_at) // conversations are ordered by started_at desc
    : null;

  return {
    totalConversations: conversations.length,
    completedConversations,
    averageDuration,
    averageDomoScore,
    lastConversation,
    status: conversations.length > 0 ? "Active" : "No Data"
  };
}

export function getConversationDataFlags(
  conversationId: string,
  contactInfo: Record<string, any>,
  productInterestData: Record<string, any>,
  videoShowcaseData: Record<string, any>,
  ctaTrackingData: Record<string, any>,
  perceptionAnalysis: any
) {
  return {
    hasContact: !!contactInfo[conversationId],
    hasProductInterest: !!productInterestData[conversationId],
    hasVideoShowcase: !!videoShowcaseData[conversationId],
    hasCTA: !!ctaTrackingData[conversationId],
    hasPerception: !!perceptionAnalysis,
  };
}