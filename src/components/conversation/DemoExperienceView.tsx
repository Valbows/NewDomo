/**
 * ============================================================================
 * DEMO EXPERIENCE VIEW - Main Conversation UI Component
 * ============================================================================
 *
 * This is the primary UI component for the demo experience. It orchestrates:
 *   - Agent video conversation (via AgentConversationView + Daily.co)
 *   - Product video playback with chapter tracking
 *   - CTA display and tracking
 *   - Real-time transcript and insights panel
 *   - Analytics event tracking
 *
 * KEY ARCHITECTURE DECISIONS:
 *
 * 1. VIDEO LOOKUP FALLBACK STRATEGY (handleToolCall → fetch_video)
 *    When the AI calls fetch_video with a title, we try 5 levels of matching:
 *      Level 1: Case-insensitive exact match (ilike)
 *      Level 2: Exact match (eq)
 *      Level 3: Fuzzy match with wildcards (%title%)
 *      Level 4: Keyword extraction (first part before ":")
 *      Level 5: Semantic search via Twelve Labs API
 *    This ensures videos are found even with slight title variations.
 *
 * 2. VIDEO CONTEXT TRACKING (currentVideoRef, lastSentContextRef)
 *    - currentVideoRef: Holds metadata of the currently playing video
 *    - lastSentContextRef: Prevents duplicate context messages to analytics
 *    When user pauses/seeks, we send context about their position to analytics.
 *
 * 3. STATE MANAGEMENT
 *    - uiState: Controls which view is shown (IDLE, CONVERSATION, VIDEO_PLAYING)
 *    - transcript: Maintained here and synced from AgentConversationView
 *    - pendingTextMessage: Bridge for text input → Daily message sending
 *
 * RELATED FILES:
 *   - AgentConversationView.tsx: Daily.co integration and subtitle handling
 *   - useToolCallHandler.ts: Hook version of tool handling (for other pages)
 *   - InlineVideoPlayer.tsx: Video player with chapter support
 *
 * ============================================================================
 */

'use client';

import { useState, useRef, useCallback, useEffect, forwardRef, useImperativeHandle } from 'react';
import { CVIProvider } from '@/components/cvi/components/cvi-provider';
import { InlineVideoPlayer } from '@/app/demos/[demoId]/experience/components/InlineVideoPlayer';
import type { InlineVideoPlayerHandle } from '@/app/demos/[demoId]/experience/components/InlineVideoPlayer';
import { UIState } from '@/lib/tavus/UI_STATES';
import {
  BusyErrorScreen,
  CTABanner,
  ConversationEndedScreen,
  PreCallLobby,
  DualPipOverlay,
  VideoOverlayControls,
  AgentHeader,
  AgentConversationView,
  TextInputBar,
  HelpModal,
  SubtitleDisplay,
} from '@/components/conversation';
import { ResourcesPanel } from '@/components/resources';
import { useInsightsData } from '@/app/demos/[demoId]/experience/hooks/useInsightsData';
import { analytics } from '@/lib/mixpanel';
import {
  formatTime,
  parseChaptersFromContext,
  findChapterAtTimestamp,
  type VideoChapter,
} from '@/lib/video-context';
import type { TranscriptMessage } from './types';

interface CurrentVideoMetadata {
  title: string;
  url: string;
  demoVideoId?: string;
  generatedContext?: string;
  chapters?: VideoChapter[];
}

export interface DemoExperienceViewProps {
  // Demo info
  demoName: string;
  demoId: string;
  agentName?: string;

  // Conversation
  conversationUrl: string | null;
  conversationId?: string | null;

  // State
  loading: boolean;
  error: string | null;

  // Pre-call lobby
  showLobby?: boolean;
  onJoinCall?: () => void;
  joiningCall?: boolean;

  // CTA config
  ctaTitle?: string;
  ctaMessage?: string;
  ctaButtonText?: string;
  ctaButtonUrl?: string;

  // Post-conversation redirect
  returnUrl?: string;
  isPopup?: boolean;
  onClose?: () => void;
  skipEndedScreen?: boolean;

  // Callbacks
  onConversationEnd: () => void;
  onToolCall: (toolCall: any) => void;
  onCTAClick?: () => void;
  onRetry?: () => void;
  onRestart?: () => void;

  // Optional video titles for debugging
  debugVideoTitles?: string[];

