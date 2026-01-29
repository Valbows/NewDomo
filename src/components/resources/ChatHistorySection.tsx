'use client';

/**
 * ChatHistorySection Component
 *
 * Displays the conversation transcript with smooth message animations.
 * Shows messages with different styling for user vs agent.
 */

import { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { TranscriptMessage } from '@/components/conversation/types';

interface ChatHistorySectionProps {
  /** Transcript messages to display */
  transcript: TranscriptMessage[];
}

export function ChatHistorySection({ transcript }: ChatHistorySectionProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTo({
        top: containerRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  }, [transcript.length]);

  // Format timestamp
  const formatTime = (date: Date): string => {
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  // Empty state
  if (transcript.length === 0) {
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
      className="space-y-3 max-h-72 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-domo-border scrollbar-track-transparent"
    >
      <AnimatePresence initial={false}>
        {transcript.map((message, index) => (
          <motion.div
            key={message.id}
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
            className={`flex flex-col gap-1 ${message.role === 'user' ? 'items-end' : 'items-start'}`}
          >
            {/* Role label */}
            <div
              className={`flex items-center gap-1.5 text-[10px] uppercase tracking-wide font-medium ${
                message.role === 'user' ? 'text-domo-primary' : 'text-domo-text-secondary'
              }`}
            >
              {message.role === 'user' ? (
                <>
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    />
                  </svg>
                  You
                </>
              ) : (
                <>
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                    />
                  </svg>
                  Agent
                </>
              )}
            </div>

            {/* Message bubble */}
            <motion.div
              whileHover={{ scale: 1.01 }}
              className={`max-w-[95%] px-3 py-2 rounded-2xl text-sm leading-relaxed ${
                message.role === 'user'
                  ? 'bg-domo-primary text-white rounded-br-md'
                  : 'bg-domo-bg-dark text-domo-text-primary rounded-bl-md border border-domo-border/50'
              }`}
            >
              {message.content}
            </motion.div>

            {/* Timestamp */}
            <span className="text-[10px] text-domo-text-secondary/50 px-1">{formatTime(message.timestamp)}</span>
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Scroll indicator when there's more content */}
      {transcript.length > 3 && (
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
