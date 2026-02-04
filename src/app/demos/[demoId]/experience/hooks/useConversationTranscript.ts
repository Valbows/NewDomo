'use client';

/**
 * useConversationTranscript Hook
 *
 * Manages conversation transcript state from Daily app-message events.
 * Parses transcript data and provides:
 * - Real-time transcript messages
 * - Current subtitle text (last assistant message)
 * - Methods to add messages
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { useDaily, useDailyEvent } from '@daily-co/daily-react';
import type { TranscriptMessage } from '@/components/conversation/types';

interface UseConversationTranscriptReturn {
  /** Array of all transcript messages */
  transcript: TranscriptMessage[];
  /** Current subtitle text (latest partial or complete agent speech) */
  currentSubtitle: string | null;
  /** Add a user message to the transcript */
  addUserMessage: (content: string) => void;
  /** Clear the transcript */
  clearTranscript: () => void;
}

export function useConversationTranscript(): UseConversationTranscriptReturn {
  const [transcript, setTranscript] = useState<TranscriptMessage[]>([]);
  const [currentSubtitle, setCurrentSubtitle] = useState<string | null>(null);
  const daily = useDaily();
  const lastProcessedRef = useRef<string>('');

  // Parse transcript from Daily app-message events
  useDailyEvent('app-message', (event) => {
    const { data } = event || {};

    // Handle transcript array from app-message
    if (data?.transcript && Array.isArray(data.transcript)) {
      const messages: TranscriptMessage[] = [];

      data.transcript.forEach((msg: any, index: number) => {
        // Skip tool calls and system messages
        if (msg.tool_calls || msg.role === 'system') return;

        // Only process user and assistant messages with content
        if ((msg.role === 'user' || msg.role === 'assistant') && msg.content) {
          messages.push({
            id: `${msg.role}-${index}-${Date.now()}`,
            role: msg.role,
            content: typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content),
            timestamp: new Date(),
          });
        }
      });

      // Deduplicate and update transcript
      if (messages.length > 0) {
        const lastMsgContent = messages[messages.length - 1].content;

        // Only update if we have new content
        if (lastMsgContent !== lastProcessedRef.current) {
          lastProcessedRef.current = lastMsgContent;

          setTranscript((prev) => {
            // Find messages that are actually new
            const existingContents = new Set(prev.map((m) => m.content));
            const newMessages = messages.filter((m) => !existingContents.has(m.content));

            if (newMessages.length === 0) return prev;
            return [...prev, ...newMessages];
          });

          // Update subtitle with latest assistant message
          const lastAssistantMsg = messages.filter((m) => m.role === 'assistant').pop();
          if (lastAssistantMsg) {
            setCurrentSubtitle(lastAssistantMsg.content);
          }
        }
      }
    }

    // Handle partial transcript/speech updates (real-time captions)
    if (data?.partial_transcript || data?.speech) {
      const partialText = data.partial_transcript || data.speech;
      if (partialText && typeof partialText === 'string') {
        setCurrentSubtitle(partialText);
      }
    }
  });

  // Add a user message manually (from text input)
  const addUserMessage = useCallback((content: string) => {
    const message: TranscriptMessage = {
      id: `user-manual-${Date.now()}`,
      role: 'user',
      content,
      timestamp: new Date(),
    };

    setTranscript((prev) => [...prev, message]);

    // Send to Daily if available
    if (daily) {
      try {
        daily.sendAppMessage({ type: 'user_message', content }, '*');
      } catch (error) {
        if (process.env.NODE_ENV !== 'production') {
          console.log('Failed to send app message:', error);
        }
      }
    }
  }, [daily]);

  // Clear transcript
  const clearTranscript = useCallback(() => {
    setTranscript([]);
    setCurrentSubtitle(null);
    lastProcessedRef.current = '';
  }, []);

  // Clear subtitle after a delay when agent stops speaking
  useEffect(() => {
    if (!currentSubtitle) return;

    const timer = setTimeout(() => {
      // Don't clear if it's still the active subtitle
      // This gives time for the user to read
    }, 5000);

    return () => clearTimeout(timer);
  }, [currentSubtitle]);

  return {
    transcript,
    currentSubtitle,
    addUserMessage,
    clearTranscript,
  };
}
