import { Loader2, MessageSquare } from "lucide-react";
import {
  ConversationDetail,
  ContactInfo,
  ProductInterestData,
  VideoShowcaseData,
  CtaTrackingData,
} from "../types";
import { ConversationListItem } from "./ConversationListItem";

interface ConversationListProps {
  conversations: ConversationDetail[];
  contactInfo: Record<string, ContactInfo>;
  productInterestData: Record<string, ProductInterestData>;
  videoShowcaseData: Record<string, VideoShowcaseData>;
  ctaTrackingData: Record<string, CtaTrackingData>;
  loading: boolean;
  expandedConversation: string | null;
  onToggleExpand: (conversationId: string) => void;
  hasTavusConversation: boolean;
}

export function ConversationList({
  conversations,
  contactInfo,
  productInterestData,
  videoShowcaseData,
  ctaTrackingData,
  loading,
  expandedConversation,
  onToggleExpand,
  hasTavusConversation,
}: ConversationListProps) {
  return (
    <div className="bg-white rounded-lg shadow border border-gray-100">
      <div className="p-6 border-b border-gray-200">
        <h3 className="text-lg font-semibold">Conversation Details</h3>
        <p className="text-sm text-gray-600 mt-1">
          Detailed transcripts and perception analysis from Domo conversations.
        </p>
      </div>

      {loading ? (
        <div className="p-8 text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-indigo-600" />
          <div className="text-gray-600">Loading conversation details...</div>
        </div>
      ) : conversations.length === 0 ? (
        <div className="p-8 text-center">
          <MessageSquare className="w-12 h-12 mx-auto mb-4 text-gray-300" />
          <div className="text-gray-600 mb-2">No detailed conversations found</div>
          <div className="text-sm text-gray-500">
            {hasTavusConversation
              ? 'Click "Sync from Domo" to fetch conversation data'
              : "Start a demo conversation to see analytics here"}
          </div>
        </div>
      ) : (
        <div className="divide-y divide-gray-200">
          {conversations.map((conversation) => (
            <ConversationListItem
              key={conversation.id}
              conversation={conversation}
              contactInfo={contactInfo[conversation.tavus_conversation_id] || null}
              productInterest={productInterestData[conversation.tavus_conversation_id] || null}
              videoShowcase={videoShowcaseData[conversation.tavus_conversation_id] || null}
              ctaTracking={ctaTrackingData[conversation.tavus_conversation_id] || null}
              isExpanded={expandedConversation === conversation.id}
              onToggleExpand={() => onToggleExpand(conversation.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
