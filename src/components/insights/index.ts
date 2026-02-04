/**
 * Domo Insights Panel Components
 *
 * This module provides a real-time insights panel that displays alongside
 * demo conversations, showing qualification progress, videos watched,
 * and topics discussed.
 *
 * Main Components:
 * - DomoInsightsPanel: Container with responsive layout (sidebar/drawer)
 * - QualificationChecklist: Pre-populated checklist with real-time checkmarks
 * - VideosWatchedSection: List of videos shown during the demo
 * - TopicsDiscussedSection: Primary interest and pain points
 * - VideoChaptersSection: Clickable chapter navigation during video playback
 *
 * Usage:
 * ```tsx
 * import { DomoInsightsPanel, type InsightsData } from '@/components/insights';
 *
 * <DomoInsightsPanel
 *   insightsData={insightsData}
 *   isVideoPlaying={true}
 *   currentVideoChapters={chapters}
 *   onChapterClick={handleSeek}
 * />
 * ```
 *
 * @see useInsightsData hook for data management
 * @see DemoExperienceView for integration example
 */

// Main panel component
export { DomoInsightsPanel } from './DomoInsightsPanel';
export type { InsightsData } from './DomoInsightsPanel';

// Section components
export { QualificationChecklist } from './QualificationChecklist';
export type { QualificationField, QualificationFields } from './QualificationChecklist';

export { InsightsFieldItem } from './InsightsFieldItem';
export { VideosWatchedSection } from './VideosWatchedSection';
export { TopicsDiscussedSection } from './TopicsDiscussedSection';
export { VideoChaptersSection } from './VideoChaptersSection';

// Mobile UI components
export { InsightsDrawerToggle } from './InsightsDrawerToggle';
