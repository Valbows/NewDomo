'use client';

/**
 * VideosWatchedSection Component
 *
 * Displays a list of demo videos that have been shown during the conversation.
 * Updates in real-time as new videos are played via the fetch_video tool call.
 *
 * Data Source: video_showcase_data table (videos_shown array)
 * Updates: Triggered by addVideoWatched() in DemoExperienceView when fetch_video is called
 *
 * @example
 * // Empty state
 * <VideosWatchedSection videos={[]} />
 *
 * // With videos
 * <VideosWatchedSection videos={['Product Overview', 'Feature Demo']} />
 */

interface VideosWatchedSectionProps {
  /** Array of video titles that have been shown during the demo */
  videos: string[];
}

/**
 * Renders a list of watched videos with play icons.
 * Shows an empty state message when no videos have been watched yet.
 */
export function VideosWatchedSection({ videos }: VideosWatchedSectionProps) {
  return (
    <div className="space-y-2">
      {/* Section header with video count */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-domo-text-primary">
          Videos Watched
        </h3>
        {videos.length > 0 && (
          <span className="text-xs text-domo-text-secondary">
            {videos.length}
          </span>
        )}
      </div>

      {/* Video list container */}
      <div className="bg-domo-bg-dark/50 rounded-lg p-3">
        {videos.length === 0 ? (
          // Empty state - no videos watched yet
          <p className="text-sm text-domo-text-secondary italic">
            No videos watched yet
          </p>
        ) : (
          // List of watched videos with play icons
          <ul className="space-y-2">
            {videos.map((video, index) => (
              <li key={index} className="flex items-start gap-2">
                {/* Play icon indicator */}
                <svg
                  className="w-4 h-4 text-domo-primary flex-shrink-0 mt-0.5"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M8 5v14l11-7z" />
                </svg>
                <span className="text-sm text-domo-text-primary truncate" title={video}>
                  {video}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
