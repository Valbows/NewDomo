'use client';

/**
 * CurrentTaskSection Component
 *
 * Displays the qualification progress and topics discussed with smooth animations.
 * Shows real-time updates as the AI agent collects information during the demo.
 */

import { motion, AnimatePresence } from 'framer-motion';
import type { QualificationFields } from '@/components/insights/QualificationChecklist';

interface CurrentTaskSectionProps {
  /** Qualification fields with captured status */
  qualificationFields: QualificationFields;
  /** Primary interest captured during conversation */
  primaryInterest: string | null;
  /** Pain points identified during conversation */
  painPoints: string[];
}

const fieldLabels: Record<string, string> = {
  firstName: 'First Name',
  lastName: 'Last Name',
  email: 'Email',
  position: 'Position',
};

export function CurrentTaskSection({
  qualificationFields,
  primaryInterest,
  painPoints,
}: CurrentTaskSectionProps) {
  // Calculate qualification progress
  const capturedCount = Object.values(qualificationFields).filter((f) => f.captured).length;
  const totalFields = Object.keys(qualificationFields).length;
  const progressPercent = (capturedCount / totalFields) * 100;

  const hasTopics = primaryInterest || painPoints.length > 0;
  const isEmpty = capturedCount === 0 && !hasTopics;

  // Empty state
  if (isEmpty) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex flex-col items-center justify-center py-6 text-center"
      >
        <motion.div
          className="w-16 h-16 rounded-2xl bg-domo-bg-elevated/50 flex items-center justify-center mb-3"
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ duration: 3, repeat: Infinity, delay: 0.5 }}
        >
          <svg className="w-8 h-8 text-domo-text-secondary/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
            />
          </svg>
        </motion.div>
        <p className="text-sm text-domo-text-secondary/70">Qualification progress</p>
        <p className="text-xs text-domo-text-secondary/50 mt-1">appears as you chat</p>
      </motion.div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Qualification Progress */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs text-domo-text-secondary uppercase tracking-wide font-medium">Qualification</span>
          <motion.span
            key={capturedCount}
            initial={{ scale: 1.2, color: 'var(--color-domo-primary)' }}
            animate={{ scale: 1, color: 'var(--color-domo-text-secondary)' }}
            className="text-xs"
          >
            {capturedCount}/{totalFields}
          </motion.span>
        </div>

        {/* Progress bar */}
        <div className="h-2 bg-domo-bg-elevated rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-domo-primary to-domo-secondary rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${progressPercent}%` }}
            transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
          />
        </div>

        {/* Field status list */}
        <div className="grid grid-cols-2 gap-2">
          {Object.entries(qualificationFields).map(([key, field], index) => (
            <motion.div
              key={key}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className={`flex items-center gap-2 px-2 py-1.5 rounded-lg transition-colors ${
                field.captured ? 'bg-domo-success/10' : 'bg-domo-bg-dark/30'
              }`}
            >
              <AnimatePresence mode="wait">
                {field.captured ? (
                  <motion.div
                    key="checked"
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    exit={{ scale: 0 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  >
                    <svg className="w-4 h-4 text-domo-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                  </motion.div>
                ) : (
                  <motion.div
                    key="unchecked"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                    className="w-4 h-4 rounded-full border-2 border-domo-text-secondary/30"
                  />
                )}
              </AnimatePresence>
              <span
                className={`text-xs truncate ${
                  field.captured ? 'text-domo-text-primary font-medium' : 'text-domo-text-secondary'
                }`}
              >
                {fieldLabels[key] || key}
              </span>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Topics Discussed */}
      <AnimatePresence>
        {hasTopics && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-2 overflow-hidden"
          >
            <span className="text-xs text-domo-text-secondary uppercase tracking-wide font-medium flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"
                />
              </svg>
              Topics
            </span>

            <div className="flex flex-wrap gap-1.5">
              {/* Primary Interest */}
              <AnimatePresence>
                {primaryInterest && (
                  <motion.span
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className="inline-flex items-center px-2.5 py-1 rounded-lg bg-domo-primary/20 text-domo-primary text-xs font-medium"
                  >
                    <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                    {primaryInterest}
                  </motion.span>
                )}
              </AnimatePresence>

              {/* Pain Points */}
              {painPoints.map((point, index) => (
                <motion.span
                  key={index}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.1 }}
                  className="inline-flex items-center px-2.5 py-1 rounded-lg bg-amber-500/20 text-amber-400 text-xs font-medium"
                >
                  {point}
                </motion.span>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
