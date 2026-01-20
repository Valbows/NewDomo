import {
  ContactInfo,
  ProductInterestData,
  VideoShowcaseData,
  CtaTrackingData,
  DomoScoreResult,
} from "../types";

// Helper function to determine if perception analysis is valid
// Simple rule: If we have perception data that will be displayed, award the point
export function isValidPerceptionAnalysis(perceptionAnalysis: any): boolean {
  // If no perception data at all, return false
  if (perceptionAnalysis === null || perceptionAnalysis === undefined) {
    return false;
  }

  // If it's a string, check it has meaningful content
  if (typeof perceptionAnalysis === "string") {
    const trimmed = perceptionAnalysis.trim();
    // Must have some content (at least 10 chars)
    return trimmed.length >= 10;
  }

  // If it's an array, check it's not empty
  if (Array.isArray(perceptionAnalysis)) {
    return perceptionAnalysis.length > 0;
  }

  // If it's an object, check it has keys
  if (typeof perceptionAnalysis === "object") {
    return Object.keys(perceptionAnalysis).length > 0;
  }

  // Any other truthy value counts
  return !!perceptionAnalysis;
}

// Calculate Domo Score based on data completeness
export function calculateDomoScore(
  contact: ContactInfo | null,
  productInterest: ProductInterestData | null,
  videoShowcase: VideoShowcaseData | null,
  ctaTracking: CtaTrackingData | null,
  perceptionAnalysis: any
): DomoScoreResult {
  const breakdown = {
    contactConfirmation: !!(
      contact?.email ||
      contact?.first_name ||
      contact?.last_name
    ),
    reasonForVisit: !!(
      productInterest?.primary_interest ||
      (productInterest?.pain_points && productInterest.pain_points.length > 0)
    ),
    platformFeatureInterest: !!(
      videoShowcase?.videos_shown && videoShowcase.videos_shown.length > 0
    ),
    ctaExecution: !!ctaTracking?.cta_clicked_at,
    perceptionAnalysis: isValidPerceptionAnalysis(perceptionAnalysis),
  };

  const score = Object.values(breakdown).filter(Boolean).length;
  const maxScore = 5;

  return { score, maxScore, breakdown };
}

// Get color classes based on score
export function getScoreColor(score: number): string {
  if (score >= 4) return "text-green-600 bg-green-50 border-green-200";
  if (score >= 3) return "text-blue-600 bg-blue-50 border-blue-200";
  if (score >= 2) return "text-yellow-600 bg-yellow-50 border-yellow-200";
  return "text-red-600 bg-red-50 border-red-200";
}

// Get score label based on score value
export function getScoreLabel(score: number): string {
  if (score >= 4) return "Excellent";
  if (score >= 3) return "Good";
  if (score >= 2) return "Fair";
  return "Poor";
}
