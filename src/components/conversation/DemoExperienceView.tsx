'use client';

import { useState, useRef, useCallback, useEffect, forwardRef, useImperativeHandle } from 'react';
import { CVIProvider } from '@/components/cvi/components/cvi-provider';
import { TavusConversationCVI } from '@/app/demos/[demoId]/experience/components/TavusConversationCVI';
import { InlineVideoPlayer } from '@/app/demos/[demoId]/experience/components/InlineVideoPlayer';
import type { InlineVideoPlayerHandle } from '@/app/demos/[demoId]/experience/components/InlineVideoPlayer';
import { UIState } from '@/lib/tavus/UI_STATES';
import { BusyErrorScreen, CTABanner, ConversationEndedScreen, PreCallLobby, DualPipOverlay, VideoOverlayControls } from '@/components/conversation';
import { analytics } from '@/lib/mixpanel';
import {
  formatTime,
  parseChaptersFromContext,
  findChapterAtTimestamp,
  type VideoChapter
} from '@/lib/video-context';

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
  returnUrl?: string; // Customer's website to redirect back to after conversation ends
  isPopup?: boolean; // Different behavior for popup embeds
  onClose?: () => void; // For popup - close the modal
  skipEndedScreen?: boolean; // Skip ConversationEndedScreen and just call onConversationEnd (for dashboard)

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
    },
    ref
  ) {
    // UI State
    const [uiState, setUiState] = useState<UIState>(UIState.IDLE);
    const [playingVideoUrl, setPlayingVideoUrl] = useState<string | null>(null);
    const [showCTA, setShowCTA] = useState(false);
    const [conversationEnded, setConversationEnded] = useState(false);
    const [startTime] = useState<number>(Date.now());

    const videoPlayerRef = useRef<InlineVideoPlayerHandle | null>(null);

    // Video context tracking
    const currentVideoRef = useRef<CurrentVideoMetadata | null>(null);
    const lastSentContextRef = useRef<string>('');

    // Expose methods to parent
    useImperativeHandle(ref, () => ({
      setShowCTA,
    }));

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

    // Track errors
    useEffect(() => {
      if (error) {
        analytics.demoError({
          demoId,
          error,
          source,
        });
      }
    }, [error, demoId, source]);

    // Mute video when playing - agent provides voiceover
    useEffect(() => {
      if (uiState === UIState.VIDEO_PLAYING && videoPlayerRef.current) {
        videoPlayerRef.current.setVolume(0);
      }
    }, [uiState, playingVideoUrl]);

    // Handle tool calls from conversation
    // Note: TavusConversationCVI calls onToolCall(toolName, args) with two arguments
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

          // Look up video from database (including metadata for Twelve Labs chapters)
          const { supabase } = await import('@/lib/supabase');
          const normalizedTitle = videoTitle.trim().replace(/^['"]|['"]$/g, '');

          // Try case-insensitive match first (use maybeSingle to avoid 406 errors)
          let { data: videoData, error: videoError } = await supabase
            .from('demo_videos')
            .select('storage_url, title, id, metadata')
            .eq('demo_id', demoId)
            .ilike('title', normalizedTitle)
            .maybeSingle();

          if (videoError || !videoData) {
            // Try exact match as fallback
            const exactResult = await supabase
              .from('demo_videos')
              .select('storage_url, title, id, metadata')
              .eq('demo_id', demoId)
              .eq('title', normalizedTitle)
              .maybeSingle();

            if (exactResult.error || !exactResult.data) {
              // Try fuzzy match with wildcards (partial title match)
              const fuzzyResult = await supabase
                .from('demo_videos')
                .select('storage_url, title, id, metadata')
                .eq('demo_id', demoId)
                .ilike('title', `%${normalizedTitle}%`)
                .limit(1);

              if (fuzzyResult.data && fuzzyResult.data.length > 0) {
                videoData = fuzzyResult.data[0];
              } else {
                // Try matching just the main keywords (before colon if present)
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

              // Try semantic search via Twelve Labs as last resort
              if (!videoData) {
                if (process.env.NODE_ENV !== 'production') {
                  console.log('[DemoExperienceView] Fuzzy match failed, trying semantic search for:', normalizedTitle);
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
                      // Get the video with highest confidence from semantic search
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
                  console.log('[DemoExperienceView] Available videos for this demo:', allVideos?.map(v => v.title));
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

          // If storage_url is already a full URL, use it directly
          if (/^https?:\/\//i.test(storagePath)) {
            finalVideoUrl = storagePath;
          } else {
            // Get signed URL for storage path
            const { data: signedUrlData, error: signedUrlError } = await supabase.storage
              .from('demo-videos')
              .createSignedUrl(storagePath, 3600);

            if (signedUrlError || !signedUrlData) {
              console.error('Failed to create signed URL:', signedUrlError);
              return;
            }
            finalVideoUrl = signedUrlData.signedUrl;
          }

          // Parse chapters from Twelve Labs generated context (if available)
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
          lastSentContextRef.current = ''; // Reset last sent context for new video

          setPlayingVideoUrl(finalVideoUrl);
          setUiState(UIState.VIDEO_PLAYING);
          setShowCTA(false);

          // Track video played
          analytics.videoPlayed({
            demoId,
            videoUrl: finalVideoUrl,
            videoTitle: videoData.title,
          });

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

        // Handle seek_video - jump to a specific timestamp
        if (toolName === 'seek_video') {
          if (uiState === UIState.VIDEO_PLAYING && videoPlayerRef.current?.seekTo) {
            const timestampStr = args?.timestamp || args?.time || '';
            // Parse timestamp in MM:SS or M:SS format
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

          // Auto-show CTA when AI closes video (usually means trial request)
          setShowCTA(true);

          // Track CTA shown
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
          // Silently close any playing video first
          if (playingVideoUrl) {
            currentVideoRef.current = null;
            lastSentContextRef.current = '';
            setPlayingVideoUrl(null);
            setUiState(UIState.CONVERSATION);
          }

          // Show CTA immediately
          setShowCTA(true);

          // Track CTA shown
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
      [onToolCall, demoId, ctaTitle, ctaButtonText, playingVideoUrl]
    );

    // Handle conversation end
    const handleConversationEnd = useCallback(() => {
      const durationSeconds = Math.floor((Date.now() - startTime) / 1000);

      // Track demo ended
      analytics.demoEnded({
        demoId,
        demoName,
        source,
        durationSeconds,
        conversationId: conversationId || undefined,
      });

      // For dashboard experience page, skip the ended screen and redirect immediately
      if (skipEndedScreen) {
        onConversationEnd();
        return;
      }

      // For embedded demos, show the ended screen with CTA and countdown
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

      // Track restart
      analytics.conversationRestarted({
        demoId,
        source,
      });

      onRestart?.();
    }, [onRestart, demoId, source]);

    // Handle video end
    const handleVideoEnd = useCallback(() => {
      // Track video ended
      if (playingVideoUrl) {
        analytics.videoEnded({
          demoId,
          videoUrl: playingVideoUrl,
        });
      }

      // Clear video context tracking
      currentVideoRef.current = null;
      lastSentContextRef.current = '';

      setPlayingVideoUrl(null);
      setUiState(UIState.CONVERSATION);
    }, [demoId, playingVideoUrl]);

    // Handle video close
    const handleVideoClose = useCallback(() => {
      // Track video closed
      if (playingVideoUrl) {
        analytics.videoClosed({
          demoId,
          videoUrl: playingVideoUrl,
        });
      }

      // Clear video context tracking
      currentVideoRef.current = null;
      lastSentContextRef.current = '';

      setPlayingVideoUrl(null);
      setUiState(UIState.CONVERSATION);
    }, [demoId, playingVideoUrl]);

    // Handle CTA click
    const handleCTAClick = useCallback(() => {
      // Track CTA clicked
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

    // ====== Video Context Tracking ======

    // Send video context to the API (which can forward to the agent)
    const sendVideoContext = useCallback(async (contextMessage: string) => {
      // Avoid duplicate messages
      if (contextMessage === lastSentContextRef.current) return;
      lastSentContextRef.current = contextMessage;

      // Log for debugging

      // Track the video context event
      analytics.videoContextSent({
        demoId,
        context: contextMessage,
        conversationId: conversationId || undefined,
      });
    }, [demoId, conversationId]);

    // Handle video pause - send context about where user paused
    const handleVideoPause = useCallback((currentTime: number) => {
      const video = currentVideoRef.current;
      if (!video) return;

      const formattedTime = formatTime(currentTime);
      let contextMessage = `User paused "${video.title}" at ${formattedTime}`;

      // Find current chapter if available
      if (video.chapters && video.chapters.length > 0) {
        const chapter = findChapterAtTimestamp(video.chapters, currentTime);
        if (chapter) {
          contextMessage += `. Currently viewing: "${chapter.title}"`;
        }
      }

      sendVideoContext(contextMessage);

      // Track pause analytics
      analytics.videoPaused({
        demoId,
        videoUrl: video.url,
        videoTitle: video.title,
        pausedAt: currentTime,
        formattedTime,
      });
    }, [demoId, sendVideoContext]);

    // Handle video seek - send context about new position
    const handleVideoSeek = useCallback((currentTime: number) => {
      const video = currentVideoRef.current;
      if (!video) return;

      const formattedTime = formatTime(currentTime);
      let contextMessage = `User seeked to ${formattedTime} in "${video.title}"`;

      // Find current chapter if available
      if (video.chapters && video.chapters.length > 0) {
        const chapter = findChapterAtTimestamp(video.chapters, currentTime);
        if (chapter) {
          contextMessage += `. Now viewing: "${chapter.title}"`;
        }
      }

      sendVideoContext(contextMessage);

      // Track seek analytics
      analytics.videoSeeked({
        demoId,
        videoUrl: video.url,
        videoTitle: video.title,
        seekedTo: currentTime,
        formattedTime,
      });
    }, [demoId, sendVideoContext]);

    // Handle periodic time updates (only when paused - user is examining content)
    const handleVideoTimeUpdate = useCallback((currentTime: number, isPaused: boolean) => {
      // Only send updates when paused (user is likely reading/examining)
      if (!isPaused) return;

      const video = currentVideoRef.current;
      if (!video) return;

      const formattedTime = formatTime(currentTime);

      // Find current chapter if available
      if (video.chapters && video.chapters.length > 0) {
        const chapter = findChapterAtTimestamp(video.chapters, currentTime);
        if (chapter) {
          const contextMessage = `User is examining "${chapter.title}" at ${formattedTime} in "${video.title}"`;
          sendVideoContext(contextMessage);
        }
      }
    }, [sendVideoContext]);

    // Initial loading state (fetching config)
    if (loading && !joiningCall) {
      return (
        <div className="min-h-screen bg-domo-bg-dark flex items-center justify-center">
          <div className="text-white text-lg">Loading demo...</div>
        </div>
      );
    }

    // Error state (but not if we're in lobby - show error in lobby instead)
    if (error && !showLobby) {
      return (
        <BusyErrorScreen
          error={error}
          onRetry={onRetry || (() => window.location.reload())}
        />
      );
    }

    // Pre-call lobby - show when lobby is enabled and no conversation URL yet
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
        <div className="min-h-screen bg-domo-bg-dark flex flex-col">
          {/* Main Content */}
          <main className="flex-1 relative">
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
              /* Conversation View - SINGLE instance that stays mounted, changes position */
              <>
                {/* Video overlay - shows when video is playing */}
                {uiState === UIState.VIDEO_PLAYING && playingVideoUrl && (
                  <div className="absolute inset-0 bg-black flex flex-col" style={{ zIndex: 10 }} data-testid="video-overlay">
                    {/* Video header */}
                    <div className="flex-shrink-0 bg-domo-bg-elevated/90 backdrop-blur text-white p-3 flex justify-between items-center border-b border-domo-border">
                      <h2 className="text-base font-semibold">{currentVideoRef.current?.title || 'Demo Video'}</h2>
                      <button
                        onClick={handleVideoClose}
                        className="text-domo-text-secondary hover:text-white p-1.5 transition-colors rounded-full hover:bg-white/10"
                        title="Close video"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
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
                      />

                      {/* Circular thumbnails - bottom center */}
                      <DualPipOverlay visible={true} />

                      {/* Control buttons - bottom right, same line as thumbnails */}
                      <VideoOverlayControls onLeave={handleConversationEnd} />
                    </div>
                  </div>
                )}

                {/* Conversation - hidden when video is playing, but stays mounted for WebRTC/audio */}
                <div
                  data-testid="conversation-container"
                  className={uiState === UIState.VIDEO_PLAYING
                    ? 'absolute -left-[9999px] -top-[9999px] w-1 h-1 overflow-hidden'
                    : 'w-full h-full flex items-center justify-center p-4'
                  }
                  aria-hidden={uiState === UIState.VIDEO_PLAYING}
                >
                  <div className="overflow-hidden flex flex-col bg-domo-bg-card border border-domo-border rounded-xl shadow-lg w-full h-full">
                    <div
                      className="relative flex-1 bg-domo-bg-dark"
                      style={{ height: '75vh', minHeight: '400px' }}
                    >
                      {conversationUrl ? (
                        <TavusConversationCVI
                          conversationUrl={conversationUrl}
                          onLeave={handleConversationEnd}
                          onToolCall={handleToolCall}
                          debugVideoTitles={debugVideoTitles}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-white">
                          Connecting...
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </>
            )}
          </main>

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
        </div>
      </CVIProvider>
    );
  }
);
