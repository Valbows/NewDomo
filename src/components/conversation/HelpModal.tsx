'use client';

/**
 * HelpModal Component
 *
 * Beautiful help overlay with tips, keyboard shortcuts, and guidance.
 * Uses Framer Motion for smooth animations.
 */

import { memo, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
  agentName?: string;
}

const helpSections = [
  {
    title: 'Getting Started',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
    items: [
      'Speak naturally to the AI agent',
      'Ask questions about the demo',
      'Request to see specific features',
    ],
  },
  {
    title: 'Voice Controls',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
      </svg>
    ),
    items: [
      'Click the mic button to mute/unmute',
      'The agent will pause when you speak',
      'Speak clearly for best results',
    ],
  },
  {
    title: 'Video Demos',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
      </svg>
    ),
    items: [
      'Ask to see product features',
      'Use the X button to close videos',
      'Videos play with agent narration',
    ],
  },
  {
    title: 'Tips',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
      </svg>
    ),
    items: [
      'Be specific about what you want to see',
      'Ask follow-up questions anytime',
      'Share your name for a personalized experience',
    ],
  },
];

const keyboardShortcuts = [
  { key: 'Esc', description: 'Close this help' },
  { key: 'Enter', description: 'Send message' },
  { key: 'M', description: 'Toggle microphone' },
];

export const HelpModal = memo(function HelpModal({ isOpen, onClose, agentName }: HelpModalProps) {
  // Handle escape key
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    },
    [onClose]
  );

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, handleKeyDown]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
            className="fixed inset-0 flex items-center justify-center z-50 p-3 sm:p-4 pointer-events-none"
          >
            <div
              className="bg-domo-bg-card border border-domo-border rounded-xl sm:rounded-2xl shadow-2xl max-w-[calc(100%-1.5rem)] sm:max-w-md md:max-w-lg w-full max-h-[85vh] overflow-hidden pointer-events-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between p-4 sm:p-5 border-b border-domo-border">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-domo-primary/20 flex items-center justify-center flex-shrink-0">
                    <svg className="w-4 h-4 sm:w-5 sm:h-5 text-domo-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                  <div className="min-w-0">
                    <h2 className="text-base sm:text-lg font-semibold text-domo-text-primary truncate">How to use this demo</h2>
                    <p className="text-xs sm:text-sm text-domo-text-secondary truncate">
                      {agentName ? `Chat with ${agentName}` : 'Interactive AI demo guide'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 rounded-full hover:bg-domo-bg-elevated text-domo-text-secondary hover:text-domo-text-primary transition-colors flex-shrink-0"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Content */}
              <div className="p-4 sm:p-5 overflow-y-auto max-h-[55vh] sm:max-h-[60vh] space-y-4 sm:space-y-5">
                {/* Help sections */}
                {helpSections.map((section, sectionIndex) => (
                  <motion.div
                    key={section.title}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: sectionIndex * 0.1 }}
                    className="space-y-2"
                  >
                    <div className="flex items-center gap-2 text-domo-text-primary">
                      <span className="text-domo-primary">{section.icon}</span>
                      <h3 className="font-medium">{section.title}</h3>
                    </div>
                    <ul className="space-y-1.5 ml-7">
                      {section.items.map((item, itemIndex) => (
                        <motion.li
                          key={itemIndex}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: sectionIndex * 0.1 + itemIndex * 0.05 }}
                          className="text-sm text-domo-text-secondary flex items-start gap-2"
                        >
                          <span className="text-domo-primary mt-1.5 flex-shrink-0">
                            <svg className="w-1.5 h-1.5" fill="currentColor" viewBox="0 0 8 8">
                              <circle cx="4" cy="4" r="4" />
                            </svg>
                          </span>
                          {item}
                        </motion.li>
                      ))}
                    </ul>
                  </motion.div>
                ))}

                {/* Keyboard shortcuts */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="pt-4 border-t border-domo-border"
                >
                  <h3 className="text-sm font-medium text-domo-text-primary mb-3">Keyboard Shortcuts</h3>
                  <div className="flex flex-wrap gap-3">
                    {keyboardShortcuts.map((shortcut) => (
                      <div key={shortcut.key} className="flex items-center gap-2">
                        <kbd className="px-2 py-1 bg-domo-bg-elevated border border-domo-border rounded text-xs font-mono text-domo-text-primary">
                          {shortcut.key}
                        </kbd>
                        <span className="text-xs text-domo-text-secondary">{shortcut.description}</span>
                      </div>
                    ))}
                  </div>
                </motion.div>
              </div>

              {/* Footer */}
              <div className="p-3 sm:p-4 border-t border-domo-border bg-domo-bg-elevated/50">
                <button
                  onClick={onClose}
                  className="w-full py-3 sm:py-2.5 bg-domo-primary hover:bg-domo-secondary text-white rounded-lg font-medium transition-colors text-sm sm:text-base"
                >
                  Got it, let's start!
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
});
