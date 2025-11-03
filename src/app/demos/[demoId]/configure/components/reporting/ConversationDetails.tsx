import React from 'react';
import { ConversationDetail, ConversationDataSets } from './types';
import { isValidPerceptionAnalysis } from './utils';
import { renderPerceptionAnalysis, renderTranscript } from './render-utils';
import { logTranscriptDiagnostic } from './transcript-diagnostics';
import {
  ContactInfoCard,
  ProductInterestCard,
  VideoShowcaseCard,
  CtaTrackingCard,
  DomoScoreCard,
} from './index';

interface ConversationDetailsProps {
  conversation: ConversationDetail;
  dataSets: ConversationDataSets;
}

export function ConversationDetails({ conversation, dataSets }: ConversationDetailsProps) {
  const { contactInfo, productInterestData, videoShowcaseData, ctaTrackingData } = dataSets;

  // Diagnostic logging for transcript issues
  if (process.env.NODE_ENV === 'development' && conversation.transcript) {
    logTranscriptDiagnostic(conversation.transcript, conversation.tavus_conversation_id);
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Left Column - Data Cards */}
      <div className="lg:col-span-2 space-y-6">
        <ContactInfoCard
          contact={
            contactInfo[conversation.tavus_conversation_id] || null
          }
        />

        <ProductInterestCard
          productInterest={
            productInterestData[conversation.tavus_conversation_id] ||
            null
          }
        />

        <VideoShowcaseCard
          videoShowcase={
            videoShowcaseData[conversation.tavus_conversation_id] ||
            null
          }
        />

        <CtaTrackingCard
          ctaTracking={
            ctaTrackingData[conversation.tavus_conversation_id] ||
            null
          }
        />

        {/* Perception Analysis */}
        {isValidPerceptionAnalysis(
          conversation.perception_analysis
        ) && (
          <div className="mb-6">
            <h5 className="font-medium text-gray-700 mb-3 flex items-center gap-2">
              🧠 Perception Analysis
            </h5>
            {renderPerceptionAnalysis(
              conversation.perception_analysis
            )}
          </div>
        )}

        {/* Transcript */}
        <div className="mb-6">
          <h5 className="font-medium text-gray-700 mb-3 flex items-center gap-2">
            💬 Conversation Transcript
          </h5>
          {conversation.transcript ? (
            <>
              {process.env.NODE_ENV === 'development' && (
                <div className="mb-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs">
                  <strong>Debug Info:</strong> Type: {typeof conversation.transcript}, 
                  String: {String(conversation.transcript).substring(0, 50)}
                  {String(conversation.transcript) === '[object Object]' && (
                    <span className="text-red-600 font-bold"> ⚠️ OBJECT DISPLAY ISSUE!</span>
                  )}
                </div>
              )}
              {renderTranscript(conversation.transcript)}
            </>
          ) : (
            <div className="text-sm text-gray-500 bg-gray-50 rounded p-4">
              No transcript available for this conversation
              {process.env.NODE_ENV === 'development' && (
                <div className="mt-2 text-xs">
                  Debug: transcript value = {JSON.stringify(conversation.transcript)}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Right Column - Domo Score */}
      <div className="lg:col-span-1">
        <div className="sticky top-4">
          <DomoScoreCard
            contact={
              contactInfo[conversation.tavus_conversation_id] || null
            }
            productInterest={
              productInterestData[
                conversation.tavus_conversation_id
              ] || null
            }
            videoShowcase={
              videoShowcaseData[conversation.tavus_conversation_id] ||
              null
            }
            ctaTracking={
              ctaTrackingData[conversation.tavus_conversation_id] ||
              null
            }
            perceptionAnalysis={conversation.perception_analysis}
          />
        </div>
      </div>
    </div>
  );
}