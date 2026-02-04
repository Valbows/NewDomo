'use client';

/**
 * CurrentTaskSection Component
 *
 * Displays the qualification progress and topics discussed with smooth animations.
 * Shows real-time updates as the AI agent collects information during the demo.
 * Now displays captured values (name, email, position) when available.
 */

import { motion, AnimatePresence } from 'framer-motion';
import type { QualificationFields } from '@/components/insights/QualificationChecklist';

interface CurrentTaskSectionProps {
  /** Qualification fields with captured status and values */
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

const fieldIcons: Record<string, React.ReactNode> = {
  firstName: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  ),
  lastName: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  ),
  email: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
  ),
  position: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
  ),
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
        <p className="text-sm text-domo-text-secondary/70">Contact information</p>
        <p className="text-xs text-domo-text-secondary/50 mt-1">will appear as captured</p>
      </motion.div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Qualification Progress Header */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs text-domo-text-secondary uppercase tracking-wide font-medium">
            Contact Info
          </span>
          <motion.span
            key={capturedCount}
            initial={{ scale: 1.2, color: 'var(--color-domo-primary)' }}
            animate={{ scale: 1, color: 'var(--color-domo-text-secondary)' }}
            className="text-xs"
          >
            {capturedCount}/{totalFields} captured
          </motion.span>
        </div>

        {/* Progress bar */}
        <div className="h-1.5 bg-domo-bg-elevated rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-domo-primary to-domo-success rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${progressPercent}%` }}
            transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
          />
        </div>
      </div>

      {/* Captured Fields - Show values when captured */}
      <div className="space-y-2">
        <AnimatePresence>
          {Object.entries(qualificationFields).map(([key, field], index) => (
            <motion.div
              key={key}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className={`rounded-lg transition-all duration-200 ${
                field.captured
                  ? 'bg-domo-success/10 border border-domo-success/20'
                  : 'bg-domo-bg-elevated/50 border border-transparent'
              }`}
            >
              <div className="flex items-center gap-3 px-3 py-2">
                {/* Icon */}
                <div
                  className={`flex-shrink-0 ${
                    field.captured ? 'text-domo-success' : 'text-domo-text-secondary/50'
                  }`}
                >
                  {fieldIcons[key]}
                </div>

                {/* Label and Value */}
                <div className="flex-1 min-w-0">
                  <p
                    className={`text-xs ${
                      field.captured ? 'text-domo-text-secondary' : 'text-domo-text-secondary/50'
                    }`}
                  >
                    {fieldLabels[key] || key}
                  </p>
                  {field.captured && field.value ? (
                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-sm font-medium text-domo-text-primary truncate"
                    >
                      {field.value}
                    </motion.p>
                  ) : (
                    <p className="text-sm text-domo-text-secondary/40 italic">Not captured</p>
                  )}
                </div>

                {/* Check mark for captured */}
                {field.captured && (
                  <motion.div
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                    className="flex-shrink-0"
                  >
                    <svg className="w-5 h-5 text-domo-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                  </motion.div>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Topics Discussed */}
      <AnimatePresence>
        {hasTopics && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-2 overflow-hidden pt-2 border-t border-domo-border"
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
              Topics Discussed
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
