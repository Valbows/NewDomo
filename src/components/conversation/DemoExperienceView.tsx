'use client';

import { useState, useRef, useCallback, useEffect, forwardRef, useImperativeHandle } from 'react';
import { CVIProvider } from '@/components/cvi/components/cvi-provider';
import { TavusConversationCVI } from '@/app/demos/[demoId]/experience/components/TavusConversationCVI';
import { InlineVideoPlayer } from '@/app/demos/[demoId]/experience/components/InlineVideoPlayer';
import type { InlineVideoPlayerHandle } from '@/app/demos/[demoId]/experience/components/InlineVideoPlayer';
import { UIState } from '@/lib/tavus/UI_STATES';
import { BusyErrorScreen, CTABanner, ConversationEndedScreen, pipStyles } from '@/components/conversation';
import { analytics } from '@/lib/mixpanel';

export interface DemoExperienceViewProps {
  // Demo info
  demoName: string;
  demoId: string;

  // Conversation
  conversationUrl: string | null;
  conversationId?: string | null;

  // State
  loading: boolean;
  error: string | null;

  // CTA config
  ctaTitle?: string;
  ctaMessage?: string;
  ctaButtonText?: string;
  ctaButtonUrl?: string;

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
      conversationUrl,
      conversationId,
      loading,
      error,
      ctaTitle,
      ctaMessage,
      ctaButtonText,
      ctaButtonUrl,
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
    const handleToolCall = useCallback(
      (toolCall: any) => {
        const { name: toolName, parameters } = toolCall;

        if (toolName === 'play_video' && parameters?.video_url) {
          setPlayingVideoUrl(parameters.video_url);
          setUiState(UIState.VIDEO_PLAYING);
          setShowCTA(false);

          // Track video played
          analytics.videoPlayed({
            demoId,
            videoUrl: parameters.video_url,
            videoTitle: parameters.video_title,
          });
        } else if (toolName === 'show_cta') {
          setShowCTA(true);

          // Track CTA shown
          analytics.ctaShown({
            demoId,
            ctaTitle,
            ctaButtonText,
          });
        }

        // Also call parent handler
        onToolCall(toolCall);
      },
      [onToolCall, demoId, ctaTitle, ctaButtonText]
    );

    // Handle conversation end
    const handleConversationEnd = useCallback(() => {
      const durationSeconds = Math.floor((Date.now() - startTime) / 1000);

      setConversationEnded(true);
      setUiState(UIState.IDLE);
      setShowCTA(true);

      // Track demo ended
      analytics.demoEnded({
        demoId,
        demoName,
        source,
        durationSeconds,
        conversationId: conversationId || undefined,
      });

      onConversationEnd();
    }, [onConversationEnd, demoId, demoName, source, conversationId, startTime]);

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

    // Loading state
    if (loading) {
      return (
        <div className="min-h-screen bg-gray-900 flex items-center justify-center">
          <div className="text-white text-lg">Loading demo...</div>
        </div>
      );
    }

    // Error state
    if (error) {
      return (
        <BusyErrorScreen
          error={error}
          onRetry={onRetry || (() => window.location.reload())}
        />
      );
    }

    return (
      <CVIProvider>
        <style dangerouslySetInnerHTML={{ __html: pipStyles }} />
        <div className="min-h-screen bg-gray-50 flex flex-col">
          {/* Main Content */}
          <main className="flex-1 relative">
            {/* Conversation Ended State */}
            {conversationEnded ? (
              <ConversationEndedScreen onRestart={onRestart ? handleRestartConversation : undefined} />
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
                <div className="bg-white rounded-lg shadow-lg overflow-hidden w-full h-full flex flex-col">
                  <div className="p-2 bg-indigo-600 text-white flex justify-between items-center flex-shrink-0">
                    <div>
                      <h2
                        className={`font-semibold ${
                          uiState === UIState.VIDEO_PLAYING ? 'text-sm' : 'text-lg'
                        }`}
                      >
                        AI Demo Assistant
                      </h2>
                      {uiState !== UIState.VIDEO_PLAYING && (
                        <p className="text-indigo-100 text-sm">
                          Ask questions and request to see specific features
                        </p>
                      )}
                    </div>
                    {uiState === UIState.VIDEO_PLAYING && (
                      <button
                        data-testid="button-expand-conversation"
                        onClick={() => {
                          setPlayingVideoUrl(null);
                          setUiState(UIState.CONVERSATION);
                        }}
                        className="text-white hover:text-indigo-200 p-1"
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
                    )}
                  </div>
                  <div
                    className="relative bg-gray-900 flex-1"
                    style={{
                      height: uiState === UIState.VIDEO_PLAYING ? '250px' : '75vh',
                      minHeight: '400px',
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

            {/* Video Player - Full screen when playing */}
            {uiState === UIState.VIDEO_PLAYING && playingVideoUrl && (
              <div
                className="absolute inset-0 bg-black flex flex-col z-30"
                data-testid="video-overlay"
              >
                <div className="flex-shrink-0 bg-gray-800 text-white p-4 flex justify-between items-center">
                  <h2 className="text-lg font-semibold">Demo Video</h2>
                  <button
                    data-testid="button-close-video"
                    onClick={handleVideoClose}
                    className="text-white hover:text-gray-300 p-2"
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
                <div className="flex-1 p-4">
                  <div className="w-full h-full max-w-6xl mx-auto">
                    <InlineVideoPlayer
                      ref={videoPlayerRef}
                      videoUrl={playingVideoUrl}
                      onClose={handleVideoClose}
                      onVideoEnd={handleVideoEnd}
                    />
                  </div>
                </div>
              </div>
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
