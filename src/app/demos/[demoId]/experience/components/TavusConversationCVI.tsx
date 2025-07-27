'use client';

import React, { useEffect, useCallback } from 'react';
import { useDaily, useMeetingState } from '@daily-co/daily-react';
import { Conversation } from '@/components/cvi/components/conversation';

interface TavusConversationCVIProps {
  conversationUrl: string;
  onLeave: () => void;
  onToolCall?: (toolName: string, args: any) => void;
}

export const TavusConversationCVI: React.FC<TavusConversationCVIProps> = ({
  conversationUrl,
  onLeave,
  onToolCall
}) => {
  const daily = useDaily();
  const meetingState = useMeetingState();

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
      console.log('Event data:', event.data);
      
      const { data } = event;
      
      // Check for different tool call event formats
      if (data?.event_type === 'conversation_toolcall' || data?.type === 'tool_call') {
        console.log('🎯 Real-time tool call detected:', data);
        
        const toolName = data.name || data.function?.name;
        const toolArgs = data.args || data.arguments;
        
        if (toolName === 'fetch_video' && onToolCall) {
          console.log('🎬 Triggering real-time video fetch:', toolArgs);
          onToolCall(toolName, toolArgs);
        }
      }
      
      // Check for tool calls in transcript format
      if (data?.transcript) {
        console.log('📝 Checking transcript for tool calls:', data.transcript);
        const transcript = data.transcript;
        
        // Find assistant messages with tool calls
        const toolCallMessages = transcript.filter((msg: any) => 
          msg.role === 'assistant' && msg.tool_calls && msg.tool_calls.length > 0
        );
        
        if (toolCallMessages.length > 0) {
          const lastToolCall = toolCallMessages[toolCallMessages.length - 1];
          const toolCall = lastToolCall.tool_calls[0];
          
          if (toolCall.function?.name === 'fetch_video' && onToolCall) {
            console.log('🎬 Found fetch_video in transcript:', toolCall.function);
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
        <div className="absolute top-4 right-4 z-50">
          <button
            onClick={() => {
              console.log('Manual tool call test triggered');
              onToolCall?.('fetch_video', { title: 'Fourth Video' });
            }}
            className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 shadow-lg"
          >
            Test Tool Call
          </button>
        </div>
      )}
    </div>
  );
};
