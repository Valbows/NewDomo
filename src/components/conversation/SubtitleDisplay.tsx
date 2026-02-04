'use client';

/**
 * SubtitleDisplay Component
 *
 * Shows real-time subtitles/captions of the agent's speech.
 * Features:
 * - Splits long text into readable chunks
 * - Dynamic display duration based on text length
 * - Smooth fade transitions between chunks
 */

import { memo, useEffect, useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface SubtitleDisplayProps {
  /** The current subtitle text to display */
  text: string | null;
  /** Whether subtitles are visible */
  visible?: boolean;
}

// Configuration for subtitle display
const SUBTITLE_CONFIG = {
  /** Maximum characters per chunk */
  maxCharsPerChunk: 100,
  /** Minimum display time per chunk in ms */
  minDisplayTime: 2500,
  /** Additional time per word in ms */
  timePerWord: 150,
  /** Maximum display time per chunk in ms */
  maxDisplayTime: 6000,
  /** Delay before clearing after last chunk */
  clearDelay: 1500,
};

/**
 * Split text into readable chunks at sentence or phrase boundaries
 */
function splitIntoChunks(text: string): string[] {
  if (text.length <= SUBTITLE_CONFIG.maxCharsPerChunk) {
    return [text];
  }

  const chunks: string[] = [];

  // First, try to split by sentences (periods, question marks, exclamation marks)
  const sentences = text.split(/(?<=[.!?])\s+/);

  let currentChunk = '';

  for (const sentence of sentences) {
    // If adding this sentence exceeds max, save current and start new
    if (currentChunk && (currentChunk + ' ' + sentence).length > SUBTITLE_CONFIG.maxCharsPerChunk) {
      chunks.push(currentChunk.trim());
      currentChunk = sentence;
    } else if (sentence.length > SUBTITLE_CONFIG.maxCharsPerChunk) {
      // Sentence itself is too long, split by commas or dashes
      if (currentChunk) {
        chunks.push(currentChunk.trim());
        currentChunk = '';
      }

      const phrases = sentence.split(/(?<=[,;—–-])\s*/);
      for (const phrase of phrases) {
        if (currentChunk && (currentChunk + ' ' + phrase).length > SUBTITLE_CONFIG.maxCharsPerChunk) {
          chunks.push(currentChunk.trim());
          currentChunk = phrase;
        } else if (phrase.length > SUBTITLE_CONFIG.maxCharsPerChunk) {
          // Even phrase is too long, split by word count
          if (currentChunk) {
            chunks.push(currentChunk.trim());
            currentChunk = '';
          }
          const words = phrase.split(/\s+/);
          let wordChunk = '';
          for (const word of words) {
            if ((wordChunk + ' ' + word).length > SUBTITLE_CONFIG.maxCharsPerChunk) {
              if (wordChunk) chunks.push(wordChunk.trim());
              wordChunk = word;
            } else {
              wordChunk = wordChunk ? wordChunk + ' ' + word : word;
            }
          }
          if (wordChunk) currentChunk = wordChunk;
        } else {
          currentChunk = currentChunk ? currentChunk + ' ' + phrase : phrase;
        }
      }
    } else {
      currentChunk = currentChunk ? currentChunk + ' ' + sentence : sentence;
    }
  }

  if (currentChunk.trim()) {
    chunks.push(currentChunk.trim());
  }

  return chunks.length > 0 ? chunks : [text];
}

/**
 * Calculate display duration based on word count
 */
function calculateDisplayDuration(text: string): number {
  const wordCount = text.split(/\s+/).length;
  const duration = SUBTITLE_CONFIG.minDisplayTime + (wordCount * SUBTITLE_CONFIG.timePerWord);
  return Math.min(duration, SUBTITLE_CONFIG.maxDisplayTime);
}

export const SubtitleDisplay = memo(function SubtitleDisplay({
  text,
  visible = true,
}: SubtitleDisplayProps) {
  const [displayText, setDisplayText] = useState<string | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const chunksRef = useRef<string[]>([]);
  const currentChunkIndexRef = useRef(0);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const prevTextRef = useRef<string | null>(null);

  // Clear all timeouts
  const clearTimeouts = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  // Show next chunk in sequence
  const showNextChunk = useCallback(() => {
    const chunks = chunksRef.current;
    const index = currentChunkIndexRef.current;

    if (index < chunks.length) {
      const chunk = chunks[index];
      setIsTyping(false);
      setDisplayText(chunk);
      currentChunkIndexRef.current = index + 1;

      // Schedule next chunk or clear
      const duration = calculateDisplayDuration(chunk);
      timeoutRef.current = setTimeout(() => {
        if (currentChunkIndexRef.current < chunks.length) {
          showNextChunk();
        } else {
          // All chunks shown, clear after delay
          timeoutRef.current = setTimeout(() => {
            setDisplayText(null);
          }, SUBTITLE_CONFIG.clearDelay);
        }
      }, duration);
    }
  }, []);

  // Handle text updates
  useEffect(() => {
    if (!visible) {
      clearTimeouts();
      setDisplayText(null);
      return;
    }

    if (text !== prevTextRef.current) {
      prevTextRef.current = text;
      clearTimeouts();

      if (text) {
        // Split text into chunks
        chunksRef.current = splitIntoChunks(text);
        currentChunkIndexRef.current = 0;

        // Show typing indicator briefly, then start showing chunks
        setIsTyping(true);
        timeoutRef.current = setTimeout(() => {
          showNextChunk();
        }, 200);
      } else {
        // Text cleared externally
        timeoutRef.current = setTimeout(() => {
          setDisplayText(null);
        }, SUBTITLE_CONFIG.clearDelay);
      }
    }

    return clearTimeouts;
  }, [text, visible, clearTimeouts, showNextChunk]);

  if (!visible) {
    return null;
  }

  return (
    <div className="absolute bottom-4 sm:bottom-8 left-1/2 transform -translate-x-1/2 w-full max-w-[calc(100%-2rem)] sm:max-w-xl md:max-w-2xl px-2 sm:px-4 z-10">
      <AnimatePresence mode="wait">
        {(displayText || isTyping) && (
          <motion.div
            key={isTyping ? 'typing' : displayText}
            initial={{ opacity: 0, y: 10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -5, scale: 0.98 }}
            transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
            className="bg-black/75 backdrop-blur-md rounded-xl sm:rounded-2xl px-3 sm:px-6 py-2 sm:py-4 shadow-xl border border-white/5"
          >
            {isTyping ? (
              <div className="flex items-center justify-center gap-1.5">
                {[0, 1, 2].map((i) => (
                  <motion.span
                    key={i}
                    className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-white/70 rounded-full"
                    animate={{ opacity: [0.4, 1, 0.4], scale: [0.8, 1, 0.8] }}
                    transition={{
                      duration: 0.8,
                      repeat: Infinity,
                      delay: i * 0.15,
                    }}
                  />
                ))}
              </div>
            ) : (
              <motion.p
                className="text-white text-sm sm:text-base md:text-lg leading-relaxed text-center font-medium"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.15 }}
              >
                &ldquo;{displayText}&rdquo;
              </motion.p>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});
