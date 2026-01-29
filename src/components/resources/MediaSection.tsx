'use client';

/**
 * MediaSection Component
 *
 * Displays video thumbnails and chapter markers with smooth animations.
 * Shows currently playing video and list of watched videos.
 */

import { motion, AnimatePresence } from 'framer-motion';
import type { VideoChapter } from '@/lib/video-context';

interface MediaSectionProps {
  /** List of video titles that have been watched */
  videosWatched: string[];
  /** Title of the currently playing video */
  currentVideoTitle?: string;
  /** Chapters for the current video */
  currentVideoChapters?: VideoChapter[];
  /** Current playback time in seconds */
  currentVideoTime?: number;
  /** Whether a video is currently playing */
  isVideoPlaying?: boolean;
  /** Callback when a video thumbnail is clicked */
  onVideoClick?: (videoTitle: string) => void;
  /** Callback when a chapter is clicked */
  onChapterClick?: (timestamp: number) => void;
}

export function MediaSection({
  videosWatched,
  currentVideoTitle,
  currentVideoChapters = [],
  currentVideoTime = 0,
  isVideoPlaying = false,
  onVideoClick,
  onChapterClick,
}: MediaSectionProps) {
  // Format time as MM:SS
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Find current chapter based on playback time
  const currentChapterIndex = currentVideoChapters.findIndex((chapter, index) => {
    const nextChapter = currentVideoChapters[index + 1];
    if (nextChapter) {
      return currentVideoTime >= chapter.start && currentVideoTime < nextChapter.start;
    }
    return currentVideoTime >= chapter.start;
  });

  // Empty state
  if (!isVideoPlaying && videosWatched.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex flex-col items-center justify-center py-6 text-center"
      >
        <motion.div
          className="w-16 h-16 rounded-2xl bg-domo-bg-elevated/50 flex items-center justify-center mb-3"
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ duration: 3, repeat: Infinity }}
        >
          <svg className="w-8 h-8 text-domo-text-secondary/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </motion.div>
        <p className="text-sm text-domo-text-secondary/70">Demo videos will appear</p>
        <p className="text-xs text-domo-text-secondary/50 mt-1">as you watch them</p>
      </motion.div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Currently playing video with chapters */}
      <AnimatePresence>
        {isVideoPlaying && currentVideoTitle && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.98 }}
            transition={{ duration: 0.2 }}
            className="bg-gradient-to-br from-domo-primary/10 to-domo-bg-dark/50 rounded-xl p-3 space-y-2 border border-domo-primary/20"
          >
            <div className="flex items-center gap-2">
              <motion.div
                className="w-2 h-2 bg-domo-primary rounded-full"
                animate={{ scale: [1, 1.3, 1], opacity: [1, 0.7, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              />
              <span className="text-xs text-domo-primary uppercase tracking-wide font-medium">Now Playing</span>
            </div>
            <p className="text-sm text-domo-text-primary font-medium truncate" title={currentVideoTitle}>
              {currentVideoTitle}
            </p>

            {/* Chapter markers */}
            {currentVideoChapters.length > 0 && (
              <div className="mt-2 space-y-1 max-h-32 overflow-y-auto scrollbar-thin scrollbar-thumb-domo-border scrollbar-track-transparent">
                {currentVideoChapters.map((chapter, index) => (
                  <motion.button
                    key={index}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    onClick={() => onChapterClick?.(chapter.start)}
                    whileHover={{ x: 2 }}
                    className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-left transition-colors ${
                      index === currentChapterIndex
                        ? 'bg-domo-primary/20 text-domo-primary'
                        : 'hover:bg-domo-border/20 text-domo-text-secondary'
                    }`}
                  >
                    <span className="text-xs font-mono shrink-0 w-10">{formatTime(chapter.start)}</span>
                    <span className="text-xs truncate flex-1">{chapter.title}</span>
                    {index === currentChapterIndex && (
                      <motion.div
                        className="w-1.5 h-1.5 rounded-full bg-domo-primary"
                        animate={{ scale: [1, 1.3, 1] }}
                        transition={{ duration: 1, repeat: Infinity }}
                      />
                    )}
                  </motion.button>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Videos watched list */}
      {videosWatched.length > 0 && (
        <div className="space-y-1.5">
          {!isVideoPlaying && (
            <p className="text-xs text-domo-text-secondary mb-2 flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Videos Watched
            </p>
          )}
          {videosWatched.map((video, index) => (
            <motion.button
              key={index}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              onClick={() => onVideoClick?.(video)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all ${
                video === currentVideoTitle && isVideoPlaying
                  ? 'bg-domo-primary/10 border border-domo-primary/30 shadow-sm shadow-domo-primary/10'
                  : 'bg-domo-bg-dark/30 hover:bg-domo-bg-elevated/50 border border-transparent'
              }`}
            >
              {/* Video thumbnail placeholder */}
              <div className="w-12 h-9 bg-domo-bg-elevated rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden">
                <motion.svg
                  className="w-4 h-4 text-domo-text-secondary"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                  whileHover={{ scale: 1.1 }}
                >
                  <path d="M8 5v14l11-7z" />
                </motion.svg>
              </div>
              <span className="text-sm text-domo-text-primary truncate flex-1" title={video}>
                {video}
              </span>
              {video === currentVideoTitle && isVideoPlaying && (
                <motion.div
                  className="flex gap-0.5"
                  animate={{ opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                >
                  {[1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="w-0.5 bg-domo-primary rounded-full"
                      style={{ height: `${8 + Math.random() * 8}px` }}
                    />
                  ))}
                </motion.div>
              )}
            </motion.button>
          ))}
        </div>
      )}
    </div>
  );
}
