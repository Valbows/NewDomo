import {
  ContactInfo,
  ProductInterestData,
  VideoShowcaseData,
  CtaTrackingData,
} from "../../types";
import { calculateDomoScore, getScoreColor, getScoreLabel } from "../../utils/domo-score";

interface DomoScoreCardProps {
  contact: ContactInfo | null;
  productInterest: ProductInterestData | null;
  videoShowcase: VideoShowcaseData | null;
  ctaTracking: CtaTrackingData | null;
  perceptionAnalysis: any;
}

export function DomoScoreCard({
  contact,
  productInterest,
  videoShowcase,
  ctaTracking,
  perceptionAnalysis,
}: DomoScoreCardProps) {
  const { score, maxScore, breakdown } = calculateDomoScore(
    contact,
    productInterest,
    videoShowcase,
    ctaTracking,
    perceptionAnalysis
  );

  const scorePercentage = (score / maxScore) * 100;

  const getScoreColorClass = (score: number) => {
    if (score >= 4) return "bg-domo-success/10 border-domo-success/20 text-white";
    if (score >= 3) return "bg-domo-primary/10 border-domo-primary/20 text-white";
    if (score >= 2) return "bg-amber-500/10 border-amber-500/20 text-white";
    return "bg-domo-error/10 border-domo-error/20 text-white";
  };

  return (
    <div className={`p-4 border rounded-xl ${getScoreColorClass(score)}`}>
      <div className="flex items-center justify-between mb-4">
        <h5 className="font-medium flex items-center gap-2">🏆 Domo Score</h5>
        <div className="text-right">
          <div className="text-2xl font-bold">
            {score}/{maxScore}
          </div>
          <div className="text-sm font-medium text-domo-text-secondary">{getScoreLabel(score)}</div>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between text-sm">
          <span className="flex items-center gap-2 text-domo-text-secondary">
            {breakdown.contactConfirmation ? "✅" : "❌"} Contact Confirmation
          </span>
          <span className="font-medium">
            {breakdown.contactConfirmation ? "1" : "0"} pt
          </span>
        </div>

        <div className="flex items-center justify-between text-sm">
          <span className="flex items-center gap-2 text-domo-text-secondary">
            {breakdown.reasonForVisit ? "✅" : "❌"} Reason Why They Visited Site
          </span>
          <span className="font-medium">
            {breakdown.reasonForVisit ? "1" : "0"} pt
          </span>
        </div>

        <div className="flex items-center justify-between text-sm">
          <span className="flex items-center gap-2 text-domo-text-secondary">
            {breakdown.platformFeatureInterest ? "✅" : "❌"} Platform Feature Most
            Interested In
          </span>
          <span className="font-medium">
            {breakdown.platformFeatureInterest ? "1" : "0"} pt
          </span>
        </div>

        <div className="flex items-center justify-between text-sm">
          <span className="flex items-center gap-2 text-domo-text-secondary">
            {breakdown.ctaExecution ? "✅" : "❌"} CTA Execution
          </span>
          <span className="font-medium">
            {breakdown.ctaExecution ? "1" : "0"} pt
          </span>
        </div>

        <div className="flex items-center justify-between text-sm">
          <span className="flex items-center gap-2 text-domo-text-secondary">
            {breakdown.perceptionAnalysis ? "✅" : "❌"} Visual Analysis
          </span>
          <span className="font-medium">
            {breakdown.perceptionAnalysis ? "1" : "0"} pt
          </span>
        </div>

        <div className="mt-4 pt-3 border-t border-domo-border">
          <div className="flex items-center justify-between text-sm font-medium">
            <span className="text-domo-text-secondary">Credibility Score:</span>
            <span>{scorePercentage.toFixed(0)}%</span>
          </div>
          <div className="mt-2 w-full bg-domo-bg-dark rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all duration-300 ${
                score >= 4
                  ? "bg-domo-success"
                  : score >= 3
                  ? "bg-domo-primary"
                  : score >= 2
                  ? "bg-amber-500"
                  : "bg-domo-error"
              }`}
              style={{ width: `${scorePercentage}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
