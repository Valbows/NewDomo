import { Calendar, ChevronDown, ChevronUp, Clock } from "lucide-react";
import {
  ConversationDetail,
  ContactInfo,
  ProductInterestData,
  VideoShowcaseData,
  CtaTrackingData,
} from "../types";
import { formatDate, formatDuration } from "../utils/formatters";
import { calculateDomoScore, isValidPerceptionAnalysis } from "../utils/domo-score";
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
  const { score } = calculateDomoScore(
    contactInfo,
    productInterest,
    videoShowcase,
    ctaTracking,
    conversation.perception_analysis
  );

  const getScoreColor = (score: number) => {
    if (score >= 4) return "bg-green-100 text-green-800";
    if (score >= 3) return "bg-blue-100 text-blue-800";
    if (score >= 2) return "bg-yellow-100 text-yellow-800";
    return "bg-red-100 text-red-800";
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-4">
          <div>
            <h4 className="font-medium text-gray-900">{conversation.conversation_name}</h4>
            <div className="text-sm text-gray-500">
              ID: {conversation.tavus_conversation_id}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div
              className={`px-2 py-1 text-xs font-medium rounded-full ${
                conversation.status === "completed"
                  ? "bg-green-100 text-green-800"
                  : conversation.status === "active"
                  ? "bg-blue-100 text-blue-800"
                  : "bg-gray-100 text-gray-800"
              }`}
            >
              {conversation.status}
            </div>
            {contactInfo && (
              <div className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                👤 Contact Info
              </div>
            )}
            {productInterest && (
              <div className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                🎯 Interest Data
              </div>
            )}
            {videoShowcase && (
              <div className="px-2 py-1 text-xs font-medium rounded-full bg-purple-100 text-purple-800">
                🎬 Video Data
              </div>
            )}
            {conversation.perception_analysis &&
              isValidPerceptionAnalysis(conversation.perception_analysis) && (
                <div className="px-2 py-1 text-xs font-medium rounded-full bg-indigo-100 text-indigo-800">
                  🧠 Visual Analysis
                </div>
              )}
            {ctaTracking && (
              <div
                className={`px-2 py-1 text-xs font-medium rounded-full ${
                  ctaTracking.cta_clicked_at
                    ? "bg-green-100 text-green-800"
                    : ctaTracking.cta_shown_at
                    ? "bg-yellow-100 text-yellow-800"
                    : "bg-gray-100 text-gray-800"
                }`}
              >
                🎯 CTA {ctaTracking.cta_clicked_at ? "Clicked" : "Shown"}
              </div>
            )}
            <div className={`px-2 py-1 text-xs font-medium rounded-full ${getScoreColor(score)}`}>
              🏆 {score}/5
            </div>
          </div>
        </div>
        <div className="flex items-center gap-4 text-sm text-gray-500">
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
            className="flex items-center gap-1 text-indigo-600 hover:text-indigo-800"
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
                <h5 className="font-medium text-gray-900 mb-3">Perception Analysis</h5>
                {renderPerceptionAnalysis(conversation.perception_analysis)}
              </div>
            )}

            {/* Transcript */}
            {conversation.transcript && (
              <div>
                <h5 className="font-medium text-gray-900 mb-3">Conversation Transcript</h5>
                {renderTranscript(conversation.transcript)}
              </div>
            )}

            {!conversation.perception_analysis && !conversation.transcript && (
              <div className="text-sm text-gray-500 bg-gray-50 rounded p-4">
                No detailed data available for this conversation. Try syncing again later.
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
