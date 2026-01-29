'use client';

/**
 * ResourcesPanel Component
 *
 * Left sidebar container for the demo experience with smooth animations.
 * Displays:
 * 1. Media Section - Video thumbnails and playback
 * 2. Current Task Section - Qualification progress and topics discussed
 * 3. Chat History Section - Conversation transcript
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MediaSection } from './MediaSection';
import { CurrentTaskSection } from './CurrentTaskSection';
import { ChatHistorySection } from './ChatHistorySection';
import type { InsightsData } from '@/components/insights/DomoInsightsPanel';
import type { VideoChapter } from '@/lib/video-context';
import type { TranscriptMessage } from '@/components/conversation/types';

interface ResourcesPanelProps {
  /** All insights data (qualification, videos watched, topics) */
  insightsData: InsightsData;
  /** Video chapters for the currently playing video */
  currentVideoChapters?: VideoChapter[];
  /** Current video playback time in seconds */
  currentVideoTime?: number;
  /** Title of the currently playing video */
  currentVideoTitle?: string;
  /** Whether a video is currently playing */
  isVideoPlaying?: boolean;
  /** Callback when a chapter is clicked */
  onChapterClick?: (timestamp: number) => void;
  /** Callback when a video thumbnail is clicked */
  onVideoClick?: (videoTitle: string) => void;
  /** Conversation transcript messages */
  transcript?: TranscriptMessage[];
  /** Whether the panel is in mobile drawer mode */
  isMobileDrawer?: boolean;
  /** Callback to close the mobile drawer */
  onClose?: () => void;
}

interface SectionConfig {
  id: 'media' | 'currentTask' | 'chatHistory';
  title: string;
  icon: React.ReactNode;
  badge?: string | number;
}

export function ResourcesPanel({
  insightsData,
  currentVideoChapters = [],
  currentVideoTime = 0,
  currentVideoTitle,
  isVideoPlaying = false,
  onChapterClick,
  onVideoClick,
  transcript = [],
  isMobileDrawer = false,
  onClose,
}: ResourcesPanelProps) {
  // Track which sections are expanded (all expanded by default)
  const [expandedSections, setExpandedSections] = useState({
    media: true,
    currentTask: true,
    chatHistory: true,
  });

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  // Calculate badges
  const videosWatchedCount = insightsData.videosWatched.length;
  const qualificationCount = Object.values(insightsData.qualificationFields).filter((f) => f.captured).length;
  const transcriptCount = transcript.length;

  const sections: SectionConfig[] = [
    {
      id: 'media',
      title: 'Media',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
          />
        </svg>
      ),
      badge: videosWatchedCount > 0 ? videosWatchedCount : undefined,
    },
    {
      id: 'currentTask',
      title: 'Current Task',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
          />
        </svg>
      ),
      badge: qualificationCount > 0 ? `${qualificationCount}/4` : undefined,
    },
    {
      id: 'chatHistory',
      title: 'Chat History',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
          />
        </svg>
      ),
      badge: transcriptCount > 0 ? transcriptCount : undefined,
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
      className="h-full flex flex-col bg-domo-bg-card"
    >
      {/* Panel header */}
      <div className="flex-shrink-0 p-4 border-b border-domo-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <motion.div
              className="w-2 h-2 rounded-full bg-domo-success"
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
            <h2 className="text-sm font-semibold text-domo-text-secondary uppercase tracking-wider">Resources</h2>
          </div>
          {/* Close button for mobile drawer */}
          {isMobileDrawer && onClose && (
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={onClose}
              className="p-1.5 rounded-full hover:bg-domo-border/50 text-domo-text-secondary hover:text-domo-text-primary transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </motion.button>
          )}
        </div>
      </div>

      {/* Scrollable content area */}
      <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-domo-border scrollbar-track-transparent">
        {sections.map((section, index) => (
          <motion.div
            key={section.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="border-b border-domo-border last:border-b-0"
          >
            {/* Section header button */}
            <button
              onClick={() => toggleSection(section.id)}
              className="w-full flex items-center justify-between p-4 hover:bg-domo-bg-elevated/30 transition-colors group"
            >
              <div className="flex items-center gap-2.5">
                <span className="text-domo-text-secondary group-hover:text-domo-primary transition-colors">
                  {section.icon}
                </span>
                <span className="text-sm font-medium text-domo-text-primary">{section.title}</span>
                {section.badge && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="px-1.5 py-0.5 bg-domo-primary/20 text-domo-primary text-xs rounded-full font-medium"
                  >
                    {section.badge}
                  </motion.span>
                )}
              </div>
              <motion.svg
                animate={{ rotate: expandedSections[section.id] ? 180 : 0 }}
                transition={{ duration: 0.2 }}
                className="w-4 h-4 text-domo-text-secondary"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </motion.svg>
            </button>

            {/* Section content with animation */}
            <AnimatePresence initial={false}>
              {expandedSections[section.id] && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
                  className="overflow-hidden"
                >
                  <div className="px-4 pb-4">
                    {section.id === 'media' && (
                      <MediaSection
                        videosWatched={insightsData.videosWatched}
                        currentVideoTitle={currentVideoTitle}
                        currentVideoChapters={currentVideoChapters}
                        currentVideoTime={currentVideoTime}
                        isVideoPlaying={isVideoPlaying}
                        onVideoClick={onVideoClick}
                        onChapterClick={onChapterClick}
                      />
                    )}
                    {section.id === 'currentTask' && (
                      <CurrentTaskSection
                        qualificationFields={insightsData.qualificationFields}
                        primaryInterest={insightsData.topicsDiscussed.primaryInterest}
                        painPoints={insightsData.topicsDiscussed.painPoints}
                      />
                    )}
                    {section.id === 'chatHistory' && <ChatHistorySection transcript={transcript} />}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
