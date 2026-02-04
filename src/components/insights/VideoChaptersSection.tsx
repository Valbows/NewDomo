'use client';

/**
 * VideoChaptersSection Component
 *
 * Displays clickable video chapter navigation during video playback.
 * Allows users to jump to specific sections of the video by clicking chapter items.
 *
 * Chapter data is parsed from Twelve Labs generated context stored in the
 * demo_videos.metadata.twelvelabs.generatedContext field.
 *
 * Visual States:
 * - Past chapters: Green checkmark (already watched)
 * - Current chapter: Blue highlight with pulsing indicator
 * - Future chapters: Gray number
 *
 * @see parseChaptersFromContext in /lib/video-context.ts for chapter parsing logic
 *
 * @example
 * <VideoChaptersSection
 *   chapters={[
 *     { start: 0, end: 30, title: 'Introduction', chapterNumber: 1 },
 *     { start: 30, end: 90, title: 'Feature Overview', chapterNumber: 2 },
 *   ]}
 *   currentTime={45}
 *   onChapterClick={(timestamp) => videoPlayer.seekTo(timestamp)}
 *   videoTitle="Product Demo"
 * />
 */

import type { VideoChapter } from '@/lib/video-context';
import { formatTime } from '@/lib/video-context';

interface VideoChaptersSectionProps {
  /** Array of video chapters parsed from Twelve Labs context */
  chapters: VideoChapter[];
  /** Current playback position in seconds */
  currentTime: number;
  /** Callback fired when a chapter is clicked, receives the start timestamp */
  onChapterClick: (timestamp: number) => void;
  /** Optional title of the currently playing video */
  videoTitle?: string;
}

/**
 * Renders a list of clickable video chapters with visual progress indicators.
 * Returns null if there are no chapters to display.
 */
export function VideoChaptersSection({
  chapters,
  currentTime,
  onChapterClick,
  videoTitle,
}: VideoChaptersSectionProps) {
  // Don't render if there are no chapters
  if (chapters.length === 0) {
    return null;
  }

  // Determine which chapter is currently playing based on currentTime
  const currentChapterIndex = chapters.findIndex(
    (ch) => currentTime >= ch.start && currentTime <= ch.end
  );

  return (
    <div className="space-y-2">
      {/* Section header with optional video title */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-domo-text-primary">
          Video Chapters
        </h3>
        {videoTitle && (
          <span className="text-xs text-domo-text-secondary truncate max-w-[150px]" title={videoTitle}>
            {videoTitle}
          </span>
        )}
      </div>

      {/* Chapter list */}
      <div className="bg-domo-bg-dark/50 rounded-lg p-3">
        <ul className="space-y-1">
          {chapters.map((chapter, index) => {
            // Determine chapter state for styling
            const isCurrent = index === currentChapterIndex;
            const isPast = currentTime > chapter.end;

            return (
              <li key={index}>
                <button
                  onClick={() => onChapterClick(chapter.start)}
                  className={`w-full flex items-start gap-2 px-2 py-1.5 rounded-md text-left transition-colors hover:bg-domo-border/50 ${
                    isCurrent
                      ? 'bg-domo-primary/20 border border-domo-primary/40'
                      : ''
                  }`}
                >
                  {/* Chapter number/status indicator */}
                  <span className={`flex-shrink-0 w-5 h-5 flex items-center justify-center rounded-full text-xs ${
                    isCurrent
                      ? 'bg-domo-primary text-white'        // Current: blue background
                      : isPast
                        ? 'bg-green-500/20 text-green-400'  // Past: green checkmark
                        : 'bg-domo-border text-domo-text-secondary' // Future: gray number
                  }`}>
                    {isPast && !isCurrent ? (
                      // Show checkmark for completed chapters
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      // Show chapter number for current/future chapters
                      chapter.chapterNumber || index + 1
                    )}
                  </span>

                  {/* Chapter title and time range */}
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm truncate ${
                      isCurrent ? 'text-domo-primary font-medium' : 'text-domo-text-primary'
                    }`}>
                      {chapter.title}
                    </p>
                    <p className="text-xs text-domo-text-secondary">
                      {formatTime(chapter.start)} - {formatTime(chapter.end)}
                    </p>
                  </div>

                  {/* Pulsing indicator for current chapter */}
                  {isCurrent && (
                    <span className="flex-shrink-0">
                      <span className="inline-block w-2 h-2 rounded-full bg-domo-primary animate-pulse" />
                    </span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
