'use client';

import React, { useEffect, useCallback, useState } from 'react';
import { useDaily, useMeetingState } from '@daily-co/daily-react';
import { Conversation } from '@/components/cvi/components/conversation';
import { parseToolCallFromEvent } from '@/lib/tools/toolParser';

interface TavusConversationCVIProps {
  conversationUrl: string;
  onLeave: () => void;
  onToolCall?: (toolName: string, args: any) => void;
  debugVideoTitles?: string[]; // dev-only helper to avoid typos
}

export const TavusConversationCVI: React.FC<TavusConversationCVIProps> = ({
  conversationUrl,
  onLeave,
  onToolCall,
  debugVideoTitles,
}) => {
  const daily = useDaily();
  const meetingState = useMeetingState();
  const [selectedTitle, setSelectedTitle] = useState<string>('');

  // Debug Daily instance and meeting state
  useEffect(() => {
    console.log('🔍 TavusConversationCVI Debug:');
    console.log('  - Daily instance:', daily ? 'Available' : 'Not available');
    console.log('  - Meeting state:', meetingState);
    console.log('  - Conversation URL:', conversationUrl);
  }, [daily, meetingState, conversationUrl]);

  // Set up tool call event listeners
  useEffect(() => {
    if (!daily || meetingState !== 'joined-meeting') return;

    console.log('🎯 Setting up tool call listeners for CVI');

    const handleAppMessage = (event: any) => {
      console.log('=== CVI APP MESSAGE RECEIVED ===');
      try {
        console.log('Full event (json):', JSON.stringify(event, null, 2));
      } catch {}
      const { data } = event || {};
      try {
        console.log('Event.data (json):', JSON.stringify(data, null, 2));
      } catch {}

      // Unified parsing using shared helper on multiple shapes
      let parsed = parseToolCallFromEvent(data);
      if (!parsed.toolName) parsed = parseToolCallFromEvent(event);

      console.log('Parsed tool call result:', parsed);

      if (parsed.toolName === 'fetch_video' && onToolCall) {
        if (!parsed.toolArgs) {
          console.warn('fetch_video detected but args missing/null; ignoring');
          return;
        }
        console.log('🎬 Triggering real-time video fetch (parsed):', parsed.toolArgs);
        onToolCall('fetch_video', parsed.toolArgs);
        return;
      }

      // Fallback: legacy direct fields if any
      if (data?.event_type === 'conversation_toolcall' || data?.type === 'tool_call') {
        const toolName = data.name || data.function?.name;
        const toolArgs = data.args || data.arguments;
        if (toolName === 'fetch_video' && onToolCall) {
          console.log('🎬 Triggering real-time video fetch (legacy fields):', toolArgs);
          onToolCall(toolName, toolArgs);
          return;
        }
      }

      // Transcript-based tool calls
      if (data?.transcript) {
        console.log('📝 Checking transcript for tool calls');
        const transcript = data.transcript;
        const toolCallMessages = transcript.filter((msg: any) =>
          msg.role === 'assistant' && msg.tool_calls && msg.tool_calls.length > 0
        );
        if (toolCallMessages.length > 0) {
          const lastToolCall = toolCallMessages[toolCallMessages.length - 1];
          const toolCall = lastToolCall.tool_calls[0];
          if (toolCall.function?.name === 'fetch_video' && onToolCall) {
            try {
              const args = JSON.parse(toolCall.function.arguments);
              console.log('🎬 Triggering real-time video from transcript:', args);
              onToolCall('fetch_video', args);
            } catch (error) {
              console.error('Error parsing tool call arguments:', error);
            }
          }
        }
      }
    };

    // Add event listener
    daily.on('app-message', handleAppMessage);

    // Cleanup
    return () => {
      daily.off('app-message', handleAppMessage);
    };
  }, [daily, meetingState, onToolCall]);

  return (
    <div className="w-full h-full">
      <Conversation 
        conversationUrl={conversationUrl}
        onLeave={onLeave}
      />
      
      {/* Manual test button for debugging */}
      {process.env.NODE_ENV === 'development' && (
        <div className="absolute top-4 right-4 z-50 flex items-center gap-2 bg-white/90 p-2 rounded shadow">
          {Array.isArray(debugVideoTitles) && debugVideoTitles.length > 0 ? (
            <>
              <select
                className="text-xs border rounded px-2 py-1 max-w-xs"
                value={selectedTitle}
                onChange={(e) => setSelectedTitle(e.target.value)}
                onFocus={() => {
                  // Default to first title if nothing selected
                  if (!selectedTitle && debugVideoTitles.length > 0) {
                    setSelectedTitle(debugVideoTitles[0]);
                  }
                }}
              >
                <option value="" disabled>
                  Select exact video title…
                </option>
                {debugVideoTitles.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
              <button
                onClick={() => {
                  if (selectedTitle && selectedTitle.trim()) {
                    console.log('Manual tool call test (dropdown) triggered:', selectedTitle);
                    onToolCall?.('fetch_video', { title: selectedTitle.trim() });
                  } else {
                    console.log('No title selected');
                  }
                }}
                className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 shadow"
              >
                Play
              </button>
            </>
          ) : (
            <button
              onClick={() => {
                console.log('Manual tool call test triggered');
                const title = window.prompt('Enter exact video title to fetch:');
                if (title && title.trim()) {
                  onToolCall?.('fetch_video', { title: title.trim() });
                } else {
                  console.log('Manual tool call cancelled: no title provided');
                }
              }}
              className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 shadow"
            >
              Test Tool Call
            </button>
          )}
        </div>
      )}
    </div>
  );
};
