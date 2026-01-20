'use client';

import { useState, useRef, useCallback, useEffect, forwardRef, useImperativeHandle } from 'react';
import { CVIProvider } from '@/components/cvi/components/cvi-provider';
import { useActiveSpeakerId, useLocalSessionId } from '@daily-co/daily-react';
import { TavusConversationCVI } from '@/app/demos/[demoId]/experience/components/TavusConversationCVI';
import { InlineVideoPlayer } from '@/app/demos/[demoId]/experience/components/InlineVideoPlayer';
import type { InlineVideoPlayerHandle } from '@/app/demos/[demoId]/experience/components/InlineVideoPlayer';
import { UIState } from '@/lib/tavus/UI_STATES';
import { BusyErrorScreen, CTABanner, ConversationEndedScreen, PreCallLobby, pipStyles, DualPipOverlay } from '@/components/conversation';
import { useReplicaIDs } from '@/components/cvi/hooks/use-replica-ids';
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

/**
 * Video overlay component with audio ducking
 * Needs to be inside CVIProvider to use Daily hooks
 */
interface VideoOverlayWithDuckingProps {
  videoUrl: string;
  videoTitle?: string;
  chapters?: VideoChapter[];
  videoPlayerRef: React.MutableRefObject<InlineVideoPlayerHandle | null>;
  onClose: () => void;
  onVideoEnd: () => void;
  onPause: (currentTime: number) => void;
  onSeek: (currentTime: number) => void;
  onTimeUpdate: (currentTime: number, isPaused: boolean) => void;
}

