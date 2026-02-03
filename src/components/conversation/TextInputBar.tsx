'use client';

/**
 * TextInputBar Component
 *
 * Bottom input bar for the demo experience with smooth animations.
 * Features:
 * - End call button
 * - Animated send button
 * - Mic toggle with visual feedback
 * - Focus states with glow effects
 */

import { useState, useCallback, useRef, useEffect, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface TextInputBarProps {
  /** Callback when a message is sent */
  onSendMessage?: (message: string) => void;
  /** Callback when mic button is clicked */
  onMicToggle?: () => void;
  /** Callback when end call button is clicked */
  onEndCall?: () => void;
  /** Whether the mic is currently active */
  isMicActive?: boolean;
  /** Whether input is disabled */
  disabled?: boolean;
  /** Placeholder text */
  placeholder?: string;
}

export const TextInputBar = memo(function TextInputBar({
  onSendMessage,
  onMicToggle,
  onEndCall,
  isMicActive = false,
  disabled = false,
  placeholder = 'Ask the agent a question...',
}: TextInputBarProps) {
  const [message, setMessage] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Handle send message
  const handleSend = useCallback(() => {
    const trimmedMessage = message.trim();
    if (trimmedMessage && onSendMessage) {
      onSendMessage(trimmedMessage);
      setMessage('');
    }
  }, [message, onSendMessage]);

  // Handle keyboard events
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend]
  );

  const hasMessage = message.trim().length > 0;

  return (
    <motion.div
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
      className="bg-domo-bg-card border-t border-domo-border px-2 sm:px-4 py-3 sm:py-4"
    >
      <div className="max-w-4xl mx-auto flex items-center gap-2 sm:gap-3">
        {/* End Call button */}
        {onEndCall && (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onEndCall}
            className="p-2.5 sm:p-3 rounded-full bg-red-500 hover:bg-red-600 text-white transition-colors shadow-lg flex-shrink-0"
            title="End call"
          >
            <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M16 8l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M5 3a2 2 0 00-2 2v1c0 8.284 6.716 15 15 15h1a2 2 0 002-2v-3.28a1 1 0 00-.684-.948l-4.493-1.498a1 1 0 00-1.21.502l-1.13 2.257a11.042 11.042 0 01-5.516-5.517l2.257-1.128a1 1 0 00.502-1.21L9.228 3.683A1 1 0 008.279 3H5z"
              />
            </svg>
          </motion.button>
        )}

        {/* Text input */}
        <div className="flex-1 relative">
          {/* Focus glow effect */}
          <AnimatePresence>
            {isFocused && (
              <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.2 }}
                className="absolute inset-0 rounded-full bg-domo-primary/10 blur-xl -z-10"
              />
            )}
          </AnimatePresence>

          <input
            ref={inputRef}
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder={placeholder}
            disabled={disabled}
            className={`w-full px-3 sm:px-5 py-3 sm:py-3.5 bg-domo-bg-dark border-2 rounded-full text-sm sm:text-base text-domo-text-primary placeholder-domo-text-secondary/60 transition-all duration-200 ${
              isFocused
                ? 'border-domo-primary shadow-lg shadow-domo-primary/10'
                : 'border-domo-border hover:border-domo-border/80'
            } ${disabled ? 'opacity-50 cursor-not-allowed' : ''} focus:outline-none`}
          />

          {/* Typing indicator inside input */}
          <AnimatePresence>
            {hasMessage && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.15 }}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 text-xs text-domo-text-secondary"
              >
                Press Enter
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Microphone button - simplified, no CSS variable animations */}
        <button
          onClick={onMicToggle}
          disabled={disabled}
          className={`relative p-2.5 sm:p-3.5 rounded-full transition-all duration-300 flex-shrink-0 ${
            isMicActive
              ? 'bg-domo-primary text-white shadow-lg shadow-domo-primary/30'
              : 'bg-domo-bg-elevated text-domo-text-secondary hover:text-domo-text-primary hover:bg-domo-border'
          } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
          title={isMicActive ? 'Mute microphone' : 'Unmute microphone'}
        >
          {isMicActive ? (
            <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
              />
            </svg>
          ) : (
            <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
              />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3l18 18" />
            </svg>
          )}

          {/* Active pulse ring */}
          {isMicActive && (
            <span className="absolute inset-0 rounded-full border-2 border-domo-primary animate-ping opacity-30" />
          )}
        </button>

        {/* Send button - simplified, no CSS variable animations */}
        <motion.button
          whileHover={hasMessage ? { scale: 1.05 } : {}}
          whileTap={hasMessage ? { scale: 0.95 } : {}}
          onClick={handleSend}
          disabled={disabled || !hasMessage}
          className={`p-2.5 sm:p-3.5 rounded-full transition-all duration-200 flex-shrink-0 ${
            hasMessage
              ? 'bg-domo-primary text-white hover:bg-domo-secondary shadow-lg shadow-domo-primary/30'
              : 'bg-domo-bg-elevated text-domo-text-secondary opacity-50'
          } ${disabled || !hasMessage ? 'cursor-not-allowed' : ''}`}
          title="Send message"
        >
          <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
          </svg>
        </motion.button>
      </div>

      {/* Voice mode hint */}
      <p className="text-center text-[10px] sm:text-xs text-domo-text-secondary/50 mt-1.5 sm:mt-2">
        Speak to the agent or type your question
      </p>
    </motion.div>
  );
});
