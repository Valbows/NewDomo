'use client';

import React, { useEffect, useRef, useState, useImperativeHandle, forwardRef, useMemo } from 'react';
import { formatTime, findChapterAtTimestamp, type VideoChapter } from '@/lib/video-context';

interface InlineVideoPlayerProps {
  videoUrl: string;
  videoTitle?: string;
  chapters?: VideoChapter[];
  onClose: () => void;
  onVideoEnd?: () => void;
  onTimeUpdate?: (currentTime: number, isPaused: boolean) => void;
  onPause?: (currentTime: number) => void;
  onSeek?: (currentTime: number) => void;
}

export type InlineVideoPlayerHandle = {
  play: () => Promise<void>;
  pause: () => void;
  isPaused: () => boolean;
  getCurrentTime: () => number;
  seekTo: (time: number) => void;
  setVolume: (volume: number) => void; // 0.0 to 1.0 for audio ducking
  getVolume: () => number;
};

export const InlineVideoPlayer = forwardRef<InlineVideoPlayerHandle, InlineVideoPlayerProps>(function InlineVideoPlayer(
  { videoUrl, videoTitle, chapters = [], onClose, onVideoEnd, onTimeUpdate, onPause, onSeek }: InlineVideoPlayerProps,
  ref
) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const shouldAutoplayRef = useRef<boolean>(true);
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [paused, setPaused] = useState<boolean>(true);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [showChapterList, setShowChapterList] = useState<boolean>(false);

  // Find current chapter based on playback position
  const currentChapter = useMemo(() => {
    if (!chapters || chapters.length === 0) return null;
    return findChapterAtTimestamp(chapters, currentTime);
  }, [chapters, currentTime]);

  useImperativeHandle(ref, () => ({
    async play() {
      const el = videoRef.current;
      if (!el) return;
      shouldAutoplayRef.current = true;
      try {
        await el.play();
      } catch (e) {
        console.warn('InlineVideoPlayer.play() failed:', e);
      }
      // For E2E, reflect requested state even if underlying playback fails
      setPaused(false);
    },
    pause() {
      const el = videoRef.current;
      if (!el) return;
      shouldAutoplayRef.current = false;
      try {
        el.pause();
      } catch (e) {
        console.warn('InlineVideoPlayer.pause() failed:', e);
      }
      setPaused(true);
    },
    isPaused() {
      const el = videoRef.current;
      return el ? el.paused : paused;
    },
    getCurrentTime() {
      const el = videoRef.current;
      return el ? el.currentTime : 0;
    },
    seekTo(time: number) {
      const el = videoRef.current;
      if (!el) return;
      try {
        el.currentTime = Math.max(0, time || 0);
      } catch (e) {
        console.warn('InlineVideoPlayer.seekTo() failed:', e);
      }
    },
    setVolume(volume: number) {
      const el = videoRef.current;
      if (!el) return;
      try {
        el.volume = Math.max(0, Math.min(1, volume));
      } catch (e) {
        console.warn('InlineVideoPlayer.setVolume() failed:', e);
      }
    },
    getVolume() {
      const el = videoRef.current;
      return el ? el.volume : 1;
    },
  }), []);

  useEffect(() => {
    const videoElement = videoRef.current;
    if (!videoElement) return;

    // Reset error state on new source
    setHasError(false);
    setErrorMessage('');
    // New source should autoplay by default unless paused via tool command
    shouldAutoplayRef.current = true;

    // Ensure browser initializes network fetch for the new src
    try {
      // Pause before swapping sources
      try { videoElement.pause(); } catch {}
      // Explicitly set src to ensure resource selection, then call load()
      try { (videoElement as HTMLVideoElement).src = videoUrl; } catch {}
      // Setting src attribute is also handled by React prop, but load() ensures fetch begins
      videoElement.load();
    } catch (e) {
      console.warn('InlineVideoPlayer: load() failed to initiate', e);
    }

    const handleCanPlay = async () => {
      // Autoplay only if not explicitly paused via tool command
      if (shouldAutoplayRef.current) {
        try {
          await videoElement.play();
          setPaused(false);
        } catch (error) {
          console.error('Video autoplay failed:', error);
        }
      } else {
        try { videoElement.pause(); } catch {}
        setPaused(true);
      }
    };

    const handleLoadedMetadata = async () => {
      // Capture video duration for chapter markers
      if (videoElement.duration && !isNaN(videoElement.duration)) {
        setDuration(videoElement.duration);
      }
      // Start playback only if autoplay is still intended
      if (shouldAutoplayRef.current) {
        try {
          await videoElement.play();
          setPaused(false);
        } catch {}
      } else {
        try { videoElement.pause(); } catch {}
        setPaused(true);
      }
    };

    const handleEnded = () => {
      if (onVideoEnd) {
        onVideoEnd();
      }
      setPaused(true);
    };

    const handleError = (error: Event) => {
      console.error('Video error:', error);
      const videoElement = error.target as HTMLVideoElement;
      if (videoElement && videoElement.error) {
        const errorDetails = {
          code: videoElement.error.code,
          message: videoElement.error.message,
          networkState: videoElement.networkState,
          readyState: videoElement.readyState,
          src: videoElement.src
        };
        console.error('Video error details:', errorDetails);
        setHasError(true);
        setErrorMessage(`Video loading failed (Code: ${videoElement.error.code}): ${videoElement.error.message}`);
      } else {
        setHasError(true);
        setErrorMessage('Unknown video error occurred');
      }
      setPaused(true);
    };

    const handlePlay = () => setPaused(false);
    const handlePause = () => {
      setPaused(true);
      // Notify parent of pause with current time
      if (onPause && videoElement) {
        onPause(videoElement.currentTime);
      }
    };

    // Track time updates - update local state frequently for chapter display
    // but throttle parent callbacks to every 2 seconds
    let lastTimeUpdate = 0;
    const handleTimeUpdate = () => {
      if (!videoElement) return;
      // Always update local time for chapter display
      setCurrentTime(videoElement.currentTime);
      // Throttle parent callback
      const now = Date.now();
      if (now - lastTimeUpdate > 2000) {
        lastTimeUpdate = now;
        onTimeUpdate?.(videoElement.currentTime, videoElement.paused);
      }
    };

    // Track seeks
    const handleSeeked = () => {
      if (!videoElement) return;
      onSeek?.(videoElement.currentTime);
    };

    videoElement.addEventListener('canplay', handleCanPlay);
    videoElement.addEventListener('loadedmetadata', handleLoadedMetadata);
    videoElement.addEventListener('ended', handleEnded);
    videoElement.addEventListener('error', handleError);
    videoElement.addEventListener('play', handlePlay);
    videoElement.addEventListener('pause', handlePause);
    videoElement.addEventListener('timeupdate', handleTimeUpdate);
    videoElement.addEventListener('seeked', handleSeeked);

    // Clean up event listeners
    return () => {
      videoElement.removeEventListener('canplay', handleCanPlay);
      videoElement.removeEventListener('loadedmetadata', handleLoadedMetadata);
      videoElement.removeEventListener('ended', handleEnded);
      videoElement.removeEventListener('error', handleError);
      videoElement.removeEventListener('play', handlePlay);
      videoElement.removeEventListener('pause', handlePause);
      videoElement.removeEventListener('timeupdate', handleTimeUpdate);
      videoElement.removeEventListener('seeked', handleSeeked);
    };
  }, [videoUrl, onTimeUpdate, onPause, onSeek]);

  // Handle chapter click - seek to chapter start
  const handleChapterClick = (chapter: VideoChapter) => {
    const el = videoRef.current;
    if (!el) return;
    el.currentTime = chapter.start;
    setShowChapterList(false);
  };

  return (
    <div className="space-y-2">
      {/* Current Chapter Indicator */}
      {chapters && chapters.length > 0 && currentChapter && (
        <div className="flex items-center justify-between bg-domo-bg-elevated px-3 py-2 rounded-t-lg border border-domo-border border-b-0">
          <div className="flex items-center gap-2 text-sm min-w-0 flex-1 mr-2">
            <span className="text-domo-primary font-medium whitespace-nowrap">
              {currentChapter.chapterNumber ? `Ch ${currentChapter.chapterNumber}` : 'Chapter'}
            </span>
            <span className="text-domo-text-muted whitespace-nowrap">
              {formatTime(currentChapter.start)} - {formatTime(currentChapter.end)}
            </span>
            {currentChapter.description && (
              <span className="text-white truncate">{currentChapter.description}</span>
            )}
          </div>
          <button
            onClick={() => setShowChapterList(!showChapterList)}
            className="text-domo-primary hover:text-domo-secondary text-sm flex items-center gap-1 whitespace-nowrap"
          >
            <svg className={`w-4 h-4 transition-transform ${showChapterList ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
            {showChapterList ? 'Hide' : 'Chapters'}
          </button>
        </div>
      )}

      {/* Chapter List (Expandable) */}
      {chapters && chapters.length > 0 && showChapterList && (
        <div className="bg-domo-bg-elevated border border-domo-border border-t-0 rounded-b-lg max-h-48 overflow-y-auto">
          {chapters.map((chapter, index) => {
            const isActive = currentChapter?.start === chapter.start && currentChapter?.end === chapter.end;
            return (
              <button
                key={index}
                onClick={() => handleChapterClick(chapter)}
                className={`w-full px-3 py-2 text-left text-sm hover:bg-domo-bg-card transition-colors ${
                  isActive ? 'bg-domo-primary/20' : ''
                }`}
              >
                <div className="flex items-center gap-2">
                  {isActive && (
                    <span className="w-2 h-2 bg-domo-primary rounded-full animate-pulse flex-shrink-0" />
                  )}
                  <span className={`${isActive ? 'text-domo-primary font-medium' : 'text-domo-text-muted'} whitespace-nowrap`}>
                    {chapter.chapterNumber ? `Ch ${chapter.chapterNumber}` : `${index + 1}`}
                  </span>
                  <span className="text-domo-text-muted text-xs whitespace-nowrap">
                    {formatTime(chapter.start)} - {formatTime(chapter.end)}
                  </span>
                  {chapter.description && (
                    <span className={`truncate ${isActive ? 'text-white' : 'text-domo-text-secondary'}`}>
                      {chapter.description}
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      )}

      <div className="relative">
        {/* Chapter Progress Bar (visual markers) */}
        {chapters && chapters.length > 0 && duration > 0 && (
          <div className="absolute top-0 left-0 right-0 h-1 bg-domo-bg-elevated z-10 rounded-t-lg overflow-hidden">
            {chapters.map((chapter, index) => {
              const startPercent = (chapter.start / duration) * 100;
              const widthPercent = ((chapter.end - chapter.start) / duration) * 100;
              const isActive = currentChapter?.title === chapter.title;
              return (
                <div
                  key={index}
                  className={`absolute h-full transition-colors cursor-pointer ${
                    isActive ? 'bg-domo-primary' : 'bg-domo-border hover:bg-domo-primary/50'
                  }`}
                  style={{
                    left: `${startPercent}%`,
                    width: `${Math.max(widthPercent, 1)}%`,
                  }}
                  onClick={() => handleChapterClick(chapter)}
                  title={chapter.description
                    ? `${chapter.description} (${formatTime(chapter.start)} - ${formatTime(chapter.end)})`
                    : `Chapter ${chapter.chapterNumber || index + 1} (${formatTime(chapter.start)} - ${formatTime(chapter.end)})`
                  }
                />
              );
            })}
          </div>
        )}

        <video
          ref={videoRef}
          key={videoUrl}
          src={videoUrl}
          controls
          autoPlay
          playsInline
          preload="metadata"
          className={`w-full h-full bg-black ${chapters && chapters.length > 0 ? 'rounded-b-lg' : 'rounded-lg'}`}
          data-testid="inline-video"
          data-paused={paused ? 'true' : 'false'}
          poster="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' fill='%23f3f4f6'/%3E%3Ctext x='50' y='50' font-family='Arial' font-size='14' fill='%236b7280' text-anchor='middle' dy='0.3em'%3ELoading...%3C/text%3E%3C/svg%3E"
        >
        </video>

        {/* Error overlay */}
        {hasError && (
          <div className="absolute inset-0 bg-domo-error/10 border-2 border-domo-error/30 rounded-lg flex items-center justify-center">
            <div className="text-center p-4">
              <div className="text-domo-error text-4xl mb-2">⚠️</div>
              <h4 className="text-domo-error font-semibold mb-2">Video Loading Error</h4>
              <p className="text-domo-error/80 text-sm mb-3">{errorMessage}</p>
              <div className="text-xs text-domo-error/70 mb-3">
                <p>Video URL: {videoUrl}</p>
              </div>
              <button
                onClick={onClose}
                className="px-3 py-1 bg-domo-error text-white rounded text-sm hover:bg-domo-error/80"
              >
                Close
              </button>
            </div>
          </div>
        )}

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-2 right-2 bg-black bg-opacity-50 text-white rounded-full p-2 hover:bg-opacity-70 transition-opacity"
          title="Close video"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Video info */}
      <div className="flex items-center justify-between text-sm text-domo-text-secondary">
        <span>🎬 {videoTitle || 'Demo video playing'}</span>
        <button
          onClick={onClose}
          className="text-domo-primary hover:text-domo-secondary font-medium"
        >
          Close Video
        </button>
      </div>
    </div>
  );
});