function VideoOverlayWithDucking({
  videoUrl,
  videoTitle,
  chapters,
  videoPlayerRef,
  onClose,
  onVideoEnd,
  onPause,
  onSeek,
  onTimeUpdate,
}: VideoOverlayWithDuckingProps) {
  const replicaIds = useReplicaIDs();
  const localSessionId = useLocalSessionId();
  const activeSpeakerId = useActiveSpeakerId();
  const previousVolumeRef = useRef<number>(1);
  const isDuckedRef = useRef<boolean>(false);

  // Audio ducking: lower video volume ONLY when USER is speaking
  // This helps the agent hear the user better
  // When agent speaks, keep video at normal volume (agent voice comes separately)
  useEffect(() => {
    const player = videoPlayerRef.current;
    if (!player) return;

    const isUserSpeaking = activeSpeakerId === localSessionId && localSessionId !== undefined;

    if (isUserSpeaking && !isDuckedRef.current) {
      // User started speaking - duck the video audio so agent can hear
      previousVolumeRef.current = player.getVolume();
      player.setVolume(0.1); // Low but not muted
      isDuckedRef.current = true;
      if (process.env.NODE_ENV !== 'production') {
        console.log('[AudioDucking] Ducking video - user speaking');
      }
    } else if (!isUserSpeaking && isDuckedRef.current) {
      // User stopped speaking - restore volume
      player.setVolume(previousVolumeRef.current || 1);
      isDuckedRef.current = false;
      if (process.env.NODE_ENV !== 'production') {
        console.log('[AudioDucking] Restoring video volume');
      }
    }
  }, [activeSpeakerId, localSessionId, videoPlayerRef]);

  // Ensure volume is set to full on mount
  useEffect(() => {
    const player = videoPlayerRef.current;
    if (player) {
      player.setVolume(1);
      previousVolumeRef.current = 1;
    }
  }, [videoPlayerRef]);

  return (
    <div
      className="absolute inset-0 bg-black flex flex-col z-30"
      data-testid="video-overlay"
    >
      <div className="flex-shrink-0 bg-domo-bg-elevated text-white p-4 flex justify-between items-center border-b border-domo-border">
        <h2 className="text-lg font-semibold">Demo Video</h2>
        <button
          data-testid="button-close-video"
          onClick={onClose}
          className="text-domo-text-secondary hover:text-white p-2 transition-colors"
          title="Close video"
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>
      <div className="flex-1 p-4 bg-domo-bg-dark relative">
        <div className="w-full h-full max-w-6xl mx-auto">
          <InlineVideoPlayer
            ref={videoPlayerRef}
            videoUrl={videoUrl}
            videoTitle={videoTitle}
            chapters={chapters}
            onClose={onClose}
            onVideoEnd={onVideoEnd}
            onPause={onPause}
            onSeek={onSeek}
            onTimeUpdate={onTimeUpdate}
          />
        </div>
        {/* Dual PiP overlay showing Domo agent and User */}
        <DualPipOverlay visible={true} />
      </div>
    </div>
  );
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

          // Try case-insensitive match first
          let { data: videoData, error: videoError } = await supabase
            .from('demo_videos')
            .select('storage_url, title, id, metadata')
            .eq('demo_id', demoId)
            .ilike('title', normalizedTitle)
            .single();

          if (videoError || !videoData) {
            // Try exact match as fallback
            const exactResult = await supabase
              .from('demo_videos')
              .select('storage_url, title, id, metadata')
              .eq('demo_id', demoId)
              .eq('title', normalizedTitle)
              .single();

            if (exactResult.error || !exactResult.data) {
              // Try semantic search via Twelve Labs as last resort
              if (process.env.NODE_ENV !== 'production') {
                console.log('[DemoExperienceView] Exact match failed, trying semantic search for:', normalizedTitle);
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
                        .single();

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
        <style dangerouslySetInnerHTML={{ __html: pipStyles }} />
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
              /* Conversation View */
              <div
                data-testid="conversation-container"
                data-pip={uiState === UIState.VIDEO_PLAYING ? 'true' : 'false'}
                className={`${
                  uiState === UIState.VIDEO_PLAYING
                    ? 'fixed bottom-4 right-4 w-96 h-72 z-50 shadow-2xl'
                    : 'w-full h-full flex items-center justify-center p-4'
                } transition-all duration-300`}
              >
                <div className="bg-domo-bg-card border border-domo-border rounded-xl shadow-lg overflow-hidden w-full h-full flex flex-col">
                  {/* Minimal header - only show expand button in PiP mode */}
                  {uiState === UIState.VIDEO_PLAYING && (
                    <div className="p-2 bg-domo-primary text-white flex justify-end items-center flex-shrink-0">
                      <button
                        data-testid="button-expand-conversation"
                        onClick={() => {
                          setPlayingVideoUrl(null);
                          setUiState(UIState.CONVERSATION);
                        }}
                        className="text-white hover:text-white/80 p-1"
                        title="Expand conversation"
                      >
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"
                          />
                        </svg>
                      </button>
                    </div>
                  )}
                  <div
                    className={`relative flex-1 ${uiState === UIState.VIDEO_PLAYING ? 'bg-transparent' : 'bg-domo-bg-dark'}`}
                    style={{
                      height: uiState === UIState.VIDEO_PLAYING ? '60px' : '75vh',
                      minHeight: uiState === UIState.VIDEO_PLAYING ? '60px' : '400px',
                      position: uiState === UIState.VIDEO_PLAYING ? 'fixed' : 'relative',
                      bottom: uiState === UIState.VIDEO_PLAYING ? '16px' : 'auto',
                      right: uiState === UIState.VIDEO_PLAYING ? '16px' : 'auto',
                      left: uiState === UIState.VIDEO_PLAYING ? 'auto' : undefined,
                      width: uiState === UIState.VIDEO_PLAYING ? 'auto' : undefined,
                      zIndex: uiState === UIState.VIDEO_PLAYING ? 50 : undefined,
                    }}
                  >
                    {conversationUrl ? (
                      <div className={uiState === UIState.VIDEO_PLAYING ? 'pip-video-layout' : ''}>
                        <TavusConversationCVI
                          conversationUrl={conversationUrl}
                          onLeave={handleConversationEnd}
                          onToolCall={handleToolCall}
                          debugVideoTitles={debugVideoTitles}
                        />
                      </div>
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-white">
                        Connecting...
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Video Player - Full screen when playing with dual PiP and audio ducking */}
            {uiState === UIState.VIDEO_PLAYING && playingVideoUrl && (
              <VideoOverlayWithDucking
                videoUrl={playingVideoUrl}
                videoTitle={currentVideoRef.current?.title}
                chapters={currentVideoRef.current?.chapters}
                videoPlayerRef={videoPlayerRef}
                onClose={handleVideoClose}
                onVideoEnd={handleVideoEnd}
                onPause={handleVideoPause}
                onSeek={handleVideoSeek}
                onTimeUpdate={handleVideoTimeUpdate}
              />
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
