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

  return (
    <div className={`p-4 border rounded-lg ${getScoreColor(score)}`}>
      <div className="flex items-center justify-between mb-4">
        <h5 className="font-medium flex items-center gap-2">🏆 Domo Score</h5>
        <div className="text-right">
          <div className="text-2xl font-bold">
            {score}/{maxScore}
          </div>
          <div className="text-sm font-medium">{getScoreLabel(score)}</div>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between text-sm">
          <span className="flex items-center gap-2">
            {breakdown.contactConfirmation ? "✅" : "❌"} Contact Confirmation
          </span>
          <span className="font-medium">
            {breakdown.contactConfirmation ? "1" : "0"} pt
          </span>
        </div>

        <div className="flex items-center justify-between text-sm">
          <span className="flex items-center gap-2">
            {breakdown.reasonForVisit ? "✅" : "❌"} Reason Why They Visited Site
          </span>
          <span className="font-medium">
            {breakdown.reasonForVisit ? "1" : "0"} pt
          </span>
        </div>

        <div className="flex items-center justify-between text-sm">
          <span className="flex items-center gap-2">
            {breakdown.platformFeatureInterest ? "✅" : "❌"} Platform Feature Most
            Interested In
          </span>
          <span className="font-medium">
            {breakdown.platformFeatureInterest ? "1" : "0"} pt
          </span>
        </div>

        <div className="flex items-center justify-between text-sm">
          <span className="flex items-center gap-2">
            {breakdown.ctaExecution ? "✅" : "❌"} CTA Execution
          </span>
          <span className="font-medium">
            {breakdown.ctaExecution ? "1" : "0"} pt
          </span>
        </div>

        <div className="flex items-center justify-between text-sm">
          <span className="flex items-center gap-2">
            {breakdown.perceptionAnalysis ? "✅" : "❌"} Visual Analysis
          </span>
          <span className="font-medium">
            {breakdown.perceptionAnalysis ? "1" : "0"} pt
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
                score >= 4
                  ? "bg-green-500"
                  : score >= 3
                  ? "bg-blue-500"
                  : score >= 2
                  ? "bg-yellow-500"
                  : "bg-red-500"
              }`}
              style={{ width: `${scorePercentage}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
