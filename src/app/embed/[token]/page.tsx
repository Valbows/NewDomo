'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { CVIProvider } from '@/components/cvi/components/cvi-provider';
import { TavusConversationCVI } from '@/app/demos/[demoId]/experience/components/TavusConversationCVI';
import { InlineVideoPlayer } from '@/app/demos/[demoId]/experience/components/InlineVideoPlayer';
import type { InlineVideoPlayerHandle } from '@/app/demos/[demoId]/experience/components/InlineVideoPlayer';
import { UIState } from '@/lib/tavus/UI_STATES';

interface EmbedConfig {
  demoId: string;
  name: string;
  agentName: string;
  hasPersona: boolean;
  cta: {
    title?: string;
    message?: string;
    buttonText?: string;
    buttonUrl?: string;
  };
}

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

export default function EmbedPage() {
  const params = useParams();
  const token = params.token as string;

  // State
  const [config, setConfig] = useState<EmbedConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [conversationUrl, setConversationUrl] = useState<string | null>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [uiState, setUiState] = useState<UIState>(UIState.IDLE);
  const [playingVideoUrl, setPlayingVideoUrl] = useState<string | null>(null);
  const [showCTA, setShowCTA] = useState(false);
  const [conversationEnded, setConversationEnded] = useState(false);

  const videoPlayerRef = useRef<InlineVideoPlayerHandle | null>(null);

  // Fetch embed config and start conversation
  useEffect(() => {
    const initEmbed = async () => {
      try {
        // Fetch embed config
        const configResp = await fetch(`/api/embed/${token}/config`);
        if (!configResp.ok) {
          const err = await configResp.json().catch(() => ({}));
          throw new Error(err.error || 'Demo not found or embedding is not enabled');
        }
        const configData = await configResp.json();
        setConfig(configData);

        if (!configData.hasPersona) {
          throw new Error('This demo does not have a configured AI agent');
        }

        // Start conversation
        const startResp = await fetch(`/api/embed/${token}/start-conversation`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({}),
        });

        if (!startResp.ok) {
          const err = await startResp.json().catch(() => ({}));
          throw new Error(err.error || 'Failed to start conversation');
        }

        const startData = await startResp.json();
        setConversationUrl(startData.conversation_url);
        setConversationId(startData.conversation_id);
        setUiState(UIState.CONVERSATION);
        setLoading(false);
      } catch (err: any) {
        setError(err.message || 'Failed to load demo');
        setLoading(false);
      }
    };

    if (token) {
      initEmbed();
    }
  }, [token]);

  // Handle tool calls from conversation
  const handleToolCall = useCallback((toolCall: any) => {
    const { name: toolName, parameters } = toolCall;

    if (toolName === 'play_video' && parameters?.video_url) {
      setPlayingVideoUrl(parameters.video_url);
      setUiState(UIState.VIDEO_PLAYING);
      setShowCTA(false);
    } else if (toolName === 'show_cta') {
      setShowCTA(true);
    }
  }, []);

  // Handle conversation end
  const handleConversationEnd = useCallback(async () => {
    if (conversationId) {
      try {
        await fetch(`/api/embed/${token}/end-conversation`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ conversationId }),
        });
      } catch (e) {
        console.warn('Error ending conversation:', e);
      }
    }
    setConversationEnded(true);
    setUiState(UIState.IDLE);
    setShowCTA(true); // Show CTA at end
  }, [conversationId, token]);

  // Handle restart conversation
  const handleRestartConversation = useCallback(async () => {
    if (!config) return;

    setConversationEnded(false);
    setShowCTA(false);
    setLoading(true);

    try {
      const startResp = await fetch(`/api/embed/${token}/start-conversation`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });

      if (!startResp.ok) {
        const err = await startResp.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to start conversation');
      }

      const startData = await startResp.json();
      setConversationUrl(startData.conversation_url);
      setConversationId(startData.conversation_id);
      setUiState(UIState.CONVERSATION);
    } catch (err: any) {
      setError(err.message || 'Failed to restart conversation');
    } finally {
      setLoading(false);
    }
  }, [config, token]);

  // Handle video end
  const handleVideoEnd = useCallback(() => {
    setPlayingVideoUrl(null);
    setUiState(UIState.CONVERSATION);
  }, []);

  // Handle video close
  const handleVideoClose = useCallback(() => {
    setPlayingVideoUrl(null);
    setUiState(UIState.CONVERSATION);
  }, []);

  // Handle CTA click
  const handleCTAClick = useCallback(async () => {
    if (config?.demoId && conversationId) {
      try {
        await fetch('/api/track-cta-click', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            demo_id: config.demoId,
            conversation_id: conversationId,
          }),
        });
      } catch (e) {
        console.warn('Error tracking CTA click:', e);
      }
    }
  }, [config?.demoId, conversationId]);

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-lg">Loading demo...</div>
      </div>
    );
  }

  // Error state
  if (error || !config) {
    const isBusyError = error?.toLowerCase().includes('failed to start') ||
                        error?.toLowerCase().includes('tavus') ||
                        error?.toLowerCase().includes('limit') ||
                        error?.toLowerCase().includes('capacity');

    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center px-6">
          {isBusyError ? (
            <>
              <div className="text-6xl mb-4">🙏</div>
              <div className="text-white text-xl font-semibold mb-2">
                Demo is Currently Busy
              </div>
              <div className="text-gray-400 mb-6">
                We're chatting with other customers right now.<br />
                Please try again in a few minutes.
              </div>
              <button
                onClick={() => window.location.reload()}
                className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg transition-colors"
              >
                Try Again
              </button>
            </>
          ) : (
            <>
              <div className="text-red-400 text-lg mb-4">{error || 'Demo not available'}</div>
              <div className="text-gray-500 text-sm">
                This demo may not be enabled for embedding or the link may be invalid.
              </div>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <CVIProvider>
      <style dangerouslySetInnerHTML={{ __html: pipStyles }} />
      <div className="min-h-screen bg-gray-900 flex flex-col">
        {/* Minimal Header */}
        <header className="bg-indigo-600 text-white py-2 px-4">
          <h1 className="text-lg font-semibold">{config.name}</h1>
        </header>

        {/* Main Content */}
        <main className="flex-1 relative">
          {/* Conversation Ended State */}
          {conversationEnded ? (
            <div className="w-full h-full flex flex-col items-center justify-center bg-gray-900 text-white p-8">
              <div className="text-6xl mb-4">👋</div>
              <h2 className="text-2xl font-bold mb-2">Thanks for chatting!</h2>
              <p className="text-gray-400 mb-6 text-center">
                We hope you enjoyed the demo. Ready to take the next step?
              </p>
              <button
                onClick={handleRestartConversation}
                className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg transition-colors"
              >
                Start New Conversation
              </button>
            </div>
          ) : (
            /* Conversation View */
            <div
              className={`${
                uiState === UIState.VIDEO_PLAYING
                  ? 'fixed bottom-4 right-4 w-80 h-60 z-50 shadow-2xl rounded-lg overflow-hidden'
                  : 'w-full h-full'
              } transition-all duration-300`}
            >
              <div className="bg-gray-900 w-full h-full">
                {conversationUrl ? (
                  <div className={uiState === UIState.VIDEO_PLAYING ? 'pip-video-layout' : 'h-full'}>
                    <TavusConversationCVI
                      conversationUrl={conversationUrl}
                      onLeave={handleConversationEnd}
                      onToolCall={handleToolCall}
                      debugVideoTitles={[]}
                    />
                  </div>
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-white">
                    Connecting...
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Video Player - Full screen when playing */}
          {uiState === UIState.VIDEO_PLAYING && playingVideoUrl && (
            <div className="absolute inset-0 bg-black flex flex-col z-30">
              <div className="flex-shrink-0 bg-gray-800 text-white p-3 flex justify-between items-center">
                <h2 className="text-md font-semibold">Demo Video</h2>
                <button
                  onClick={handleVideoClose}
                  className="text-white hover:text-gray-300 p-1"
                  title="Close video"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="flex-1 p-4">
                <div className="w-full h-full max-w-4xl mx-auto">
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
        {showCTA && config.cta.buttonUrl && (
          <div className="fixed bottom-0 left-0 right-0 z-40 shadow-lg">
            <div className="bg-gradient-to-r from-green-400 to-blue-500">
              <div className="py-3 px-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="text-lg mr-2">✅</div>
                    <div>
                      <h3 className="text-md font-bold text-white">
                        {config.cta.title || 'Ready to Get Started?'}
                      </h3>
                      <p className="text-xs text-green-100">
                        {config.cta.message || 'Take the next step today!'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 ml-4">
                    <a
                      href={config.cta.buttonUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={handleCTAClick}
                      className="inline-flex items-center justify-center px-4 py-1.5 bg-white text-green-600 font-semibold rounded-lg shadow hover:bg-gray-50 transition-colors duration-200 text-sm"
                    >
                      {config.cta.buttonText || 'Learn More'}
                    </a>
                    <button
                      onClick={() => setShowCTA(false)}
                      className="text-white/80 hover:text-white p-1"
                      aria-label="Close CTA"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
