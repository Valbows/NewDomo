import {useRef} from 'react';
import {supabase} from '@/lib/utils/supabase/browser';
import {UIState} from '@/lib/tavus';
import {logError} from '@/lib/errors';
import type { InlineVideoPlayerHandle } from '../components/InlineVideoPlayer';

interface UseVideoPlayerControlsProps {
  demo: any;
  demoId: string;
  uiState: UIState;
  setUiState: (state: UIState) => void;
  setPlayingVideoUrl: (url: string | null) => void;
  setShowCTA: (show: boolean) => void;
  setAlert: (alert: { type: 'error' | 'info' | 'success'; message: string } | null) => void;
  videoTitles: string[];
  currentVideoTitle: string | null;
  setCurrentVideoTitle: (title: string | null) => void;
  setCurrentVideoIndex: (index: number | null) => void;
  alert: { type: 'error' | 'info' | 'success'; message: string } | null;
}

export function useVideoPlayerControls({
  demo,
  demoId,
  uiState,
  setUiState,
  setPlayingVideoUrl,
  setShowCTA,
  setAlert,
  videoTitles,
  currentVideoTitle,
  setCurrentVideoTitle,
  setCurrentVideoIndex,
  alert
}: UseVideoPlayerControlsProps) {
  const videoPlayerRef = useRef<InlineVideoPlayerHandle | null>(null);
  const suppressFetchUntilRef = useRef<number>(0);
  const suppressReasonRef = useRef<'close' | 'pause' | 'resume' | null>(null);
  const pausedPositionRef = useRef<number>(0);
  const isE2E = process.env.NEXT_PUBLIC_E2E_TEST_MODE === 'true';

  // Handle real-time tool calls from Daily.co
  const handleRealTimeToolCall = async (toolName: string, args: any) => {

    const playByTitle = async (videoTitle: string) => {
      if (!videoTitle || typeof videoTitle !== 'string' || !videoTitle.trim()) {
        logError('Missing or invalid video title in fetch/next_video tool call', 'ToolCall Validation');
        return;
      }
      // Normalize incoming title (trim and remove a single leading/trailing quote)
      const normalizedTitle = videoTitle.trim().replace(/^[&quot;']|[&quot;']$/g, '');

      // Ensure CTA banner is hidden while a video is starting and clear prior alerts
      setShowCTA(false);
      if (alert) setAlert(null);

      try {
        if (isE2E) {
          // Deterministic mapping of titles to distinct sample URLs for E2E assertions
          const samples = [
            // Proxy through our Next.js API to avoid cross-origin/codec quirks in headless tests
            '/api/e2e-video?i=0',
            '/api/e2e-video?i=1',
          ];

          let idx = -1;
          if (Array.isArray(videoTitles) && videoTitles.length > 0) {
            idx = videoTitles.indexOf(normalizedTitle);
          }
          // Fallback: map unknown titles to first sample
          const sampleUrl = samples[(idx >= 0 ? idx : 0) % samples.length];
          // New video source: reset any saved paused position
          pausedPositionRef.current = 0;
          setPlayingVideoUrl(sampleUrl);
          setUiState(UIState.VIDEO_PLAYING);
          setCurrentVideoTitle(normalizedTitle);
          setCurrentVideoIndex(idx >= 0 ? idx : null);
          return;
        }
        // Guard: ensure we have a demo id available for queries even if state hasn't settled yet
        const demoKey = demo?.id ?? demoId;
        if (!demoKey) {
          // console.warn('⚠️ Demo id unavailable at tool call time; delaying fetch_video', { demo, demoId, title: normalizedTitle });
          setAlert({ type: 'info', message: 'Preparing demo… please try again in a moment.' });
          return;
        }
        // First attempt: exact title match
        const { data: videoExact, error: videoExactError } = await supabase
          .from('demo_videos')
          .select('storage_url')
          .eq('demo_id', demoKey)
          .eq('title', normalizedTitle)
          .single();

        let storagePath: string | null = null;
        if (!videoExactError && videoExact) {
          storagePath = videoExact.storage_url as string;
        } else {
          // console.warn('Exact title match not found, attempting case-insensitive lookup for:', normalizedTitle);
          // Fallback: case-insensitive exact match (no wildcards)
          const { data: videosILike, error: ilikeError } = await supabase
            .from('demo_videos')
            .select('storage_url')
            .eq('demo_id', demoKey)
            .ilike('title', normalizedTitle)
            .limit(1);

          if (!ilikeError && Array.isArray(videosILike) && videosILike.length > 0) {
            storagePath = (videosILike[0] as any).storage_url as string;
          }
        }

        if (!storagePath) {
          logError(videoExactError || `Video not found: ${normalizedTitle}`, 'Video lookup');
          setAlert({ type: 'error', message: `Could not find a video titled "${normalizedTitle}".` });
          return;
        }

        // If storagePath is already a full URL, don't try to sign it
        if (/^https?:\/\//i.test(storagePath)) {
          // console.log('Using direct video URL (no signing needed):', storagePath);
          // New video source: reset any saved paused position
          pausedPositionRef.current = 0;
          setPlayingVideoUrl(storagePath);
          setUiState(UIState.VIDEO_PLAYING);
          setCurrentVideoTitle(normalizedTitle);
          if (Array.isArray(videoTitles) && videoTitles.length > 0) {
            const idx = videoTitles.indexOf(normalizedTitle);
            setCurrentVideoIndex(idx >= 0 ? idx : null);
          }
          return;
        }

        const { data: signedUrlData, error: signedUrlError } = await supabase.storage
          .from('demo-videos')
          .createSignedUrl(storagePath, 3600);

        if (signedUrlError || !signedUrlData) {
          logError(signedUrlError || 'Unknown error creating signed URL', 'Error creating signed URL');
          setAlert({ type: 'error', message: 'There was a problem preparing the video for playback. Please try again.' });
          return;
        }

        // New video source: reset any saved paused position
        pausedPositionRef.current = 0;
        setPlayingVideoUrl(signedUrlData.signedUrl);
        setUiState(UIState.VIDEO_PLAYING);
        setCurrentVideoTitle(normalizedTitle);
        if (Array.isArray(videoTitles) && videoTitles.length > 0) {
          const idx = videoTitles.indexOf(normalizedTitle);
          setCurrentVideoIndex(idx >= 0 ? idx : null);
        }
      } catch (error: unknown) {
        logError(error, 'Real-time tool call error');
        setAlert({ type: 'error', message: 'Unexpected error while loading the video.' });
      }
    };

    if (toolName === 'fetch_video') {
      // Quiescence window: ignore fetch shortly after a close to prevent immediate reopen
      if (Date.now() < suppressFetchUntilRef.current) {
        const reason = suppressReasonRef.current || 'suppression window';
        // console.warn(`🛑 Suppressing fetch_video due to recent ${reason}`);
        return;
      }
      // If agent re-requests the same title while a video is already loaded, avoid resetting the src.
      try {
        const requestedTitleRaw = args?.title || args?.video_title || args?.video_name;
        if (requestedTitleRaw && typeof requestedTitleRaw === 'string') {
          const normalizedTitle = requestedTitleRaw.trim().replace(/^[&quot;']|[&quot;']$/g, '');
          if (
            currentVideoTitle &&
            normalizedTitle.toLowerCase() === currentVideoTitle.toLowerCase()
          ) {

            // Seek back to paused position if we have one, then play
            const t = pausedPositionRef.current || 0;
            if (t > 0) {
              // console.log(`⏩ Resuming same video at ${t.toFixed(2)}s (fetch_video short-circuit)`);
            }
            if (t > 0 && videoPlayerRef.current?.seekTo) {
              videoPlayerRef.current.seekTo(t);
            }
            await videoPlayerRef.current?.play();
            return;
          }
        }
      } catch (e) {
        // console.warn('fetch_video same-title resume check failed:', e);
      }
      await playByTitle(args?.title || args?.video_title || args?.video_name);
      return;
    }

    if (toolName === 'pause_video') {
      if (uiState === UIState.VIDEO_PLAYING) {
        // Record the current playback position before pausing
        try {
          const t = videoPlayerRef.current?.getCurrentTime?.() ?? 0;
          pausedPositionRef.current = t;
          // console.log(`⏸️ Saved paused position at ${t.toFixed(2)}s`);
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
            // console.log(`▶️ Resuming video at ${t.toFixed(2)}s`);
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
      handleVideoClose();
      return;
    }

    if (toolName === 'next_video') {
      if (Array.isArray(videoTitles) && videoTitles.length > 0) {
        const idx = currentVideoTitle ? videoTitles.indexOf(currentVideoTitle) : -1;
        const nextIdx = idx >= 0 ? (idx + 1) % videoTitles.length : 0;
        const nextTitle = videoTitles[nextIdx];
        await playByTitle(nextTitle);
      } else {
        // console.warn('next_video called but no videoTitles available');
      }
      return;
    }

    if (toolName === 'show_trial_cta') {
      setShowCTA(true);
      return;
    }
  };

  const handleVideoEnd = () => {

    pausedPositionRef.current = 0;
    setPlayingVideoUrl(null);
    setUiState(UIState.CONVERSATION);
    setShowCTA(true);
  };

  const handleVideoClose = () => {

    pausedPositionRef.current = 0;
    setPlayingVideoUrl(null);
    setUiState(UIState.CONVERSATION);
    // Show CTA after video ends
    setShowCTA(true);
    // Prevent immediate re-open by ignoring fetch_video for a short window
    suppressFetchUntilRef.current = Date.now() + 1500;
    suppressReasonRef.current = 'close';
    // Small delay to ensure smooth transition
    setTimeout(() => {

    }, 300);
  };

  return {
    videoPlayerRef,
    handleRealTimeToolCall,
    handleVideoEnd,
    handleVideoClose
  };
}