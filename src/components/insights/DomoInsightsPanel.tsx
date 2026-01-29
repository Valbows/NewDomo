'use client';

/**
 * DomoInsightsPanel Component
 *
 * Main container for the Domo Insights side panel that displays real-time
 * information about the demo conversation. This panel provides visibility
 * into qualification progress, videos watched, and topics discussed.
 *
 * Layout Behavior:
 * - Desktop (lg+): Fixed sidebar on the right side of the screen (320px wide)
 * - Mobile (<lg): Slide-in drawer from the right, activated via toggle button
 *
 * Sections (in order):
 * 1. Video Chapters - Only shown during video playback, allows click-to-seek
 * 2. Qualification Checklist - Pre-populated fields with real-time checkmarks
 * 3. Videos Watched - List of videos shown during the demo
 * 4. Key Topics - Primary interest and pain points captured
 *
 * Integration:
 * - Rendered in DemoExperienceView.tsx alongside the main conversation content
 * - Receives data from useInsightsData hook
 * - Video chapter clicks are handled by parent via onChapterClick callback
 *
 * @see useInsightsData for data fetching and real-time updates
 * @see DemoExperienceView for layout integration
 */

import { useState, useEffect, useCallback } from 'react';
import { QualificationChecklist, type QualificationFields } from './QualificationChecklist';
import { VideosWatchedSection } from './VideosWatchedSection';
import { TopicsDiscussedSection } from './TopicsDiscussedSection';
import { VideoChaptersSection } from './VideoChaptersSection';
import { InsightsDrawerToggle } from './InsightsDrawerToggle';
import type { VideoChapter } from '@/lib/video-context';

/**
 * Combined insights data structure passed from the parent component.
 * This data is fetched and managed by the useInsightsData hook.
 */
export interface InsightsData {
  /** Qualification fields with captured status and values */
  qualificationFields: QualificationFields;
  /** Array of video titles that have been shown */
  videosWatched: string[];
  /** Topics identified during the conversation */
  topicsDiscussed: {
    primaryInterest: string | null;
    painPoints: string[];
  };
}

interface DomoInsightsPanelProps {
  /** All insights data to display in the panel */
  insightsData: InsightsData;
  /** Video chapters for the currently playing video (from Twelve Labs) */
  currentVideoChapters?: VideoChapter[];
  /** Current video playback time in seconds */
  currentVideoTime?: number;
  /** Title of the currently playing video */
  currentVideoTitle?: string;
  /** Whether a video is currently playing (shows chapter section) */
  isVideoPlaying?: boolean;
  /** Callback when a chapter is clicked - parent handles video seeking */
  onChapterClick?: (timestamp: number) => void;
}

/**
 * Main panel component that handles responsive layout and section rendering.
 * Automatically switches between sidebar (desktop) and drawer (mobile) modes.
 */
export function DomoInsightsPanel({
  insightsData,
  currentVideoChapters = [],
  currentVideoTime = 0,
  currentVideoTitle,
  isVideoPlaying = false,
  onChapterClick,
}: DomoInsightsPanelProps) {
  // Mobile drawer state
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile viewport using lg breakpoint (1024px)
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Auto-close drawer when viewport switches from mobile to desktop
  useEffect(() => {
    if (!isMobile && isDrawerOpen) {
      setIsDrawerOpen(false);
    }
  }, [isMobile, isDrawerOpen]);

  // Handle chapter click with optional drawer close on mobile
  const handleChapterClick = useCallback((timestamp: number) => {
    onChapterClick?.(timestamp);
    // Close mobile drawer after clicking a chapter for better UX
    if (isMobile) {
      setIsDrawerOpen(false);
    }
  }, [onChapterClick, isMobile]);

  /**
   * Panel content - extracted to avoid duplication between mobile/desktop renders.
   * Contains the header and all section components.
   */
  const panelContent = (
    <div className="h-full flex flex-col">
      {/* Panel header with title and close button (mobile only) */}
      <div className="flex-shrink-0 p-4 border-b border-domo-border">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-domo-text-primary">
            Domo Insights
          </h2>
          {/* Close button - only visible on mobile drawer */}
          {isMobile && (
            <button
              onClick={() => setIsDrawerOpen(false)}
              className="p-1.5 rounded-full hover:bg-domo-border/50 text-domo-text-secondary hover:text-domo-text-primary transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Scrollable content area with all insight sections */}
      <div className="flex-1 overflow-y-auto p-4 space-y-5">
        {/* Video chapters - only visible during video playback */}
        {isVideoPlaying && currentVideoChapters.length > 0 && (
          <VideoChaptersSection
            chapters={currentVideoChapters}
            currentTime={currentVideoTime}
            onChapterClick={handleChapterClick}
            videoTitle={currentVideoTitle}
          />
        )}

        {/* Qualification checklist - always visible */}
        <QualificationChecklist fields={insightsData.qualificationFields} />

        {/* Videos watched section */}
        <VideosWatchedSection videos={insightsData.videosWatched} />

        {/* Topics discussed section */}
        <TopicsDiscussedSection
          primaryInterest={insightsData.topicsDiscussed.primaryInterest}
          painPoints={insightsData.topicsDiscussed.painPoints}
        />
      </div>
    </div>
  );

  // ========== MOBILE LAYOUT ==========
  // Render as a slide-in drawer with toggle button and backdrop
  if (isMobile) {
    return (
      <>
        {/* Floating toggle button on right edge of screen */}
        <InsightsDrawerToggle
          onClick={() => setIsDrawerOpen(true)}
          hasUpdates={false}
        />

        {/* Semi-transparent backdrop - click to close */}
        {isDrawerOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={() => setIsDrawerOpen(false)}
          />
        )}

        {/* Slide-in drawer panel */}
        <aside
          className={`fixed top-0 right-0 h-full w-80 max-w-[85vw] bg-domo-bg-card border-l border-domo-border z-50 transform transition-transform duration-300 ease-in-out lg:hidden ${
            isDrawerOpen ? 'translate-x-0' : 'translate-x-full'
          }`}
        >
          {panelContent}
        </aside>
      </>
    );
  }

  // ========== DESKTOP LAYOUT ==========
  // Render as a fixed sidebar
  return (
    <aside className="hidden lg:flex flex-col w-80 bg-domo-bg-card border-l border-domo-border flex-shrink-0" style={{ zIndex: 35 }}>
      {panelContent}
    </aside>
  );
}
