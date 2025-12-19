'use client';

import { useState, useRef, useCallback } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { CVIProvider } from '@/components/cvi/components/cvi-provider';
import { TavusConversationCVI } from './components/TavusConversationCVI';
import { InlineVideoPlayer } from './components/InlineVideoPlayer';
import type { InlineVideoPlayerHandle } from './components/InlineVideoPlayer';
import { UIState } from '@/lib/tavus/UI_STATES';

// Import custom hooks
import { useDemoData } from './hooks/useDemoData';
import { useRealtimeSubscription } from './hooks/useRealtimeSubscription';
import type { CtaOverrides } from './hooks/useRealtimeSubscription';
import { useBeforeUnload } from './hooks/useBeforeUnload';
import { useCTA } from './hooks/useCTA';
import { useToolCallHandler } from './hooks/useToolCallHandler';

// Custom styles for PiP video layout
const pipStyles = `
  .pip-video-layout {
    height: 100%;
    display: flex;
    flex-direction: column;
    position: relative;
  }

  .pip-video-layout [class*="mainVideoContainer"] {
    flex: 1;
    min-height: 0;
    position: relative;
  }

  .pip-video-layout [class*="selfViewContainer"] {
    position: relative !important;
    bottom: auto !important;
    right: auto !important;
    left: auto !important;
    z-index: 1;
    margin-top: 8px;
    align-self: center;
  }

  .pip-video-layout [class*="previewVideoContainer"] {
    width: 80px !important;
    height: 60px !important;
    max-height: 60px !important;
    border: 2px solid rgba(255, 255, 255, 0.8);
    border-radius: 8px;
    background: rgba(0, 0, 0, 0.2);
  }

  .pip-video-layout [class*="previewVideo"] {
    width: 100% !important;
    height: 100% !important;
    object-fit: cover !important;
  }
`;

