import React from 'react';
import { ConversationDetail, ConversationDataSets } from './types';
import { formatDate, getConversationDataFlags } from './utils';
import { ConversationDetails } from './ConversationDetails';

interface ConversationListProps {
  conversations: ConversationDetail[];
  dataSets: ConversationDataSets;
  expandedConversations: Set<string>;
  onToggleExpansion: (conversationId: string) => void;
}

export function ConversationList({
  conversations,
  dataSets,
  expandedConversations,
  onToggleExpansion
}: ConversationListProps) {
  if (conversations.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-500 mb-4">No conversations found</div>
        <div className="text-sm text-gray-400">
          Conversations will appear here once visitors interact with your demo
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {conversations.map((conversation) => {
        const isExpanded = expandedConversations.has(conversation.tavus_conversation_id);
        const dataFlags = getConversationDataFlags(
          conversation.tavus_conversation_id,
          dataSets.contactInfo,
          dataSets.productInterestData,
          dataSets.videoShowcaseData,
          dataSets.ctaTrackingData,
          conversation.perception_analysis
        );

        return (
          <div
            key={conversation.id}
            className="bg-white rounded-lg shadow border"
            data-testid="conversation-card"
          >
            {/* Conversation Header */}
            <div className="p-4">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900">
                    {conversation.conversation_name ||
                      `Conversation ${conversation.id.slice(0, 8)}`}
                  </h4>
                  <p className="text-sm text-gray-600 mb-3">
                    {formatDate(conversation.started_at)} •{" "}
                    {conversation.duration_seconds
                      ? Math.round(conversation.duration_seconds / 60)
                      : 0}
                    m
                  </p>
                  
                  {/* Data Tags */}
                  <ConversationTags dataFlags={dataFlags} />
                </div>
                
                <button
                  onClick={() =>
                    onToggleExpansion(conversation.tavus_conversation_id)
                  }
                  className="ml-4 text-blue-600 hover:text-blue-800 font-medium"
                >
                  {isExpanded ? "Collapse" : "Expand"}
                </button>
              </div>
            </div>

            {/* Expanded Details - Inline */}
            {isExpanded && (
              <div className="border-t bg-gray-50 p-6">
                <ConversationDetails
                  conversation={conversation}
                  dataSets={dataSets}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

interface ConversationTagsProps {
  dataFlags: {
    hasContact: boolean;
    hasProductInterest: boolean;
    hasVideoShowcase: boolean;
    hasCTA: boolean;
    hasPerception: boolean;
  };
}

function ConversationTags({ dataFlags }: ConversationTagsProps) {
  const { hasContact, hasProductInterest, hasVideoShowcase, hasCTA, hasPerception } = dataFlags;
  
  const hasAnyData = hasContact || hasProductInterest || hasVideoShowcase || hasCTA || hasPerception;

  return (
    <div className="flex flex-wrap gap-2">
      {hasContact && (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
          👤 Contact Info
        </span>
      )}
      {hasProductInterest && (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
          🎯 Product Interest
        </span>
      )}
      {hasVideoShowcase && (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
          🎬 Video Showcase
        </span>
      )}
      {hasCTA && (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
          🎯 CTA Tracking
        </span>
      )}
      {hasPerception && (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
          🧠 AI Analysis
        </span>
      )}
      {!hasAnyData && (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
          No data captured
        </span>
      )}
    </div>
  );
}