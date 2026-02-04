/**
 * ============================================================================
 * USE TOOL CALL HANDLER - Hook for Processing AI Tool Calls
 * ============================================================================
 *
 * This hook processes real-time tool calls from the Daily.co conversation.
 * It's used by the experience page to handle video playback, CTA display, etc.
 *
 * KEY ARCHITECTURE DECISIONS:
 *
 * 1. SUPPRESSION WINDOW (suppressFetchUntilRef, suppressReasonRef)
 *    After certain actions (close, pause, resume), we suppress fetch_video
 *    for 1 second. This prevents the AI from immediately re-fetching a video
 *    the user just closed, causing frustrating UX.
 *
 *    Example: User clicks "close video" → AI might say "let me show you..."
 *    Without suppression, video would immediately reopen.
 *
 * 2. VIDEO LOOKUP STRATEGY
 *    Similar to DemoExperienceView, we use fallback matching:
 *      - Case-insensitive match (ilike)
 *      - Exact match (eq)
 *    Note: This hook has FEWER fallbacks than DemoExperienceView.
 *    Consider using DemoExperienceView's 5-level strategy if needed.
 *
 * 3. SIGNED URL GENERATION
 *    Videos can be stored as:
 *      - Direct URLs (https://...)
 *      - Supabase storage paths (bucket/path/to/video.mp4)
 *    We detect which and generate signed URLs for storage paths.
 *
 * 4. DOMO SCORE TRACKING
 *    Every video view is tracked via /api/track-video-view for the
 *    "Platform Feature Interest" Domo Score criterion.
 *
 * RELATED FILES:
 *   - DemoExperienceView.tsx: Has more comprehensive video lookup
 *   - toolParser.ts: Parses tool names from various event formats
 *
 * ============================================================================
 */

import { useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { UIState } from '@/lib/tavus/UI_STATES';
import { logError } from '@/lib/errors';
import type { Demo } from './useDemoData';
import type { InlineVideoPlayerHandle } from '../components/InlineVideoPlayer';

// Helper function to extract conversation ID from Tavus Daily URL
// URL format: https://tavus.daily.co/{conversationId}
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
  // Suppression mechanism: Prevents AI from immediately re-fetching videos
  // after user actions like close/pause. Set to Date.now() + 1000ms.
  const suppressFetchUntilRef = useRef<number>(0);
  // Tracks WHY suppression is active (for debugging)
  const suppressReasonRef = useRef<'close' | 'pause' | 'resume' | null>(null);
  // Stores playback position when video is paused (for resume feature)
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
