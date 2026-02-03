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
      className="max-h-72 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-domo-border scrollbar-track-transparent"
    >
      <ul className="space-y-2">
        <AnimatePresence initial={false}>
          {transcript.map((message) => (
            <motion.li
              key={message.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
              className="flex items-start gap-2"
            >
              {/* Bullet point */}
              <span
                className={`mt-1.5 w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                  message.role === 'user' ? 'bg-domo-primary' : 'bg-domo-text-secondary'
                }`}
              />

              {/* Message content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span
                    className={`text-xs font-medium ${
                      message.role === 'user' ? 'text-domo-primary' : 'text-domo-text-secondary'
                    }`}
                  >
                    {message.role === 'user' ? 'You' : 'Agent'}
                  </span>
                  <span className="text-[10px] text-domo-text-secondary/50">{formatTime(message.timestamp)}</span>
                </div>
                <p className="text-sm text-domo-text-primary leading-relaxed mt-0.5">{message.content}</p>
              </div>
            </motion.li>
          ))}
        </AnimatePresence>
      </ul>

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
