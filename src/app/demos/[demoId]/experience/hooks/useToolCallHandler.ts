import { useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { UIState } from '@/lib/tavus/UI_STATES';
import { logError } from '@/lib/errors';
import type { Demo } from './useDemoData';
import type { InlineVideoPlayerHandle } from '../components/InlineVideoPlayer';

// Helper function to extract conversation ID from Tavus Daily URL
function extractConversationIdFromUrl(url: string): string | null {
  try {
    const match = url.match(/tavus\.daily\.co\/([a-zA-Z0-9]+)/);
    return match ? match[1] : null;
  } catch {
    return null;
  }
}

interface UseToolCallHandlerParams {
  demo: Demo | null;
  demoId: string;
  conversationUrl: string | null;
  uiState: UIState;
  playingVideoUrl: string | null;
  videoTitles: string[];
  currentVideoIndex: number | null;
  currentVideoTitle: string | null;
  videoPlayerRef: React.RefObject<InlineVideoPlayerHandle | null>;
  isE2E: boolean;
  setPlayingVideoUrl: (url: string | null) => void;
  setUiState: (state: UIState) => void;
  setCurrentVideoTitle: (title: string | null) => void;
  setCurrentVideoIndex: (index: number | null) => void;
  setShowCTA: (show: boolean) => void;
  setCtaOverrides: (overrides: any) => void;
  setAlert: (alert: { type: 'error' | 'info' | 'success'; message: string } | null) => void;
}

interface UseToolCallHandlerResult {
  handleRealTimeToolCall: (toolName: string, args: any) => Promise<void>;
  playVideoByTitle: (videoTitle: string) => Promise<void>;
  suppressFetchUntilRef: React.MutableRefObject<number>;
  suppressReasonRef: React.MutableRefObject<'close' | 'pause' | 'resume' | null>;
  pausedPositionRef: React.MutableRefObject<number>;
}

export function useToolCallHandler({
  demo,
  demoId,
  conversationUrl,
  uiState,
  playingVideoUrl,
  videoTitles,
  currentVideoIndex,
  currentVideoTitle,
  videoPlayerRef,
  isE2E,
  setPlayingVideoUrl,
  setUiState,
  setCurrentVideoTitle,
  setCurrentVideoIndex,
  setShowCTA,
  setCtaOverrides,
  setAlert,
}: UseToolCallHandlerParams): UseToolCallHandlerResult {
  const suppressFetchUntilRef = useRef<number>(0);
  const suppressReasonRef = useRef<'close' | 'pause' | 'resume' | null>(null);
  const pausedPositionRef = useRef<number>(0);

  // Helper function to play a video by title
  const playVideoByTitle = useCallback(async (videoTitle: string) => {
    // In E2E mode, use a placeholder URL
    if (isE2E) {
      setPlayingVideoUrl('about:blank');
      setUiState(UIState.VIDEO_PLAYING);
      setCurrentVideoTitle(videoTitle);
      if (Array.isArray(videoTitles) && videoTitles.length > 0) {
        const idx = videoTitles.indexOf(videoTitle);
        setCurrentVideoIndex(idx >= 0 ? idx : null);
      }
      return;
    }

    // Normalize title
    const normalizedTitle = videoTitle.trim().replace(/^['"]|['"]$/g, '');

    // Ensure CTA is hidden while fetching/playing
    setShowCTA(false);

    // Check if we already have this title in our available list (case-insensitive)
    const matchedTitle = videoTitles.find(
      (t) => t.toLowerCase() === normalizedTitle.toLowerCase()
    );
    const finalTitle = matchedTitle || normalizedTitle;

    // Look up video from database
    const { data: videoData, error: videoError } = await supabase
      .from('demo_videos')
      .select('storage_url, title')
      .eq('demo_id', demoId)
      .ilike('title', finalTitle)
      .single();

    if (videoError || !videoData) {
      console.warn(`Video not found: "${finalTitle}"`, videoError);
      // Try exact match as fallback
      const { data: exactData, error: exactError } = await supabase
        .from('demo_videos')
        .select('storage_url, title')
        .eq('demo_id', demoId)
        .eq('title', finalTitle)
        .single();

      if (exactError || !exactData) {
        console.warn(`Video not found (exact): "${finalTitle}"`, exactError);
        setAlert({ type: 'error', message: `Video "${videoTitle}" not found.` });
        return;
      }

      // Use exact match
      const storagePath = exactData.storage_url;
      const { data: signedUrlData, error: signedUrlError } = await supabase.storage
        .from('demo-videos')
        .createSignedUrl(storagePath, 3600);

      if (signedUrlError || !signedUrlData) {
        logError(signedUrlError, 'Failed to create signed URL');
        setAlert({ type: 'error', message: 'Could not generate a signed URL for this video.' });
        return;
      }

      // Track video viewing for Domo Score
      const currentConversationId = conversationUrl ? extractConversationIdFromUrl(conversationUrl) : demo?.tavus_conversation_id;
      if (currentConversationId && demo?.id) {
        try {
          await fetch('/api/track-video-view', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              conversation_id: currentConversationId,
              demo_id: demo.id,
              video_title: finalTitle
            })
          });
        } catch (error) {
          console.warn('Failed to track video view:', error);
        }
      }

      // New video source: reset any saved paused position
      pausedPositionRef.current = 0;
      setPlayingVideoUrl(signedUrlData.signedUrl);
      setUiState(UIState.VIDEO_PLAYING);
      setCurrentVideoTitle(exactData.title);
      if (Array.isArray(videoTitles) && videoTitles.length > 0) {
        const idx = videoTitles.indexOf(exactData.title);
        setCurrentVideoIndex(idx >= 0 ? idx : null);
      }
      return;
    }

    // Found video with ilike match
    const storagePath = videoData.storage_url;
    let finalVideoUrl: string;

    // If storage_url is already a full URL, use it directly
    if (/^https?:\/\//i.test(storagePath)) {
      finalVideoUrl = storagePath;
    } else {
      // Get signed URL for storage path
      const { data: signedUrlData, error: signedUrlError } = await supabase.storage
        .from('demo-videos')
        .createSignedUrl(storagePath, 3600);

      if (signedUrlError || !signedUrlData) {
        logError(signedUrlError, 'Failed to create signed URL');
        setAlert({ type: 'error', message: 'Could not generate a signed URL for this video.' });
        return;
      }
      finalVideoUrl = signedUrlData.signedUrl;
    }

    // Track video viewing for Domo Score
    const currentConversationId = conversationUrl ? extractConversationIdFromUrl(conversationUrl) : demo?.tavus_conversation_id;
    if (currentConversationId && demo?.id) {
      try {
        await fetch('/api/track-video-view', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            conversation_id: currentConversationId,
            demo_id: demo.id,
            video_title: videoData.title
          })
        });
      } catch (error) {
        console.warn('Failed to track video view:', error);
      }
    }

    // New video source: reset any saved paused position
    pausedPositionRef.current = 0;
    setPlayingVideoUrl(finalVideoUrl);
    setUiState(UIState.VIDEO_PLAYING);
    setCurrentVideoTitle(videoData.title);
    if (Array.isArray(videoTitles) && videoTitles.length > 0) {
      const idx = videoTitles.indexOf(videoData.title);
      setCurrentVideoIndex(idx >= 0 ? idx : null);
    }
  }, [demo, demoId, conversationUrl, videoTitles, isE2E, setPlayingVideoUrl, setUiState, setCurrentVideoTitle, setCurrentVideoIndex, setShowCTA, setAlert]);

  // Handle real-time tool calls from Daily.co
  const handleRealTimeToolCall = useCallback(async (toolName: string, args: any) => {

    // Check suppression window (e.g. if user just closed video)
    const now = Date.now();
    if (now < suppressFetchUntilRef.current) {
      const reason = suppressReasonRef.current;
      return;
    }

    // Handle fetch_video / play_video tool calls
    if (toolName === 'fetch_video' || toolName === 'play_video') {
      // Already playing the same video? Skip to avoid flicker
      if (uiState === UIState.VIDEO_PLAYING && playingVideoUrl) {
        return;
      }
      const videoTitle = args?.title || args?.video_title || args?.video_name;
      if (!videoTitle) {
        console.warn('No video title provided');
        return;
      }

      await playVideoByTitle(videoTitle);
      return;
    }

    // Handle pause_video tool call
    if (toolName === 'pause_video') {
      if (videoPlayerRef.current) {
        suppressReasonRef.current = 'pause';
        suppressFetchUntilRef.current = Date.now() + 1000;
        videoPlayerRef.current.pause();
      }
      return;
    }

    // Handle resume/play_video tool call (for resuming paused video)
    if (toolName === 'resume_video') {
      if (videoPlayerRef.current) {
        suppressReasonRef.current = 'resume';
        suppressFetchUntilRef.current = Date.now() + 1000;
        videoPlayerRef.current.play();
      }
      return;
    }

    // Handle close_video tool call
    if (toolName === 'close_video') {
      suppressReasonRef.current = 'close';
      suppressFetchUntilRef.current = Date.now() + 1000;
      setPlayingVideoUrl(null);
      setCurrentVideoTitle(null);
      setCurrentVideoIndex(null);
      setUiState(UIState.CONVERSATION);

      // Auto-show CTA when AI closes video (usually means trial request)
      setShowCTA(true);
      return;
    }

    // Handle next_video tool call
    if (toolName === 'next_video') {
      if (currentVideoIndex !== null && Array.isArray(videoTitles) && videoTitles.length > 0) {
        const nextIdx = (currentVideoIndex + 1) % videoTitles.length;
        const nextTitle = videoTitles[nextIdx];
        await playVideoByTitle(nextTitle);
      } else {
      }
      return;
    }

    // Handle show_trial_cta tool call
    if (toolName === 'show_trial_cta') {
      // Silently close any playing video first
      if (playingVideoUrl) {
        setPlayingVideoUrl(null);
        setCurrentVideoTitle(null);
        setCurrentVideoIndex(null);
        setUiState(UIState.CONVERSATION);
      }

      // Accept optional override fields from args
      if (args && typeof args === 'object') {
        setCtaOverrides({
          cta_title: args.cta_title ?? undefined,
          cta_message: args.cta_message ?? undefined,
          cta_button_text: args.cta_button_text ?? undefined,
          cta_button_url: args.cta_button_url ?? undefined,
        });
      }
      setShowCTA(true);
      return;
    }

    // Unknown tool call - ignore silently
  }, [uiState, playingVideoUrl, videoTitles, currentVideoIndex, currentVideoTitle, videoPlayerRef, playVideoByTitle, setPlayingVideoUrl, setUiState, setCurrentVideoTitle, setCurrentVideoIndex, setShowCTA, setCtaOverrides]);

  return {
    handleRealTimeToolCall,
    playVideoByTitle,
    suppressFetchUntilRef,
    suppressReasonRef,
    pausedPositionRef,
  };
}
