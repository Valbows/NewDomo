import { useState, useRef } from 'react';
import type { InlineVideoPlayerHandle } from '../components/InlineVideoPlayer';

export function useVideoPlayer() {
  const [playingVideoUrl, setPlayingVideoUrl] = useState<string | null>(null);
  const [currentVideoTitle, setCurrentVideoTitle] = useState<string | null>(null);
  const [currentVideoIndex, setCurrentVideoIndex] = useState<number | null>(null);
  const videoPlayerRef = useRef<InlineVideoPlayerHandle | null>(null);
  const suppressFetchUntilRef = useRef<number>(0);
  const suppressReasonRef = useRef<'close' | 'pause' | 'resume' | null>(null);
  const pausedPositionRef = useRef<number>(0);

  const playVideo = (url: string, title?: string, index?: number) => {
    setPlayingVideoUrl(url);
    if (title) setCurrentVideoTitle(title);
    if (index !== undefined) setCurrentVideoIndex(index);
  };

  const pauseVideo = () => {
    if (videoPlayerRef.current) {
      suppressReasonRef.current = 'pause';
      suppressFetchUntilRef.current = Date.now() + 1000;
      videoPlayerRef.current.pause();
    }
  };

  const resumeVideo = () => {
    if (videoPlayerRef.current) {
      suppressReasonRef.current = 'resume';
      suppressFetchUntilRef.current = Date.now() + 1000;
      videoPlayerRef.current.play();
    }
  };

  const closeVideo = () => {
    suppressReasonRef.current = 'close';
    suppressFetchUntilRef.current = Date.now() + 1000;
    setPlayingVideoUrl(null);
    setCurrentVideoTitle(null);
    setCurrentVideoIndex(null);
  };

  const nextVideo = () => {
    if (currentVideoIndex !== null) {
      const nextIndex = currentVideoIndex + 1;
      setCurrentVideoIndex(nextIndex);
    }
  };

  return {
    playingVideoUrl,
    currentVideoTitle,
    currentVideoIndex,
    videoPlayerRef,
    suppressFetchUntilRef,
    suppressReasonRef,
    pausedPositionRef,
    playVideo,
    pauseVideo,
    resumeVideo,
    closeVideo,
    nextVideo,
    setPlayingVideoUrl,
    setCurrentVideoTitle,
    setCurrentVideoIndex,
  };
}
