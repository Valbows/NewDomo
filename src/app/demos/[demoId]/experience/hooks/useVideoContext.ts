'use client';

import { useCallback, useRef } from 'react';
import { useDaily } from '@daily-co/daily-react';
import {
  formatTime,
  parseChaptersFromContext,
  findChapterAtTimestamp,
  type VideoChapter
} from '@/lib/video-context';

interface VideoMetadata {
  title: string;
  demoVideoId?: string;
  generatedContext?: string;
  chapters?: VideoChapter[];
}

interface UseVideoContextOptions {
  onContextUpdate?: (context: string) => void;
}

/**
 * Hook to manage video context and send updates to Tavus agent
 */
export function useVideoContext(options?: UseVideoContextOptions) {
  const daily = useDaily();
  const currentVideoRef = useRef<VideoMetadata | null>(null);
  const lastSentContextRef = useRef<string>('');

  // Set the current video being played
  const setCurrentVideo = useCallback((metadata: VideoMetadata) => {
    currentVideoRef.current = metadata;

    // Parse chapters if we have generated context
    if (metadata.generatedContext) {
      metadata.chapters = parseChaptersFromContext(metadata.generatedContext);
    }
  }, []);

  // Send context update to Tavus agent via Daily
  const sendContextToAgent = useCallback((contextMessage: string) => {
    // Avoid sending duplicate messages
    if (contextMessage === lastSentContextRef.current) return;
    lastSentContextRef.current = contextMessage;

    // Send via Daily app message if available
    if (daily) {
      try {
        daily.sendAppMessage({
          type: 'video_context',
          context: contextMessage,
          timestamp: Date.now()
        }, '*');
      } catch (error) {
        console.warn('[VideoContext] Failed to send via Daily:', error);
      }
    }

    // Also call the callback if provided
    options?.onContextUpdate?.(contextMessage);
  }, [daily, options]);

  // Handle video pause - send detailed context
  const handleVideoPause = useCallback((currentTime: number) => {
    const video = currentVideoRef.current;
    if (!video) return;

    const formattedTime = formatTime(currentTime);
    let contextMessage = `User paused "${video.title}" at ${formattedTime}`;

    // Find current chapter
    if (video.chapters && video.chapters.length > 0) {
      const chapter = findChapterAtTimestamp(video.chapters, currentTime);
      if (chapter) {
        contextMessage += `. Currently viewing: "${chapter.title}"`;
      }
    }

    sendContextToAgent(contextMessage);
  }, [sendContextToAgent]);

  // Handle video seek - send new position
  const handleVideoSeek = useCallback((currentTime: number) => {
    const video = currentVideoRef.current;
    if (!video) return;

    const formattedTime = formatTime(currentTime);
    let contextMessage = `User seeked to ${formattedTime} in "${video.title}"`;

    // Find current chapter
    if (video.chapters && video.chapters.length > 0) {
      const chapter = findChapterAtTimestamp(video.chapters, currentTime);
      if (chapter) {
        contextMessage += `. Now viewing: "${chapter.title}"`;
      }
    }

    sendContextToAgent(contextMessage);
  }, [sendContextToAgent]);

  // Handle periodic time updates (every 2 seconds)
  const handleTimeUpdate = useCallback((currentTime: number, isPaused: boolean) => {
    // Only send updates when paused (user is likely reading/examining)
    if (!isPaused) return;

    const video = currentVideoRef.current;
    if (!video) return;

    const formattedTime = formatTime(currentTime);

    // Find current chapter
    if (video.chapters && video.chapters.length > 0) {
      const chapter = findChapterAtTimestamp(video.chapters, currentTime);
      if (chapter) {
        const contextMessage = `User is examining "${chapter.title}" at ${formattedTime} in "${video.title}"`;
        sendContextToAgent(contextMessage);
      }
    }
  }, [sendContextToAgent]);

  // Clear video context
  const clearCurrentVideo = useCallback(() => {
    currentVideoRef.current = null;
    lastSentContextRef.current = '';
  }, []);

  return {
    setCurrentVideo,
    clearCurrentVideo,
    handleVideoPause,
    handleVideoSeek,
    handleTimeUpdate
  };
}
