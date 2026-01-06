import { supabase } from '@/lib/supabase';
import { logError } from '@/lib/errors';
import { UIState } from '@/lib/tavus/UI_STATES';

interface PlayVideoByTitleParams {
  videoTitle: string;
  isE2E: boolean;
  videoTitles: string[];
  demo: any;
  demoId: string;
  pausedPositionRef: React.MutableRefObject<number>;
  setShowCTA: (show: boolean) => void;
  setAlert: (alert: any) => void;
  setPlayingVideoUrl: (url: string | null) => void;
  setUiState: (state: UIState) => void;
  setCurrentVideoTitle: (title: string) => void;
  setCurrentVideoIndex: (index: number | null) => void;
  alert: any;
}

export async function playVideoByTitle(params: PlayVideoByTitleParams) {
  const {
    videoTitle,
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
  } = params;

  if (!videoTitle || typeof videoTitle !== 'string' || !videoTitle.trim()) {
    logError('Missing or invalid video title in fetch/next_video tool call', 'ToolCall Validation');
    return;
  }

  // Normalize incoming title (trim and remove a single leading/trailing quote)
  const normalizedTitle = videoTitle.trim().replace(/^["']|["']$/g, '');

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
      console.warn('⚠️ Demo id unavailable at tool call time; delaying fetch_video', {
        demo,
        demoId,
        title: normalizedTitle,
      });
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
      console.warn('Exact title match not found, attempting case-insensitive lookup for:', normalizedTitle);
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
      logError(signedUrlError, 'Failed to create signed URL');
      setAlert({ type: 'error', message: 'Could not generate a signed URL for this video.' });
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
  } catch (err: unknown) {
    logError(err, 'Unexpected error in playByTitle');
    setAlert({ type: 'error', message: 'An error occurred while loading the video.' });
  }
}

export function handleVideoEnd(
  pausedPositionRef: React.MutableRefObject<number>,
  setPlayingVideoUrl: (url: string | null) => void,
  setUiState: (state: UIState) => void,
  setShowCTA: (show: boolean) => void
) {
  pausedPositionRef.current = 0;
  setPlayingVideoUrl(null);
  setUiState(UIState.CONVERSATION);
  setShowCTA(true);
}

export function handleVideoClose(
  pausedPositionRef: React.MutableRefObject<number>,
  setPlayingVideoUrl: (url: string | null) => void,
  setUiState: (state: UIState) => void,
  setShowCTA: (show: boolean) => void,
  suppressFetchUntilRef: React.MutableRefObject<number>,
  suppressReasonRef: React.MutableRefObject<'close' | 'pause' | 'resume' | null>
) {
  pausedPositionRef.current = 0;
  setPlayingVideoUrl(null);
  setUiState(UIState.CONVERSATION);
  // Prevent immediate re-open by ignoring fetch_video for a short window
  suppressFetchUntilRef.current = Date.now() + 1500;
  suppressReasonRef.current = 'close';
  // Show CTA after a brief delay to ensure video overlay has unmounted
  // This prevents React batching issues where CTA might not render
  setTimeout(() => {
    if (process.env.NODE_ENV !== 'production') {
    }
    setShowCTA(true);
  }, 100);
  // Small delay to ensure smooth transition
  setTimeout(() => {
    if (process.env.NODE_ENV !== 'production') {
    }
  }, 300);
}
