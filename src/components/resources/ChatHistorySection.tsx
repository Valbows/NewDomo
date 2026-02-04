'use client';

/**
 * ChatHistorySection Component
 *
 * Displays the conversation transcript with real-time agent speech.
 * Features:
 * - Smooth message animations
 * - Real-time agent typing indicator with current speech
 * - Different styling for user vs agent messages
 */

import { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { TranscriptMessage } from '@/components/conversation/types';

interface ChatHistorySectionProps {
  /** Transcript messages to display */
  transcript: TranscriptMessage[];
  /** Current real-time subtitle from agent speech */
  currentSubtitle?: string | null;
}

export function ChatHistorySection({ transcript, currentSubtitle }: ChatHistorySectionProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive or subtitle changes
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTo({
        top: containerRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  }, [transcript.length, currentSubtitle]);

  // Format timestamp
  const formatTime = (date: Date): string => {
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  // Empty state (only show if no transcript AND no current subtitle)
  if (transcript.length === 0 && !currentSubtitle) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex flex-col items-center justify-center py-6 text-center"
      >
        <motion.div
          className="w-16 h-16 rounded-2xl bg-domo-bg-elevated/50 flex items-center justify-center mb-3"
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ duration: 3, repeat: Infinity, delay: 1 }}
        >
          <svg className="w-8 h-8 text-domo-text-secondary/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
            />
          </svg>
        </motion.div>
        <p className="text-sm text-domo-text-secondary/70">Conversation transcript</p>
        <p className="text-xs text-domo-text-secondary/50 mt-1">will appear here</p>
      </motion.div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="max-h-96 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-domo-border scrollbar-track-transparent"
    >
      <div className="space-y-3">
        <AnimatePresence initial={false}>
          {/* Transcript messages */}
          {transcript.map((message) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl px-3 py-2 ${
                  message.role === 'user'
                    ? 'bg-domo-primary text-white rounded-br-md'
                    : 'bg-domo-bg-elevated text-domo-text-primary rounded-bl-md'
                }`}
              >
                <p className="text-sm leading-relaxed">{message.content}</p>
                <p
                  className={`text-[10px] mt-1 ${
                    message.role === 'user' ? 'text-white/60' : 'text-domo-text-secondary/50'
                  }`}
                >
                  {formatTime(message.timestamp)}
                </p>
              </div>
            </motion.div>
          ))}

          {/* Real-time agent speech (current subtitle) */}
          {currentSubtitle && (
            <motion.div
              key="current-subtitle"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
              className="flex justify-start"
            >
              <div className="max-w-[85%] rounded-2xl px-3 py-2 bg-domo-bg-elevated border border-domo-primary/30 rounded-bl-md">
                {/* Typing indicator dots */}
                <div className="flex items-center gap-1 mb-1">
                  <motion.span
                    className="w-1.5 h-1.5 bg-domo-primary rounded-full"
                    animate={{ opacity: [0.3, 1, 0.3] }}
                    transition={{ duration: 1, repeat: Infinity, delay: 0 }}
                  />
                  <motion.span
                    className="w-1.5 h-1.5 bg-domo-primary rounded-full"
                    animate={{ opacity: [0.3, 1, 0.3] }}
                    transition={{ duration: 1, repeat: Infinity, delay: 0.2 }}
                  />
                  <motion.span
                    className="w-1.5 h-1.5 bg-domo-primary rounded-full"
                    animate={{ opacity: [0.3, 1, 0.3] }}
                    transition={{ duration: 1, repeat: Infinity, delay: 0.4 }}
                  />
                  <span className="text-[10px] text-domo-primary ml-1 font-medium">Speaking</span>
                </div>
                <p className="text-sm leading-relaxed text-domo-text-primary">{currentSubtitle}</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Scroll indicator when there's more content */}
      {(transcript.length > 3 || currentSubtitle) && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="sticky bottom-0 flex justify-center pt-2 bg-gradient-to-t from-domo-bg-card to-transparent"
        >
          <motion.div
            animate={{ y: [0, 3, 0] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="text-domo-text-secondary/30"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}
