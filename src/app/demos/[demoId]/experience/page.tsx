'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { CVIProvider } from '@/components/cvi/components/cvi-provider';
import { TavusConversationCVI } from './components/TavusConversationCVI';
import { InlineVideoPlayer } from './components/InlineVideoPlayer';
import type { InlineVideoPlayerHandle } from './components/InlineVideoPlayer';
import { UIState } from '@/lib/tavus/UI_STATES';
import { getErrorMessage, logError } from '@/lib/errors';
import { extractConversationIdFromUrl, isDailyRoomUrl } from './utils/helpers';
import { pipStyles } from './styles/pipStyles';
import type { Demo, CtaOverrides } from './types';
import { handleRealTimeToolCall } from './handlers/toolCallHandlers';
import { handleVideoEnd, handleVideoClose } from './handlers/videoHandlers';
import { handleConversationEnd } from './handlers/conversationHandlers';

export default function DemoExperiencePage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const demoId = params.demoId as string;
  const [demo, setDemo] = useState<Demo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [uiState, setUiState] = useState<UIState>(UIState.IDLE);
  const [playingVideoUrl, setPlayingVideoUrl] = useState<string | null>(null);
  const [conversationUrl, setConversationUrl] = useState<string | null>(null);
  const [showCTA, setShowCTA] = useState(false);
  const [ctaOverrides, setCtaOverrides] = useState<CtaOverrides | null>(null);
  const [videoTitles, setVideoTitles] = useState<string[]>([]);
  const videoPlayerRef = useRef<InlineVideoPlayerHandle | null>(null);
  const [currentVideoTitle, setCurrentVideoTitle] = useState<string | null>(null);
  const [currentVideoIndex, setCurrentVideoIndex] = useState<number | null>(null);
  const [alert, setAlert] = useState<{ type: 'error' | 'info' | 'success'; message: string } | null>(null);
  const isE2E = process.env.NEXT_PUBLIC_E2E_TEST_MODE === 'true';
  const suppressFetchUntilRef = useRef<number>(0);
  const suppressReasonRef = useRef<'close' | 'pause' | 'resume' | null>(null);
  const pausedPositionRef = useRef<number>(0);
  const forceNew = (() => {
    try {
      const val = (searchParams?.get('forceNew') || searchParams?.get('force') || '').toString().toLowerCase();
      return val === '1' || val === 'true' || val === 'yes';
    } catch {
      return false;
    }
  })();

  // Fetch demo data and start conversation
  useEffect(() => {
    const fetchDemoAndStartConversation = async () => {
      try {
        // E2E mode: provide stub data, avoid network calls
        if (isE2E) {
          const stubDemo: Demo = {
            id: demoId,
            name: 'E2E Demo',
            user_id: 'e2e-user',
            tavus_conversation_id: 'e2e-conv',
            metadata: {
              tavusShareableLink: 'about:blank',
              ctaTitle: 'Ready to Get Started?',
              ctaMessage: 'Take the next step today!',
              ctaButtonText: 'Start Free Trial',
              ctaButtonUrl: 'https://example.com/meta-start'
            },
            // Admin-level CTA fields (override metadata for testing precedence)
            cta_title: 'Ready to Get Started?',
            cta_message: 'Take the next step today!',
            cta_button_text: 'Start Free Trial',
            cta_button_url: 'https://example.com/admin-start'
          };
          setDemo(stubDemo);
          setVideoTitles(['E2E Test Video', 'E2E Second Video']);
          setConversationUrl('about:blank');
          setUiState(UIState.CONVERSATION);
          setLoading(false);
          return;
        }
        // Get demo data
        const { data: demoData, error: demoError } = await supabase
          .from('demos')
          .select('*')
          .eq('id', demoId)
          .single();

        if (demoError || !demoData) {
          setError('Demo not found');
          setLoading(false);
          return;
        }

        // Parse metadata if it's a string BEFORE setting demo state
        let processedDemoData = { ...demoData };
        
        if (typeof processedDemoData.metadata === 'string') {
          console.log('⚠️ Metadata is a string, parsing...');
          try {
            processedDemoData.metadata = JSON.parse(processedDemoData.metadata);
            console.log('✅ Metadata parsed successfully');
          } catch (e: unknown) {
            logError(e, '❌ Failed to parse metadata');
            processedDemoData.metadata = {};
          }
        }
        
        // Set the demo with properly parsed metadata
        setDemo(processedDemoData);
        
        // Debug: Log full demo data
        console.log('📊 Full Demo Data:', JSON.stringify(processedDemoData, null, 2));
        console.log('📦 Demo Metadata Type:', typeof processedDemoData.metadata);
        console.log('📦 Demo Metadata Value:', JSON.stringify(processedDemoData.metadata, null, 2));
        console.log('🎯 Demo CTA Data:', {
          ctaTitle: processedDemoData.metadata?.ctaTitle,
          ctaMessage: processedDemoData.metadata?.ctaMessage,
          ctaButtonText: processedDemoData.metadata?.ctaButtonText,
          ctaButtonUrl: processedDemoData.metadata?.ctaButtonUrl
        });

        // Load available video titles for dropdown debugging (dev-only UI consumes this)
        try {
          const { data: titlesData, error: titlesError } = await supabase
            .from('demo_videos')
            .select('title')
            .eq('demo_id', processedDemoData.id);
          if (titlesError) {
            console.warn('⚠️ Failed to load video titles', titlesError);
          } else if (Array.isArray(titlesData)) {
            const titles = titlesData
              .map((row: any) => row?.title)
              .filter((t: any): t is string => typeof t === 'string' && t.trim().length > 0);
            setVideoTitles(titles);
          }
        } catch (e) {
          console.warn('⚠️ Unexpected error loading video titles', e);
        }

        // Always obtain a fresh/validated Daily conversation URL from the server
        // Server will reuse valid existing rooms or create a new one if stale
        console.log('🚀 Requesting Daily conversation URL from API (ignoring saved metadata)');
        try {
          // In-flight client-side dedupe (helps with React Strict Mode double-invoke in dev)
          const win: any = typeof window !== 'undefined' ? window : undefined;
          if (win) {
            win.__startConvInflight = win.__startConvInflight || new Map<string, Promise<any>>();
          }
          const inflight: Map<string, Promise<any>> | undefined = win?.__startConvInflight;
          let startPromise = inflight?.get(processedDemoData.id);
          if (!startPromise) {
            startPromise = fetch('/api/start-conversation', {
              method: 'POST',
              headers: { 'content-type': 'application/json' },
              body: JSON.stringify({ demoId: processedDemoData.id, forceNew }),
            }).then(async (resp) => {
              if (!resp.ok) {
                const err = await resp.json().catch(() => ({}));
                throw err;
              }
              return resp.json();
            });
            inflight?.set(processedDemoData.id, startPromise);
          } else {
            console.log('⏳ Waiting for in-flight conversation start (deduped)');
          }
          let data: any;
          try {
            data = await startPromise;
          } finally {
            inflight?.delete(processedDemoData.id);
          }
          const url = data?.conversation_url as string | undefined;
          if (url && isDailyRoomUrl(url)) {
            console.log('✅ Received Daily conversation URL from API:', url);
            setConversationUrl(url);
            setUiState(UIState.CONVERSATION);
          } else {
            console.warn('Received non-Daily conversation URL from API:', url);
            setError('Conversation URL invalid. Please verify Domo configuration.');
            setLoading(false);
            return;
          }
        } catch (e) {
          logError(e, 'Error starting conversation');
          setError(getErrorMessage(e, 'Failed to start conversation'));
          setLoading(false);
          return;
        }
      } catch (err: unknown) {
        logError(err, 'Error fetching demo');
        setError(getErrorMessage(err, 'Failed to load demo'));
      } finally {
        setLoading(false);
      }
    };

    fetchDemoAndStartConversation();
  }, [demoId]);

  // Handle browser window close/refresh to end conversation
  useEffect(() => {
    const handleBeforeUnload = async () => {
      if (demo?.tavus_conversation_id) {
        // Use sendBeacon for reliable delivery during page unload
        const endPayload = JSON.stringify({
          conversationId: demo.tavus_conversation_id,
          demoId: demo.id,
        });
        
        try {
          navigator.sendBeacon('/api/end-conversation', endPayload);
          console.log('📡 Sent conversation end beacon');
        } catch (error) {
          console.warn('Failed to send conversation end beacon:', error);
        }
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [demo?.tavus_conversation_id, demo?.id]);

  // Subscribe to Supabase Realtime broadcasts for this demo
  useEffect(() => {
    if (!demoId) return;

    const channelName = `demo-${demoId}`;
    const channel = supabase.channel(channelName);

    channel
      .on('broadcast', { event: 'play_video' }, (payload: any) => {
        try {
          const url = payload?.payload?.url as string | undefined;
          console.log('Realtime: play_video received', payload);
          if (url && typeof url === 'string') {
            // New video source: reset any saved paused position
            pausedPositionRef.current = 0;
            setPlayingVideoUrl(url);
            setUiState(UIState.VIDEO_PLAYING);
            // Ensure CTA is hidden while playing and clear any alert banners
            setShowCTA(false);
            setAlert(null);
          }
        } catch (e) {
          console.warn('Realtime play_video handler error', e);
        }
      })
      .on('broadcast', { event: 'show_trial_cta' }, (payload: any) => {
        try {
          console.log('Realtime: show_trial_cta received', payload);
          const p = payload?.payload || {};
          setCtaOverrides({
            cta_title: p?.cta_title ?? undefined,
            cta_message: p?.cta_message ?? undefined,
            cta_button_text: p?.cta_button_text ?? undefined,
            cta_button_url: p?.cta_button_url ?? undefined,
          });
          setShowCTA(true);
        } catch (e) {
          console.warn('Realtime show_trial_cta handler error', e);
          setShowCTA(true);
        }
      })
      .on('broadcast', { event: 'analytics_updated' }, (payload: any) => {
        console.log('Realtime: analytics_updated received', payload?.payload);
        // Currently no analytics UI here; placeholder for potential refresh logic
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log(`Client Realtime: SUBSCRIBED to ${channelName}`);
        }
      });

    return () => {
      try {
        supabase.removeChannel(channel);
      } catch {}
    };
  }, [demoId]);

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

  // Wrapper for conversation end
  const onConversationEnd = async () => {
    await handleConversationEnd(demo, setUiState, router, demoId);
  };

  // Wrapper for video end
  const onVideoEnd = () => {
    handleVideoEnd(pausedPositionRef, setPlayingVideoUrl, setUiState, setShowCTA);
  };

  // Wrapper for video close
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


  // Derive CTA values with fallbacks to admin-level columns
  const ctaTitle = ctaOverrides?.cta_title || demo?.cta_title || demo?.metadata?.ctaTitle || 'Ready to Get Started?';
  const ctaMessage = ctaOverrides?.cta_message || demo?.cta_message || demo?.metadata?.ctaMessage || demo?.cta_text || 'Take the next step today!';
  const ctaButtonText = ctaOverrides?.cta_button_text || demo?.cta_button_text || demo?.metadata?.ctaButtonText || 'Start Free Trial';
  const ctaButtonUrl = ctaOverrides?.cta_button_url || demo?.cta_button_url || demo?.metadata?.ctaButtonUrl || demo?.cta_link || 'https://bolt.new';

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
          {/* Non-blocking loading banner */}
          {loading && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 bg-white/90 text-gray-700 px-3 py-1 rounded shadow text-sm">
              Loading demo...
            </div>
          )}
          {/* Non-blocking error banner */}
          {error && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 bg-red-600 text-white px-3 py-1 rounded shadow text-sm">
              {error}
            </div>
          )}
          {/* Conversation View - Full screen when no video, minimized when video playing */}
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

          {/* Video Player - Full screen when playing */}
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

        {/* CTA Banner - Shows after video demo */}
        {showCTA && demo && (
          <div className="fixed bottom-0 left-0 right-0 z-40 shadow-lg" data-testid="cta-banner">
            <div className="bg-gradient-to-r from-green-400 to-blue-500">
              <div className="mx-auto max-w-7xl py-4 px-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="text-xl mr-3">✅</div>
                    <div>
                      <h3 className="text-lg font-bold text-white">
                        {ctaTitle}
                      </h3>
                      <p className="text-sm text-green-100">
                        {ctaMessage}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 ml-6">
                    <a
                      href={ctaButtonUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={async (e: React.MouseEvent<HTMLAnchorElement>) => {
                        console.log('🔗 CTA Button clicked - Redirecting to configured URL');
                        console.log('🎯 CTA URL resolved:', ctaButtonUrl);
                        
                        // Track CTA click - use current conversation ID from URL
                        const currentConversationId = conversationUrl ? extractConversationIdFromUrl(conversationUrl) : demo?.tavus_conversation_id;
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
                              headers: {
                                'Content-Type': 'application/json',
                              },
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
                      }}
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