export default function DemoExperiencePage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const demoId = params.demoId as string;

  // Parse forceNew from URL
  const forceNew = (() => {
    try {
      const val = (searchParams?.get('forceNew') || searchParams?.get('force') || '').toString().toLowerCase();
      return val === '1' || val === 'true' || val === 'yes';
    } catch {
      return false;
    }
  })();

  const isE2E = process.env.NEXT_PUBLIC_E2E_TEST_MODE === 'true';

  // Video player state
  const [playingVideoUrl, setPlayingVideoUrl] = useState<string | null>(null);
  const [currentVideoTitle, setCurrentVideoTitle] = useState<string | null>(null);
  const [currentVideoIndex, setCurrentVideoIndex] = useState<number | null>(null);
  const [alert, setAlert] = useState<{ type: 'error' | 'info' | 'success'; message: string } | null>(null);
  const videoPlayerRef = useRef<InlineVideoPlayerHandle | null>(null);

  // Use custom hooks
  const {
    demo,
    loading,
    error,
    conversationUrl,
    uiState,
    setUiState,
    videoTitles,
  } = useDemoData(demoId, forceNew, isE2E);

  // CTA hook
  const {
    showCTA,
    setShowCTA,
    setCtaOverrides,
    ctaTitle,
    ctaMessage,
    ctaButtonText,
    ctaButtonUrl,
    handleCTAClick,
  } = useCTA({ demo, conversationUrl });

  // Tool call handler hook
  const {
    handleRealTimeToolCall,
    suppressReasonRef,
    suppressFetchUntilRef,
    pausedPositionRef,
  } = useToolCallHandler({
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
  });

  // Realtime subscription handlers
  const handleRealtimePlayVideo = useCallback((url: string) => {
    // New video source: reset any saved paused position
    pausedPositionRef.current = 0;
    setPlayingVideoUrl(url);
    setUiState(UIState.VIDEO_PLAYING);
    // Ensure CTA is hidden while playing and clear any alert banners
    setShowCTA(false);
    setAlert(null);
  }, [setUiState, setShowCTA, pausedPositionRef]);

  const handleRealtimeShowCTA = useCallback((overrides: CtaOverrides) => {
    setCtaOverrides(overrides);
    setShowCTA(true);
  }, [setCtaOverrides, setShowCTA]);

  // Subscribe to Supabase Realtime
  useRealtimeSubscription({
    demoId,
    onPlayVideo: handleRealtimePlayVideo,
    onShowCTA: handleRealtimeShowCTA,
  });

  // Handle browser window close/refresh
  useBeforeUnload({
    conversationId: demo?.tavus_conversation_id,
    demoId: demo?.id,
  });

  // Handle conversation end
  const handleConversationEnd = async () => {
    console.log('Conversation ended');

    // End the Tavus conversation via API if we have a conversation ID
    if (demo?.tavus_conversation_id) {
      try {
        console.log('🔚 Ending Tavus conversation:', {
          conversationId: demo.tavus_conversation_id,
          demoId: demo.id,
          demoData: demo
        });
        const response = await fetch('/api/end-conversation', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            conversationId: demo.tavus_conversation_id,
            demoId: demo.id,
          }),
        });

        if (response.ok) {
          const result = await response.json();
          console.log('✅ Tavus conversation ended successfully:', result);

          // Automatically sync conversation data after ending
          try {
            console.log('🔄 Syncing conversation data...');
            const syncResponse = await fetch(`/api/sync-tavus-conversations?demoId=${demo.id}`, {
              method: 'GET',
            });

            if (syncResponse.ok) {
              const syncResult = await syncResponse.json();
              console.log('✅ Conversation data synced successfully:', syncResult);
            } else {
              console.warn('⚠️ Failed to sync conversation data, but continuing...');
            }
          } catch (syncError) {
            console.warn('⚠️ Error syncing conversation data:', syncError);
          }

          // Small delay to ensure sync completes before redirect
          await new Promise((resolve) => setTimeout(resolve, 1000));
        } else {
          const error = await response.json().catch(() => ({}));
          console.warn('⚠️ Failed to end Tavus conversation:', {
            status: response.status,
            error: error,
            sentData: {
              conversationId: demo.tavus_conversation_id,
              demoId: demo.id,
            },
          });
        }
      } catch (error) {
        console.warn('⚠️ Error ending Tavus conversation:', error);
      }
    }

    setUiState(UIState.IDLE);
    // Redirect to the reporting page (configure page with reporting tab)
    router.push(`/demos/${demoId}/configure?tab=reporting`);
  };

  // Handle video end (natural completion)
  const handleVideoEnd = () => {
    console.log('Video ended naturally');
    setPlayingVideoUrl(null);
    setCurrentVideoTitle(null);
    setCurrentVideoIndex(null);
    setUiState(UIState.CONVERSATION);
  };

  // Handle video close button click
  const handleVideoClose = () => {
    console.log('Video closed by user');
    suppressReasonRef.current = 'close';
    suppressFetchUntilRef.current = Date.now() + 1000;
    // Save the current playback position before closing
    if (videoPlayerRef.current) {
      pausedPositionRef.current = videoPlayerRef.current.getCurrentTime?.() || 0;
    }
    setPlayingVideoUrl(null);
    setUiState(UIState.CONVERSATION);
  };

  return (
    <CVIProvider>
      <style dangerouslySetInnerHTML={{ __html: pipStyles }} />
      <div className="min-h-screen bg-gray-50 flex flex-col">
        {/* Header */}
        <header className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{demo?.name}</h1>
                <p className="text-gray-600">Interactive Demo Experience</p>
              </div>
              <button
                onClick={() => router.push(`/demos/${demoId}/configure`)}
                className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
              >
                Configure Demo
              </button>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 relative">
          {/* Alert banner */}
          {alert && (
            <div className="absolute top-4 right-4 z-50">
              <div className={`px-3 py-2 rounded shadow text-sm ${alert.type === 'error' ? 'bg-red-600 text-white' : 'bg-gray-800 text-white'}`}>
                <div className="flex items-center gap-2">
                  <span>{alert.message}</span>
                  <button
                    aria-label="Dismiss alert"
                    className="opacity-80 hover:opacity-100"
                    onClick={() => setAlert(null)}
                  >
                    ✕
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Loading/Error banners */}
          {loading && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 bg-white/90 text-gray-700 px-3 py-1 rounded shadow text-sm">
              Loading demo...
            </div>
          )}
          {error && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 bg-red-600 text-white px-3 py-1 rounded shadow text-sm">
              {error}
            </div>
          )}

          {/* Conversation View */}
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
                  <h2 className={`font-semibold ${
                    uiState === UIState.VIDEO_PLAYING ? 'text-sm' : 'text-lg'
                  }`}>AI Demo Assistant</h2>
                  {uiState !== UIState.VIDEO_PLAYING && (
                    <p className="text-indigo-100 text-sm">Ask questions and request to see specific features</p>
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
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                    </svg>
                  </button>
                )}
              </div>
              <div className="relative bg-gray-900 flex-1" style={{
                height: uiState === UIState.VIDEO_PLAYING ? '250px' : '75vh',
                minHeight: '400px'
              }}>
                {conversationUrl ? (
                  <div className={uiState === UIState.VIDEO_PLAYING ? 'pip-video-layout' : ''}>
                    <TavusConversationCVI
                      conversationUrl={conversationUrl}
                      onLeave={handleConversationEnd}
                      onToolCall={handleRealTimeToolCall}
                      debugVideoTitles={videoTitles}
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

          {/* Video Player - Full screen when playing */}
          {uiState === UIState.VIDEO_PLAYING && playingVideoUrl && (
            <div className="absolute inset-0 bg-black flex flex-col z-30" data-testid="video-overlay">
              <div className="flex-shrink-0 bg-gray-800 text-white p-4 flex justify-between items-center">
                <h2 className="text-lg font-semibold">Demo Video</h2>
                <button
                  data-testid="button-close-video"
                  onClick={handleVideoClose}
                  className="text-white hover:text-gray-300 p-2"
                  title="Close video"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
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
        {showCTA && demo && (
          <div className="fixed bottom-0 left-0 right-0 z-40 shadow-lg" data-testid="cta-banner">
            <div className="bg-gradient-to-r from-green-400 to-blue-500">
              <div className="mx-auto max-w-7xl py-4 px-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="text-xl mr-3">✅</div>
                    <div>
                      <h3 className="text-lg font-bold text-white">{ctaTitle}</h3>
                      <p className="text-sm text-green-100">{ctaMessage}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 ml-6">
                    <a
                      href={ctaButtonUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={handleCTAClick}
                      className="inline-flex items-center justify-center px-6 py-2 bg-white text-green-600 font-semibold rounded-lg shadow hover:bg-gray-50 transition-colors duration-200 text-sm"
                    >
                      {ctaButtonText}
                    </a>
                    <button
                      onClick={() => setShowCTA(false)}
                      className="text-white/80 hover:text-white p-1"
                      aria-label="Close CTA"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </CVIProvider>
  );
}
