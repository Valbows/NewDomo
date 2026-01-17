import { Calendar, ChevronDown, ChevronUp, Clock } from "lucide-react";
import {
  ConversationDetail,
  ContactInfo,
  ProductInterestData,
  VideoShowcaseData,
  CtaTrackingData,
} from "../types";
import { formatDate, formatDuration } from "../utils/formatters";
import { calculateDomoScore } from "../utils/domo-score";
import { renderTranscript, renderPerceptionAnalysis } from "../utils/renderers";
import { ContactInfoCard } from "./data-cards/ContactInfoCard";
import { ProductInterestCard } from "./data-cards/ProductInterestCard";
import { VideoShowcaseCard } from "./data-cards/VideoShowcaseCard";
import { CtaTrackingCard } from "./data-cards/CtaTrackingCard";
import { DomoScoreCard } from "./data-cards/DomoScoreCard";

interface ConversationListItemProps {
  conversation: ConversationDetail;
  contactInfo: ContactInfo | null;
  productInterest: ProductInterestData | null;
  videoShowcase: VideoShowcaseData | null;
  ctaTracking: CtaTrackingData | null;
  isExpanded: boolean;
  onToggleExpand: () => void;
}

export function ConversationListItem({
  conversation,
  contactInfo,
  productInterest,
  videoShowcase,
  ctaTracking,
  isExpanded,
  onToggleExpand,
}: ConversationListItemProps) {
  const { score, breakdown } = calculateDomoScore(
    contactInfo,
    productInterest,
    videoShowcase,
    ctaTracking,
    conversation.perception_analysis
  );

  const getScoreColor = (score: number) => {
    if (score >= 4) return "bg-domo-success/10 text-domo-success border border-domo-success/20";
    if (score >= 3) return "bg-domo-primary/10 text-domo-primary border border-domo-primary/20";
    if (score >= 2) return "bg-amber-500/10 text-amber-400 border border-amber-500/20";
    return "bg-domo-error/10 text-domo-error border border-domo-error/20";
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-4">
          <div>
            <h4 className="font-medium text-white">{conversation.conversation_name}</h4>
            <div className="text-sm text-domo-text-muted">
              ID: {conversation.tavus_conversation_id}
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <div
              className={`px-2 py-1 text-xs font-medium rounded-full ${
                conversation.status === "completed"
                  ? "bg-domo-success/10 text-domo-success border border-domo-success/20"
                  : conversation.status === "active"
                  ? "bg-domo-primary/10 text-domo-primary border border-domo-primary/20"
                  : "bg-domo-bg-elevated text-domo-text-secondary border border-domo-border"
              }`}
            >
              {conversation.status}
            </div>
            {breakdown.contactConfirmation && (
              <div className="px-2 py-1 text-xs font-medium rounded-full bg-domo-primary/10 text-domo-primary border border-domo-primary/20">
                👤 Contact Info
              </div>
            )}
            {breakdown.reasonForVisit && (
              <div className="px-2 py-1 text-xs font-medium rounded-full bg-domo-success/10 text-domo-success border border-domo-success/20">
                🎯 Interest Data
              </div>
            )}
            {breakdown.platformFeatureInterest && (
              <div className="px-2 py-1 text-xs font-medium rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20">
                🎬 Video Data
              </div>
            )}
            {breakdown.perceptionAnalysis && (
              <div className="px-2 py-1 text-xs font-medium rounded-full bg-domo-secondary/10 text-domo-secondary border border-domo-secondary/20">
                🧠 Visual Analysis
              </div>
            )}
            {breakdown.ctaExecution && (
              <div className="px-2 py-1 text-xs font-medium rounded-full bg-domo-success/10 text-domo-success border border-domo-success/20">
                🎯 CTA Clicked
              </div>
            )}
            {!breakdown.ctaExecution && ctaTracking?.cta_shown_at && (
              <div className="px-2 py-1 text-xs font-medium rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
                🎯 CTA Shown
              </div>
            )}
            <div className={`px-2 py-1 text-xs font-medium rounded-full ${getScoreColor(score)}`}>
              🏆 {score}/5
            </div>
          </div>
        </div>
        <div className="flex items-center gap-4 text-sm text-domo-text-secondary">
          {conversation.duration_seconds && (
            <div className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              {formatDuration(conversation.duration_seconds)}
            </div>
          )}
          {(conversation.completed_at || conversation.created_at) && (
            <div className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              {formatDate(conversation.completed_at || conversation.created_at)}
            </div>
          )}
          <button
            onClick={onToggleExpand}
            className="flex items-center gap-1 text-domo-primary hover:text-domo-secondary transition-colors"
          >
            {isExpanded ? (
              <>
                <ChevronUp className="w-4 h-4" /> Collapse
              </>
            ) : (
              <>
                <ChevronDown className="w-4 h-4" /> Expand
              </>
            )}
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Data Cards */}
          <div className="lg:col-span-2 space-y-6">
            {/* Contact Information */}
            <ContactInfoCard contact={contactInfo} />

            {/* Product Interest Data */}
            <ProductInterestCard productInterest={productInterest} />

            {/* Video Showcase Data */}
            <VideoShowcaseCard videoShowcase={videoShowcase} />

            {/* CTA Tracking Data */}
            <CtaTrackingCard ctaTracking={ctaTracking} />

            {/* Perception Analysis */}
            {conversation.perception_analysis && (
              <div>
                <h5 className="font-medium text-white mb-3">Perception Analysis</h5>
                {renderPerceptionAnalysis(conversation.perception_analysis)}
              </div>
            )}

            {/* Transcript */}
            {conversation.transcript && (
              <div>
                <h5 className="font-medium text-white mb-3">Conversation Transcript</h5>
                {renderTranscript(conversation.transcript)}
              </div>
            )}

            {!conversation.perception_analysis && !conversation.transcript && (
              <div className="text-sm text-domo-text-muted bg-domo-bg-elevated rounded-lg p-4 border border-domo-border">
                No detailed data available for this conversation. Click "Fetch Missing Analysis" above to retrieve it.
              </div>
            )}
          </div>

          {/* Right Column - Domo Score */}
          <div className="lg:col-span-1">
            <div className="sticky top-4">
              <DomoScoreCard
                contact={contactInfo}
                productInterest={productInterest}
                videoShowcase={videoShowcase}
                ctaTracking={ctaTracking}
                perceptionAnalysis={conversation.perception_analysis}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
