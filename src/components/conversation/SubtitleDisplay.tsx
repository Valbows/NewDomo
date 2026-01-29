'use client';

/**
 * SubtitleDisplay Component
 *
 * Shows real-time subtitles/captions of the agent's speech.
 * Features smooth fade transitions and a typing indicator.
 */

import { memo, useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface SubtitleDisplayProps {
  /** The current subtitle text to display */
  text: string | null;
  /** Whether subtitles are visible */
  visible?: boolean;
}

export const SubtitleDisplay = memo(function SubtitleDisplay({
  text,
  visible = true,
}: SubtitleDisplayProps) {
  const [displayText, setDisplayText] = useState<string | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const prevTextRef = useRef<string | null>(null);

  // Handle text updates with smooth transitions
  useEffect(() => {
    if (!visible) {
      setDisplayText(null);
      return;
    }

    if (text !== prevTextRef.current) {
      prevTextRef.current = text;

      // Clear any existing timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      if (text) {
        // Show typing indicator briefly for new text
        if (text.length > (displayText?.length || 0) + 10) {
          setIsTyping(true);
          timeoutRef.current = setTimeout(() => {
            setIsTyping(false);
            setDisplayText(text);
          }, 150);
        } else {
          setDisplayText(text);
        }
      } else {
        // Fade out after a delay when text is cleared
        timeoutRef.current = setTimeout(() => {
          setDisplayText(null);
        }, 2000);
      }
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [text, visible, displayText?.length]);

  if (!visible) {
    return null;
  }

  return (
    <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 w-full max-w-2xl px-4 z-10">
      <AnimatePresence mode="wait">
        {(displayText || isTyping) && (
          <motion.div
            key={isTyping ? 'typing' : 'text'}
            initial={{ opacity: 0, y: 10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -5, scale: 0.98 }}
            transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
            className="bg-black/75 backdrop-blur-md rounded-2xl px-6 py-4 shadow-xl border border-white/5"
          >
            {isTyping ? (
              <div className="flex items-center justify-center gap-1.5">
                {[0, 1, 2].map((i) => (
                  <motion.span
                    key={i}
                    className="w-2 h-2 bg-white/70 rounded-full"
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
                className="text-white text-lg leading-relaxed text-center font-medium"
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
