import {
  ContactInfo,
  ProductInterestData,
  VideoShowcaseData,
  CtaTrackingData,
  DomoScoreResult,
} from "../types";

// Visual indicators that suggest meaningful perception analysis
const VISUAL_INDICATORS = [
  "user",
  "appearance",
  "facial",
  "expression",
  "gesture",
  "movement",
  "looking",
  "speaking",
  "engaged",
  "focused",
  "attentive",
  "background",
  "setting",
  "clothing",
  "hair",
  "eyes",
  "mouth",
  "hand",
  "head",
  "body language",
  "emotional state",
  "behavior",
];

// Black screen indicators that suggest no valid visual data
const BLACK_SCREEN_INDICATORS = [
  "completely black",
  "black screen",
  "no visual",
  "no details regarding",
  "no discernible visual",
  "absence of visible content",
  "all visual inputs were consistently reported as completely black",
];

// Helper function to determine if perception analysis is valid
// Since Raven-0 is enabled by default, we should award the point when:
// 1. Camera is capturing actual visual data (not black screen)
// 2. Analysis contains meaningful visual indicators
// 3. Structured perception metrics are present
export function isValidPerceptionAnalysis(perceptionAnalysis: any): boolean {
  // If no perception data at all, return false
  if (!perceptionAnalysis) {
    return false;
  }

  // If it's a string, check if it contains meaningful visual analysis
  if (typeof perceptionAnalysis === "string") {
    const analysis = perceptionAnalysis.trim().toLowerCase();

    // Return false if it's empty or only contains generic/error messages
    if (analysis.length === 0) {
      return false;
    }

    // Check for black screen indicators (should not award point)
    const hasBlackScreenIndicator = BLACK_SCREEN_INDICATORS.some((indicator) =>
      analysis.includes(indicator)
    );

    if (hasBlackScreenIndicator) {
      return false;
    }

    // Check for positive visual indicators (should award point)
    const hasVisualIndicator = VISUAL_INDICATORS.some((indicator) =>
      analysis.includes(indicator)
    );

    // Award point if we have visual indicators and no black screen
    return hasVisualIndicator;
  }

  // If it's an object with structured data, check for meaningful content
  if (typeof perceptionAnalysis === "object") {
    // Check if it has any meaningful perception metrics
    const hasMetrics = !!(
      perceptionAnalysis.overall_score ||
      perceptionAnalysis.engagement_score ||
      perceptionAnalysis.sentiment_score ||
      perceptionAnalysis.key_insights
    );

    return hasMetrics;
  }

  // Default to false for unknown formats
  return false;
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
