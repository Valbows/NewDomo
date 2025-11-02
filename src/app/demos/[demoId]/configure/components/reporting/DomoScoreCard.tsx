import React from 'react';

interface ContactInfo {
  id: string;
  conversation_id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  position: string | null;
  received_at: string;
}

interface ProductInterestData {
  id: string;
  conversation_id: string;
  primary_interest: string | null;
  pain_points: string[] | null;
  received_at: string;
}

interface VideoShowcaseData {
  id: string;
  conversation_id: string;
  requested_videos: string[] | null;
  videos_shown: string[] | null;
  objective_name: string;
  received_at: string;
}

interface CtaTrackingData {
  id: string;
  conversation_id: string;
  demo_id: string;
  cta_shown_at: string | null;
  cta_clicked_at: string | null;
  cta_url: string | null;
}

// Calculate Domo Score based on data completeness
export function calculateDomoScore(
  contact: ContactInfo | null,
  productInterest: ProductInterestData | null,
  videoShowcase: VideoShowcaseData | null,
  ctaTracking: CtaTrackingData | null,
  perceptionAnalysis: any
): { score: number; maxScore: number; breakdown: { [key: string]: boolean } } {
  // Helper function to determine if perception analysis is valid
  function isValidPerceptionAnalysis(perceptionAnalysis: any): boolean {
    if (!perceptionAnalysis) return false;

    if (typeof perceptionAnalysis === 'string') {
      const analysis = perceptionAnalysis.trim().toLowerCase();
      if (analysis.length === 0) return false;
      
      const blackScreenIndicators = [
        'completely black', 'black screen', 'no visual', 'no details regarding',
        'no discernible visual', 'absence of visible content',
        'all visual inputs were consistently reported as completely black'
      ];
      
      const hasBlackScreenIndicator = blackScreenIndicators.some(indicator => 
        analysis.includes(indicator)
      );
      
      if (hasBlackScreenIndicator) return false;
      
      const visualIndicators = [
        'user', 'appearance', 'facial', 'expression', 'gesture', 'movement',
        'looking', 'speaking', 'engaged', 'focused', 'attentive', 'background',
        'setting', 'clothing', 'hair', 'eyes', 'mouth', 'hand', 'head',
        'body language', 'emotional state', 'behavior'
      ];
      
      return visualIndicators.some(indicator => analysis.includes(indicator));
    }
    
    if (typeof perceptionAnalysis === 'object') {
      return !!(
        perceptionAnalysis.overall_score ||
        perceptionAnalysis.engagement_score ||
        perceptionAnalysis.sentiment_score ||
        perceptionAnalysis.key_insights
      );
    }
    
    return false;
  }

  const breakdown = {
    contactConfirmation: !!(contact?.email || contact?.first_name || contact?.last_name),
    reasonForVisit: !!(productInterest?.primary_interest || (productInterest?.pain_points && productInterest.pain_points.length > 0)),
    platformFeatureInterest: !!(videoShowcase?.requested_videos && videoShowcase.requested_videos.length > 0) || 
                             !!(videoShowcase?.videos_shown && videoShowcase.videos_shown.length > 0),
    ctaExecution: !!(ctaTracking?.cta_clicked_at),
    perceptionAnalysis: isValidPerceptionAnalysis(perceptionAnalysis)
  };

  const score = Object.values(breakdown).filter(Boolean).length;
  const maxScore = 5;

  return { score, maxScore, breakdown };
}

export function DomoScoreCard({ 
  contact, 
  productInterest, 
  videoShowcase, 
  ctaTracking, 
  perceptionAnalysis 
}: { 
  contact: ContactInfo | null;
  productInterest: ProductInterestData | null;
  videoShowcase: VideoShowcaseData | null;
  ctaTracking: CtaTrackingData | null;
  perceptionAnalysis: any;
}) {
  const { score, maxScore, breakdown } = calculateDomoScore(
    contact, 
    productInterest, 
    videoShowcase, 
    ctaTracking, 
    perceptionAnalysis
  );

  const scorePercentage = (score / maxScore) * 100;
  const getScoreColor = (score: number) => {
    if (score >= 4) return 'text-green-600 bg-green-50 border-green-200';
    if (score >= 3) return 'text-blue-600 bg-blue-50 border-blue-200';
    if (score >= 2) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    return 'text-red-600 bg-red-50 border-red-200';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 4) return 'Excellent';
    if (score >= 3) return 'Good';
    if (score >= 2) return 'Fair';
    return 'Poor';
  };

  return (
    <div className={`p-4 border rounded-lg ${getScoreColor(score)}`}>
      <div className="flex items-center justify-between mb-4">
        <h5 className="font-medium flex items-center gap-2">
          🏆 Domo Score
        </h5>
        <div className="text-right">
          <div className="text-2xl font-bold">
            {score}/{maxScore}
          </div>
          <div className="text-sm font-medium">
            {getScoreLabel(score)}
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between text-sm">
          <span className="flex items-center gap-2">
            {breakdown.contactConfirmation ? '✅' : '❌'} Contact Confirmation
          </span>
          <span className="font-medium">
            {breakdown.contactConfirmation ? '1' : '0'} pt
          </span>
        </div>

        <div className="flex items-center justify-between text-sm">
          <span className="flex items-center gap-2">
            {breakdown.reasonForVisit ? '✅' : '❌'} Reason Why They Visited Site
          </span>
          <span className="font-medium">
            {breakdown.reasonForVisit ? '1' : '0'} pt
          </span>
        </div>

        <div className="flex items-center justify-between text-sm">
          <span className="flex items-center gap-2">
            {breakdown.platformFeatureInterest ? '✅' : '❌'} Platform Feature Most Interested In
          </span>
          <span className="font-medium">
            {breakdown.platformFeatureInterest ? '1' : '0'} pt
          </span>
        </div>

        <div className="flex items-center justify-between text-sm">
          <span className="flex items-center gap-2">
            {breakdown.ctaExecution ? '✅' : '❌'} CTA Execution
          </span>
          <span className="font-medium">
            {breakdown.ctaExecution ? '1' : '0'} pt
          </span>
        </div>

        <div className="flex items-center justify-between text-sm">
          <span className="flex items-center gap-2">
            {breakdown.perceptionAnalysis ? '✅' : '❌'} Visual Analysis
          </span>
          <span className="font-medium">
            {breakdown.perceptionAnalysis ? '1' : '0'} pt
          </span>
        </div>

        <div className="mt-4 pt-3 border-t">
          <div className="flex items-center justify-between text-sm font-medium">
            <span>Credibility Score:</span>
            <span>{scorePercentage.toFixed(0)}%</span>
          </div>
          <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
            <div 
              className={`h-2 rounded-full transition-all duration-300 ${
                score >= 4 ? 'bg-green-500' : 
                score >= 3 ? 'bg-blue-500' : 
                score >= 2 ? 'bg-yellow-500' : 'bg-red-500'
              }`}
              style={{ width: `${scorePercentage}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}