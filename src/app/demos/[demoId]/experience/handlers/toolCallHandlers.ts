import { UIState } from '@/lib/tavus/UI_STATES';
import { playVideoByTitle, handleVideoClose as closeVideo } from './videoHandlers';
import type { InlineVideoPlayerHandle } from '../components/InlineVideoPlayer';

interface ToolCallHandlerParams {
  toolName: string;
  args: any;
  uiState: UIState;
  currentVideoTitle: string | null;
  playingVideoUrl: string | null;
  videoTitles: string[];
  isE2E: boolean;
  demo: any;
  demoId: string;
  pausedPositionRef: React.MutableRefObject<number>;
  suppressFetchUntilRef: React.MutableRefObject<number>;
  suppressReasonRef: React.MutableRefObject<'close' | 'pause' | 'resume' | null>;
  videoPlayerRef: React.MutableRefObject<InlineVideoPlayerHandle | null>;
  setShowCTA: (show: boolean) => void;
  setAlert: (alert: any) => void;
  setPlayingVideoUrl: (url: string | null) => void;
  setUiState: (state: UIState) => void;
  setCurrentVideoTitle: (title: string) => void;
  setCurrentVideoIndex: (index: number | null) => void;
  alert: any;
}

export async function handleRealTimeToolCall(params: ToolCallHandlerParams) {
  const {
    toolName,
    args,
    uiState,
    currentVideoTitle,
    playingVideoUrl,
    videoTitles,
    isE2E,
    demo,
    demoId,
    pausedPositionRef,
    suppressFetchUntilRef,
    suppressReasonRef,
    videoPlayerRef,
    setShowCTA,
    setAlert,
    setPlayingVideoUrl,
    setUiState,
    setCurrentVideoTitle,
    setCurrentVideoIndex,
    alert,
  } = params;

  if (toolName === 'fetch_video') {
    // Quiescence window: ignore fetch shortly after a close to prevent immediate reopen
    if (Date.now() < suppressFetchUntilRef.current) {
      const reason = suppressReasonRef.current || 'suppression window';
      console.warn(`🛑 Suppressing fetch_video due to recent ${reason}`);
      return;
    }

    // If agent re-requests the same title while a video is already loaded, avoid resetting the src.
    try {
      const requestedTitleRaw = args?.title || args?.video_title || args?.video_name;
      if (requestedTitleRaw && typeof requestedTitleRaw === 'string') {
        const normalizedTitle = requestedTitleRaw.trim().replace(/^["']|["']$/g, '');
        if (
          currentVideoTitle &&
          playingVideoUrl &&
          normalizedTitle.toLowerCase() === currentVideoTitle.toLowerCase()
        ) {
          // Seek back to paused position if we have one, then play
          const t = pausedPositionRef.current || 0;
          if (t > 0) {
          }
          if (t > 0 && videoPlayerRef.current?.seekTo) {
            videoPlayerRef.current.seekTo(t);
          }
          await videoPlayerRef.current?.play();
          return;
        }
      }
    } catch (e) {
      console.warn('fetch_video same-title resume check failed:', e);
    }

    await playVideoByTitle({
      videoTitle: args?.title || args?.video_title || args?.video_name,
      isE2E,
      videoTitles,
      demo,
      demoId,
      pausedPositionRef,
      setShowCTA,
      setAlert,
      setPlayingVideoUrl,
      setUiState,
      setCurrentVideoTitle,
      setCurrentVideoIndex,
      alert,
    });
    return;
  }

  if (toolName === 'pause_video') {
    if (uiState === UIState.VIDEO_PLAYING) {
      // Record the current playback position before pausing
      try {
        const t = videoPlayerRef.current?.getCurrentTime?.() ?? 0;
        pausedPositionRef.current = t;
      } catch {}
      videoPlayerRef.current?.pause();
      // Prevent immediate re-fetch/play attempts triggered by the agent
      suppressFetchUntilRef.current = Date.now() + 1500;
      suppressReasonRef.current = 'pause';
    }
    return;
  }

  if (toolName === 'play_video') {
    if (uiState === UIState.VIDEO_PLAYING) {
      // Restore to the paused position if available before resuming
      try {
        const t = pausedPositionRef.current || 0;
        if (t > 0) {
        }
        if (t > 0 && videoPlayerRef.current?.seekTo) {
          videoPlayerRef.current.seekTo(t);
        }
      } catch {}
      await videoPlayerRef.current?.play();
      // Suppress redundant fetch_video immediately after resume to avoid src reset
      suppressFetchUntilRef.current = Date.now() + 1500;
      suppressReasonRef.current = 'resume';
    }
    return;
  }

  if (toolName === 'close_video') {
    closeVideo(
      pausedPositionRef,
      setPlayingVideoUrl,
      setUiState,
      setShowCTA,
      suppressFetchUntilRef,
      suppressReasonRef
    );
    return;
  }

  if (toolName === 'next_video') {
    // Only advance to next video if a video is currently playing
    if (!currentVideoTitle) {
      console.warn('⚠️  next_video called but no video is currently playing - ignoring');
      return;
    }

    if (Array.isArray(videoTitles) && videoTitles.length > 0) {
      const idx = videoTitles.indexOf(currentVideoTitle);
      if (idx === -1) {
        console.warn('⚠️  Current video not found in videoTitles - cannot advance');
        return;
      }
      const nextIdx = (idx + 1) % videoTitles.length;
      const nextTitle = videoTitles[nextIdx];
      await playVideoByTitle({
        videoTitle: nextTitle,
        isE2E,
        videoTitles,
        demo,
        demoId,
        pausedPositionRef,
        setShowCTA,
        setAlert,
        setPlayingVideoUrl,
        setUiState,
        setCurrentVideoTitle,
        setCurrentVideoIndex,
        alert,
      });
    } else {
      console.warn('next_video called but no videoTitles available');
    }
    return;
  }

  if (toolName === 'show_trial_cta') {
    if (process.env.NODE_ENV !== 'production') {
    }
    setShowCTA(true);
    return;
  }
}