  // Analytics source
  source?: 'embed' | 'experience';
  embedToken?: string;

  // Layout mode
  useNewLayout?: boolean;
}

export interface DemoExperienceViewHandle {
  setShowCTA: (show: boolean) => void;
}

export const DemoExperienceView = forwardRef<DemoExperienceViewHandle, DemoExperienceViewProps>(
  function DemoExperienceView(
    {
      demoName,
      demoId,
      agentName,
      conversationUrl,
      conversationId,
      loading,
      error,
      showLobby = true,
      onJoinCall,
      joiningCall = false,
      ctaTitle,
      ctaMessage,
      ctaButtonText,
      ctaButtonUrl,
      returnUrl,
      isPopup = false,
      onClose,
      skipEndedScreen = false,
      onConversationEnd,
      onToolCall,
      onCTAClick,
      onRetry,
      onRestart,
      debugVideoTitles = [],
      source = 'experience',
      embedToken,
      useNewLayout = true,
    },
    ref
  ) {
    // UI State
    const [uiState, setUiState] = useState<UIState>(UIState.IDLE);
    const [playingVideoUrl, setPlayingVideoUrl] = useState<string | null>(null);
    const [showCTA, setShowCTA] = useState(false);
    const [conversationEnded, setConversationEnded] = useState(false);
    const [startTime] = useState<number>(Date.now());
    const [currentVideoTime, setCurrentVideoTime] = useState<number>(0);

    // Transcript state for new layout
    const [transcript, setTranscript] = useState<TranscriptMessage[]>([]);
    const [isMicActive, setIsMicActive] = useState(true);
    const [isHelpOpen, setIsHelpOpen] = useState(false);
    const [currentSubtitle, setCurrentSubtitle] = useState<string | null>(null);
    const [pendingTextMessage, setPendingTextMessage] = useState<string | null>(null);

    const videoPlayerRef = useRef<InlineVideoPlayerHandle | null>(null);

    // Insights data hook
    const { insightsData, addVideoWatched } = useInsightsData({
      conversationId: conversationId || null,
      demoId,
    });

    // Video context tracking refs
    // currentVideoRef: Stores metadata of currently playing video (title, chapters, etc.)
    //                  Reset to null when video closes. Used for context-aware analytics.
    // lastSentContextRef: Prevents duplicate analytics messages when user repeatedly
    //                     pauses/seeks to same position. Only sends if context changed.
    const currentVideoRef = useRef<CurrentVideoMetadata | null>(null);
    const lastSentContextRef = useRef<string>('');

    // Expose methods to parent
    useImperativeHandle(ref, () => ({
      setShowCTA,
    }));

    // Track page view immediately on mount
    useEffect(() => {
      analytics.pageViewed({
        demoId,
        demoName,
        source,
        embedToken,
        referrer: typeof window !== 'undefined' ? document.referrer : undefined,
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // Empty deps = fire once on mount

    // Track demo started when conversation URL is available
    useEffect(() => {
      if (conversationUrl && demoId) {
        analytics.demoStarted({
          demoId,
          demoName,
          source,
          embedToken,
        });
      }
    }, [conversationUrl, demoId, demoName, source, embedToken]);

    // Track errors - distinguish generation failures from other errors
    useEffect(() => {
      if (error) {
        // Check if this is a generation/conversation start failure
        if (error.includes('Failed to start') || error.includes('conversation') || error.includes('Tavus')) {
          analytics.generationFailed({
            demoId,
            errorMessage: error,
            source,
          });
        } else {
          analytics.demoError({
            demoId,
            error,
            source,
          });
        }
      }
    }, [error, demoId, source]);

    // Mute video when playing - agent provides voiceover
    useEffect(() => {
      if (uiState === UIState.VIDEO_PLAYING && videoPlayerRef.current) {
        videoPlayerRef.current.setVolume(0);
      }
    }, [uiState, playingVideoUrl]);

    // Handle tool calls from conversation
    const handleToolCall = useCallback(
      async (toolName: string, args: any) => {
        // Handle fetch_video - look up the video by title and play it
        if (toolName === 'fetch_video') {
          if (process.env.NODE_ENV !== 'production') {
            console.log('[DemoExperienceView] fetch_video called', { args, demoId });
          }
          const videoTitle = args?.title || args?.video_title || args?.video_name;
          if (!videoTitle) {
            console.warn('fetch_video called without a title');
            return;
          }

          // Look up video from database using 5-level fallback strategy
          // This ensures we find videos even when the AI uses slight title variations
          const { supabase } = await import('@/lib/supabase');
          const normalizedTitle = videoTitle.trim().replace(/^['"]|['"]$/g, '');

          // LEVEL 1: Case-insensitive exact match (most common success path)
          let { data: videoData, error: videoError } = await supabase
            .from('demo_videos')
            .select('storage_url, title, id, metadata')
            .eq('demo_id', demoId)
            .ilike('title', normalizedTitle)
            .maybeSingle();

          if (videoError || !videoData) {
            // LEVEL 2: Exact match (handles case where ilike fails but exact works)
            const exactResult = await supabase
              .from('demo_videos')
              .select('storage_url, title, id, metadata')
              .eq('demo_id', demoId)
              .eq('title', normalizedTitle)
              .maybeSingle();

            if (exactResult.error || !exactResult.data) {
              // LEVEL 3: Fuzzy match - handles partial titles or extra words
              const fuzzyResult = await supabase
                .from('demo_videos')
                .select('storage_url, title, id, metadata')
                .eq('demo_id', demoId)
                .ilike('title', `%${normalizedTitle}%`)
                .limit(1);

              if (fuzzyResult.data && fuzzyResult.data.length > 0) {
                videoData = fuzzyResult.data[0];
              } else {
                // LEVEL 4: Keyword extraction - for titles like "Product: Feature Overview"
                // extracts "Product" and searches for videos containing that keyword
                const mainKeyword = normalizedTitle.split(':')[0].trim();
                if (mainKeyword && mainKeyword !== normalizedTitle) {
                  const keywordResult = await supabase
                    .from('demo_videos')
                    .select('storage_url, title, id, metadata')
                    .eq('demo_id', demoId)
                    .ilike('title', `%${mainKeyword}%`)
                    .limit(1);

                  if (keywordResult.data && keywordResult.data.length > 0) {
                    videoData = keywordResult.data[0];
                  }
                }
              }

              // LEVEL 5: Semantic search via Twelve Labs (last resort)
              // Uses AI-powered video understanding to find videos by content/meaning
              // e.g., "pricing overview" might match "Cost and Plans Breakdown"
              if (!videoData) {
                if (process.env.NODE_ENV !== 'production') {
                  console.log(
                    '[DemoExperienceView] Fuzzy match failed, trying semantic search for:',
                    normalizedTitle
                  );
                }

                try {
                  const searchResponse = await fetch('/api/twelve-labs/search', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ query: normalizedTitle, demoId }),
                  });

                  if (searchResponse.ok) {
                    const searchData = await searchResponse.json();
                    if (searchData.results && searchData.results.length > 0) {
                      const bestMatch = searchData.results[0];
                      if (bestMatch.demoVideoId) {
                        const { data: semanticVideo } = await supabase
                          .from('demo_videos')
                          .select('storage_url, title, id, metadata')
                          .eq('id', bestMatch.demoVideoId)
                          .maybeSingle();

                        if (semanticVideo) {
                          if (process.env.NODE_ENV !== 'production') {
                            console.log('[DemoExperienceView] Semantic search found video:', {
                              query: normalizedTitle,
                              foundTitle: semanticVideo.title,
                              confidence: bestMatch.confidence,
                            });
                          }
                          videoData = semanticVideo;
                        }
                      }
                    }
                  }
                } catch (searchError) {
                  if (process.env.NODE_ENV !== 'production') {
                    console.warn('[DemoExperienceView] Semantic search failed:', searchError);
                  }
                }
              }

              // If still no video found, log and return
              if (!videoData) {
                console.warn(`Video not found: "${normalizedTitle}" for demoId: ${demoId}`, videoError);
                if (process.env.NODE_ENV !== 'production') {
                  const { data: allVideos } = await supabase
                    .from('demo_videos')
                    .select('title')
                    .eq('demo_id', demoId);
                  console.log(
                    '[DemoExperienceView] Available videos for this demo:',
                    allVideos?.map((v) => v.title)
                  );
                }
                return;
              }
            } else {
              videoData = exactResult.data;
            }
          }

          if (process.env.NODE_ENV !== 'production') {
            console.log('[DemoExperienceView] Video found:', { title: videoData.title, id: videoData.id });
          }

          // Determine the final video URL
          let finalVideoUrl: string;
          const storagePath = videoData.storage_url;

          if (/^https?:\/\//i.test(storagePath)) {
            finalVideoUrl = storagePath;
          } else {
            const { data: signedUrlData, error: signedUrlError } = await supabase.storage
              .from('demo-videos')
              .createSignedUrl(storagePath, 3600);

            if (signedUrlError || !signedUrlData) {
              console.error('Failed to create signed URL:', signedUrlError);
              return;
            }
            finalVideoUrl = signedUrlData.signedUrl;
          }

          // Parse chapters from Twelve Labs generated context
          let chapters: VideoChapter[] = [];
          const generatedContext = videoData.metadata?.twelvelabs?.generatedContext;
          if (generatedContext) {
            chapters = parseChaptersFromContext(generatedContext);
            if (process.env.NODE_ENV !== 'production' && chapters.length > 0) {
              console.log('[DemoExperienceView] Parsed chapters from Twelve Labs:', chapters);
            }
          }

          // Set up video context tracking
          const videoMetadata: CurrentVideoMetadata = {
            title: videoData.title,
            url: finalVideoUrl,
            demoVideoId: videoData.id,
            generatedContext,
            chapters,
          };

          currentVideoRef.current = videoMetadata;
          lastSentContextRef.current = '';

          setPlayingVideoUrl(finalVideoUrl);
          setUiState(UIState.VIDEO_PLAYING);
          setShowCTA(false);

          // Track video played
          analytics.videoPlayed({
            demoId,
            videoUrl: finalVideoUrl,
            videoTitle: videoData.title,
          });

          // Add to insights panel videos watched
          addVideoWatched(videoData.title);

          // Also call parent handler
          onToolCall({ name: toolName, args });
          return;
        }

        // Handle pause_video
        if (toolName === 'pause_video') {
          videoPlayerRef.current?.pause?.();
          onToolCall({ name: toolName, args });
          return;
        }

        // Handle play_video (resume)
        if (toolName === 'play_video') {
          videoPlayerRef.current?.play?.();
          onToolCall({ name: toolName, args });
          return;
        }

        // Handle seek_video
        if (toolName === 'seek_video') {
          if (uiState === UIState.VIDEO_PLAYING && videoPlayerRef.current?.seekTo) {
            const timestampStr = args?.timestamp || args?.time || '';
            const parts = timestampStr.toString().split(':');
            let seconds = 0;
            if (parts.length === 2) {
              const mins = parseInt(parts[0], 10) || 0;
              const secs = parseInt(parts[1], 10) || 0;
              seconds = mins * 60 + secs;
            } else if (parts.length === 1) {
              seconds = parseInt(parts[0], 10) || 0;
            }
            if (seconds >= 0) {
              videoPlayerRef.current.seekTo(seconds);
            }
          }
          onToolCall({ name: toolName, args });
          return;
        }

        // Handle close_video
        if (toolName === 'close_video') {
          currentVideoRef.current = null;
          lastSentContextRef.current = '';
          setPlayingVideoUrl(null);
          setUiState(UIState.CONVERSATION);

          // Auto-show CTA when AI closes video
          setShowCTA(true);

          analytics.ctaShown({
            demoId,
            ctaTitle,
            ctaButtonText,
          });

          onToolCall({ name: toolName, args });
          return;
        }

        // Handle show_trial_cta
        if (toolName === 'show_trial_cta' || toolName === 'show_cta') {
          if (playingVideoUrl) {
            currentVideoRef.current = null;
            lastSentContextRef.current = '';
            setPlayingVideoUrl(null);
            setUiState(UIState.CONVERSATION);
          }

          setShowCTA(true);

          analytics.ctaShown({
            demoId,
            ctaTitle,
            ctaButtonText,
          });

          onToolCall({ name: toolName, args });
          return;
        }

        // Unknown tool call - pass to parent
        onToolCall({ name: toolName, args });
      },
      [onToolCall, demoId, ctaTitle, ctaButtonText, playingVideoUrl, addVideoWatched]
    );

    // Handle conversation end
    const handleConversationEnd = useCallback(() => {
      const durationSeconds = Math.floor((Date.now() - startTime) / 1000);

      analytics.demoEnded({
        demoId,
        demoName,
        source,
        durationSeconds,
        conversationId: conversationId || undefined,
      });

      if (skipEndedScreen) {
        onConversationEnd();
        return;
      }

      setConversationEnded(true);
      setUiState(UIState.IDLE);
      setShowCTA(true);

      onConversationEnd();
    }, [onConversationEnd, demoId, demoName, source, conversationId, startTime, skipEndedScreen]);

    // Handle restart conversation
    const handleRestartConversation = useCallback(() => {
      setConversationEnded(false);
      setShowCTA(false);
      setUiState(UIState.IDLE);

      analytics.conversationRestarted({
        demoId,
        source,
      });

      onRestart?.();
    }, [onRestart, demoId, source]);

    // Handle video end
    const handleVideoEnd = useCallback(() => {
      if (playingVideoUrl) {
        analytics.videoEnded({
          demoId,
          videoUrl: playingVideoUrl,
        });
      }

      currentVideoRef.current = null;
      lastSentContextRef.current = '';

      setPlayingVideoUrl(null);
      setUiState(UIState.CONVERSATION);
    }, [demoId, playingVideoUrl]);

    // Handle video close
    const handleVideoClose = useCallback(() => {
      if (playingVideoUrl) {
        analytics.videoClosed({
          demoId,
          videoUrl: playingVideoUrl,
        });
      }

      currentVideoRef.current = null;
      lastSentContextRef.current = '';

      setPlayingVideoUrl(null);
      setUiState(UIState.CONVERSATION);
    }, [demoId, playingVideoUrl]);

    // Handle CTA click
    const handleCTAClick = useCallback(() => {
      analytics.ctaClicked({
        demoId,
        ctaTitle,
        ctaButtonUrl,
      });

      onCTAClick?.();
    }, [onCTAClick, demoId, ctaTitle, ctaButtonUrl]);

    // Handle CTA close
    const handleCTAClose = useCallback(() => {
      analytics.ctaClosed({ demoId });
      setShowCTA(false);
    }, [demoId]);

    // Handle chapter click from resources panel
    const handleChapterClick = useCallback((timestamp: number) => {
      if (videoPlayerRef.current?.seekTo) {
        videoPlayerRef.current.seekTo(timestamp);
      }
    }, []);

    // Handle transcript updates from AgentConversationView
    const handleTranscriptUpdate = useCallback((messages: TranscriptMessage[]) => {
      setTranscript(messages);
    }, []);

    // Handle subtitle changes from AgentConversationView
    const handleSubtitleChange = useCallback((text: string | null) => {
      setCurrentSubtitle(text);
    }, []);

    // Handle text message sent confirmation
    const handleTextMessageSent = useCallback(() => {
      setPendingTextMessage(null);
    }, []);

    // Handle text input message send
    const handleSendMessage = useCallback((message: string) => {
      // Add to local transcript
      const newMessage: TranscriptMessage = {
        id: `user-input-${Date.now()}`,
        role: 'user',
        content: message,
        timestamp: new Date(),
      };
      setTranscript((prev) => [...prev, newMessage]);

      // Send message to the agent via Daily
      setPendingTextMessage(message);

      if (process.env.NODE_ENV !== 'production') {
        console.log('[DemoExperienceView] Sending text message to agent:', message);
      }
    }, []);

    // Handle mic toggle - user clicked the button
    const handleMicToggle = useCallback(() => {
      setIsMicActive((prev) => !prev);
    }, []);

    // Handle help click
    const handleHelpClick = useCallback(() => {
      setIsHelpOpen(true);
    }, []);

    // Video context tracking
    const sendVideoContext = useCallback(
      async (contextMessage: string) => {
        if (contextMessage === lastSentContextRef.current) return;
        lastSentContextRef.current = contextMessage;

        analytics.videoContextSent({
          demoId,
          context: contextMessage,
          conversationId: conversationId || undefined,
        });
      },
      [demoId, conversationId]
    );

    const handleVideoPause = useCallback(
      (currentTime: number) => {
        const video = currentVideoRef.current;
        if (!video) return;

        const formattedTime = formatTime(currentTime);
        let contextMessage = `User paused "${video.title}" at ${formattedTime}`;

        if (video.chapters && video.chapters.length > 0) {
          const chapter = findChapterAtTimestamp(video.chapters, currentTime);
          if (chapter) {
            contextMessage += `. Currently viewing: "${chapter.title}"`;
          }
        }

        sendVideoContext(contextMessage);

        analytics.videoPaused({
          demoId,
          videoUrl: video.url,
          videoTitle: video.title,
          pausedAt: currentTime,
          formattedTime,
        });
      },
      [demoId, sendVideoContext]
    );

    const handleVideoSeek = useCallback(
      (currentTime: number) => {
        const video = currentVideoRef.current;
        if (!video) return;

        const formattedTime = formatTime(currentTime);
        let contextMessage = `User seeked to ${formattedTime} in "${video.title}"`;

        if (video.chapters && video.chapters.length > 0) {
          const chapter = findChapterAtTimestamp(video.chapters, currentTime);
          if (chapter) {
            contextMessage += `. Now viewing: "${chapter.title}"`;
          }
        }

        sendVideoContext(contextMessage);

        analytics.videoSeeked({
          demoId,
          videoUrl: video.url,
          videoTitle: video.title,
          seekedTo: currentTime,
          formattedTime,
        });
      },
      [demoId, sendVideoContext]
    );

    const handleVideoTimeUpdate = useCallback(
      (currentTime: number, isPaused: boolean) => {
        setCurrentVideoTime(currentTime);

        if (!isPaused) return;

        const video = currentVideoRef.current;
        if (!video) return;

        const formattedTime = formatTime(currentTime);

        if (video.chapters && video.chapters.length > 0) {
          const chapter = findChapterAtTimestamp(video.chapters, currentTime);
          if (chapter) {
            const contextMessage = `User is examining "${chapter.title}" at ${formattedTime} in "${video.title}"`;
            sendVideoContext(contextMessage);
          }
        }
      },
      [sendVideoContext]
    );

    // Initial loading state
    if (loading && !joiningCall) {
      return (
        <div className="min-h-screen bg-domo-bg-dark flex items-center justify-center">
          <div className="text-white text-lg">Loading demo...</div>
        </div>
      );
    }

    // Error state
    if (error && !showLobby) {
      return <BusyErrorScreen error={error} onRetry={onRetry || (() => window.location.reload())} />;
    }

    // Pre-call lobby
    if (showLobby && !conversationUrl && onJoinCall) {
      return (
        <PreCallLobby
          demoName={demoName}
          agentName={agentName}
          onJoinCall={onJoinCall}
          loading={joiningCall}
          error={error}
        />
      );
    }

    return (
      <CVIProvider>
        <div className="h-screen bg-domo-bg-dark flex flex-col overflow-hidden">
          {/* Header */}
          <AgentHeader agentName={agentName || demoName} onHelpClick={handleHelpClick} />

          {/* Main content area */}
          <div className="flex-1 flex overflow-hidden">
            {/* Left sidebar - Resources Panel */}
            <aside className="w-80 flex-shrink-0 border-r border-domo-border overflow-hidden">
              <ResourcesPanel
                insightsData={insightsData}
                currentVideoChapters={currentVideoRef.current?.chapters || []}
                currentVideoTime={currentVideoTime}
                currentVideoTitle={currentVideoRef.current?.title}
                isVideoPlaying={uiState === UIState.VIDEO_PLAYING}
                onChapterClick={handleChapterClick}
                transcript={transcript}
              />
            </aside>

            {/* Main content */}
            <main className="flex-1 flex flex-col relative overflow-hidden">
              {/* Conversation Ended State */}
              {conversationEnded ? (
                <ConversationEndedScreen
                  ctaUrl={ctaButtonUrl}
                  ctaButtonText={ctaButtonText || 'Learn More'}
                  returnUrl={returnUrl}
                  isPopup={isPopup}
                  onClose={onClose}
                />
              ) : (
                <>
                  {/* Video overlay - shows when video is playing */}
                  {uiState === UIState.VIDEO_PLAYING && playingVideoUrl && (
                    <div
                      className="absolute inset-0 bg-black flex flex-col"
                      style={{ zIndex: 10 }}
                      data-testid="video-overlay"
                    >
                      {/* Video header */}
                      <div className="flex-shrink-0 bg-domo-bg-elevated/90 backdrop-blur text-white p-3 flex justify-between items-center border-b border-domo-border">
                        <h2 className="text-base font-semibold">
                          {currentVideoRef.current?.title || 'Demo Video'}
                        </h2>
                        <button
                          onClick={handleVideoClose}
                          className="text-domo-text-secondary hover:text-white p-1.5 transition-colors rounded-full hover:bg-white/10"
                          title="Close video"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M6 18L18 6M6 6l12 12"
                            />
                          </svg>
                        </button>
                      </div>

                      {/* Video player area */}
                      <div className="flex-1 bg-black relative overflow-hidden">
                        <InlineVideoPlayer
                          ref={videoPlayerRef}
                          videoUrl={playingVideoUrl}
                          videoTitle={currentVideoRef.current?.title}
                          chapters={currentVideoRef.current?.chapters}
                          onClose={handleVideoClose}
                          onVideoEnd={handleVideoEnd}
                          onPause={handleVideoPause}
                          onSeek={handleVideoSeek}
                          onTimeUpdate={handleVideoTimeUpdate}
                          // Analytics callbacks
                          onVideoError={(err) => {
                            analytics.videoLoadFailure({
                              demoId,
                              videoUrl: playingVideoUrl || '',
                              errorCode: err.code,
                              errorMessage: err.message,
                              networkState: err.networkState,
                              source,
                            });
                          }}
                          onVideoStalled={(details) => {
                            analytics.videoStalled({
                              demoId,
                              videoUrl: playingVideoUrl || '',
                              currentTime: details.currentTime,
                              duration: details.duration,
                              source,
                            });
                          }}
                          onVideoStarted={(details) => {
                            analytics.videoStarted({
                              demoId,
                              videoUrl: playingVideoUrl || '',
                              latency_ms: details.latency_ms,
                              source,
                            });
                          }}
                          onVideoProgress={(details) => {
                            analytics.videoProgress({
                              demoId,
                              videoUrl: playingVideoUrl || '',
                              depth_percentage: details.depth_percentage,
                              currentTime: details.currentTime,
                              duration: details.duration,
                              source,
                            });
                          }}
                        />

                        {/* Circular thumbnails - bottom center */}
                        <DualPipOverlay visible={true} />

                        {/* Control buttons - bottom right */}
                        <VideoOverlayControls onLeave={handleConversationEnd} />
                      </div>
                    </div>
                  )}

                  {/* Agent Conversation View - main content area */}
                  <div
                    data-testid="conversation-container"
                    className={
                      uiState === UIState.VIDEO_PLAYING
                        ? 'absolute -left-[9999px] -top-[9999px] w-1 h-1 overflow-hidden'
                        : 'flex-1 flex flex-col'
                    }
                    aria-hidden={uiState === UIState.VIDEO_PLAYING}
                  >
                    {conversationUrl ? (
                      <AgentConversationView
                        conversationUrl={conversationUrl}
                        agentName={agentName}
                        onLeave={handleConversationEnd}
                        onToolCall={handleToolCall}
                        onTranscriptUpdate={handleTranscriptUpdate}
                        onSubtitleChange={handleSubtitleChange}
                        isMicMuted={!isMicActive}
                        debugVideoTitles={debugVideoTitles}
                        pendingTextMessage={pendingTextMessage}
                        onTextMessageSent={handleTextMessageSent}
                      />
                    ) : (
                      <div className="flex-1 flex items-center justify-center text-white">Connecting...</div>
                    )}
                  </div>
                </>
              )}

              {/* CTA Banner */}
              {showCTA && ctaButtonUrl && (
                <CTABanner
                  title={ctaTitle}
                  message={ctaMessage}
                  buttonText={ctaButtonText}
                  buttonUrl={ctaButtonUrl}
                  onButtonClick={handleCTAClick}
                  onClose={handleCTAClose}
                />
              )}
            </main>
          </div>

          {/* Subtitles - positioned above input bar, always visible during conversation */}
          {!conversationEnded && currentSubtitle && (
            <div className="relative z-50 px-4 pb-2">
              <div className="max-w-2xl mx-auto">
                <div className="bg-black/80 backdrop-blur-md rounded-2xl px-6 py-4 shadow-xl border border-white/10">
                  <p className="text-white text-lg leading-relaxed text-center font-medium">
                    &ldquo;{currentSubtitle}&rdquo;
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Bottom input bar - always visible when not ended */}
          {!conversationEnded && (
            <TextInputBar
              onSendMessage={handleSendMessage}
              onMicToggle={handleMicToggle}
              onEndCall={handleConversationEnd}
              isMicActive={isMicActive}
              disabled={!conversationUrl}
            />
          )}

          {/* Help Modal */}
          <HelpModal isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} agentName={agentName} />
        </div>
      </CVIProvider>
    );
  }
);
