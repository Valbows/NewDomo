'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { CVIProvider } from '@/components/cvi/components/cvi-provider';
import { TavusConversationCVI } from './components/TavusConversationCVI';
import { InlineVideoPlayer } from './components/InlineVideoPlayer';
import { UIState } from '@/lib/tavus/UI_STATES';
import { extractConversationIdFromUrl } from './utils/helpers';
import { pipStyles } from './styles/pipStyles';
import { handleRealTimeToolCall } from './handlers/toolCallHandlers';
import { handleVideoEnd, handleVideoClose } from './handlers/videoHandlers';
import { handleConversationEnd } from './handlers/conversationHandlers';
import { useDemoConversation } from './hooks/useDemoConversation';
import { useVideoPlayer } from './hooks/useVideoPlayer';
import { useCTAState } from './hooks/useCTAState';

export default function DemoExperiencePage() {
  const params = useParams();
  const router = useRouter();
  const demoId = params.demoId as string;
  const [alert, setAlert] = useState<{ type: 'error' | 'info' | 'success'; message: string } | null>(null);

  // Custom hooks for state management
  const {
    demo,
    loading,
    error,
    uiState,
    setUiState,
    conversationUrl,
    videoTitles,
    endConversation
  } = useDemoConversation(demoId);

  const {
    playingVideoUrl,
    currentVideoTitle,
    currentVideoIndex,
    videoPlayerRef,
    suppressFetchUntilRef,
    suppressReasonRef,
    pausedPositionRef,
    setPlayingVideoUrl,
    setCurrentVideoTitle,
    setCurrentVideoIndex,
  } = useVideoPlayer();

  const {
    showCTA,
    setShowCTA,
    setCtaOverrides,
    ctaTitle,
    ctaMessage,
    ctaButtonText,
    ctaButtonUrl,
  } = useCTAState(demo);

  const isE2E = process.env.NEXT_PUBLIC_E2E_TEST_MODE === 'true';

  // Handle real-time tool calls from Daily.co
  const handleToolCall = async (toolName: string, args: any) => {
    await handleRealTimeToolCall({
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
    });
  };

  // Event handlers
  const onConversationEnd = async () => {
    await handleConversationEnd(demo, setUiState, router, demoId);
  };

  const onVideoEnd = () => {
    handleVideoEnd(pausedPositionRef, setPlayingVideoUrl, setUiState, setShowCTA);
  };

  const onVideoClose = () => {
    handleVideoClose(
      pausedPositionRef,
      setPlayingVideoUrl,
      setUiState,
      setShowCTA,
      suppressFetchUntilRef,
      suppressReasonRef
    );
  };

  const handleCTAClick = async (e: React.MouseEvent<HTMLAnchorElement>) => {
    console.log('🔗 CTA Button clicked - Redirecting to configured URL');
    console.log('🎯 CTA URL resolved:', ctaButtonUrl);

    const currentConversationId = conversationUrl
      ? extractConversationIdFromUrl(conversationUrl)
      : demo?.tavus_conversation_id;

    if (currentConversationId && demo?.id) {
      try {
        console.log('🎯 Tracking CTA click with data:', {
          conversation_id: currentConversationId,
          demo_id: demo.id,
          cta_url: ctaButtonUrl,
          source: conversationUrl ? 'current_url' : 'demo_metadata'
        });

        const response = await fetch('/api/track-cta-click', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            conversation_id: currentConversationId,
            demo_id: demo.id,
            cta_url: ctaButtonUrl
          })
        });

        if (response.ok) {
          console.log('✅ CTA click tracked successfully');
        } else {
          const errorData = await response.json();
          console.warn('⚠️ CTA tracking failed with response:', errorData);
        }
      } catch (error) {
        console.warn('⚠️ Failed to track CTA click:', error);
      }
    } else {
      console.warn('⚠️ Missing demo data for CTA tracking:', {
        tavus_conversation_id: demo?.tavus_conversation_id,
        demo_id: demo?.id
      });
    }
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
                      onLeave={onConversationEnd}
                      onToolCall={handleToolCall}
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

          {/* Video Player */}
          {uiState === UIState.VIDEO_PLAYING && playingVideoUrl && (
            <div className="absolute inset-0 bg-black flex flex-col z-30" data-testid="video-overlay">
              <div className="flex-shrink-0 bg-gray-800 text-white p-4 flex justify-between items-center">
                <h2 className="text-lg font-semibold">Demo Video</h2>
                <button
                  data-testid="button-close-video"
                  onClick={onVideoClose}
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
                    onClose={onVideoClose}
                    onVideoEnd={onVideoEnd}
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
                      className="inline-flex items-center justify-center px-4 py-2 border border-white text-white font-medium rounded-lg hover:bg-white/10 transition-colors duration-200 text-sm"
                    >
                      Continue
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
