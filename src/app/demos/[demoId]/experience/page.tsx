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

// Validate that a URL points to a Daily room (required by our CVI join logic)
const isDailyRoomUrl = (url: string) => /^https?:\/\/[a-z0-9.-]+\.daily\.co\/.+/i.test(url);

interface Demo {
  id: string;
  name: string;
  user_id: string;
  tavus_conversation_id: string | null;
  metadata: {
    agentName?: string;
    agentPersonality?: string;
    agentGreeting?: string;
    tavusAgentId?: string;
    tavusShareableLink?: string;
    tavusPersonaId?: string;
    agentCreatedAt?: string;
    ctaTitle?: string;
    ctaMessage?: string;
    ctaButtonText?: string;
    ctaButtonUrl?: string;
  } | null;
  // Admin-level CTA fields (new)
  cta_title?: string;
  cta_message?: string;
  cta_button_text?: string;
  cta_button_url?: string;
  // Legacy CTA fields
  cta_text?: string;
  cta_link?: string;
}

// CTA override payload shape from Realtime broadcasts
type CtaOverrides = {
  cta_title?: string | null;
  cta_message?: string | null;
  cta_button_text?: string | null;
  cta_button_url?: string | null;
};

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
            setError('Conversation URL invalid. Please verify Tavus configuration.');
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
  const handleRealTimeToolCall = async (toolName: string, args: any) => {
    console.log('Real-time tool call received:', toolName, args);

    const playByTitle = async (videoTitle: string) => {
      if (!videoTitle || typeof videoTitle !== 'string' || !videoTitle.trim()) {
        logError('Missing or invalid video title in fetch/next_video tool call', 'ToolCall Validation');
        return;
      }
      // Normalize incoming title (trim and remove a single leading/trailing quote)
      const normalizedTitle = videoTitle.trim().replace(/^["']|["']$/g, '');
      console.log('Processing real-time video request:', normalizedTitle);

      // Ensure CTA banner is hidden while a video is starting and clear prior alerts
      setShowCTA(false);
      if (alert) setAlert(null);

      try {
        if (isE2E) {
          // Deterministic mapping of titles to distinct sample URLs for E2E assertions
          const samples = [
            // Proxy through our Next.js API to avoid cross-origin/codec quirks in headless tests
            '/api/e2e-video?i=0',
            '/api/e2e-video?i=1',
          ];

          let idx = -1;
          if (Array.isArray(videoTitles) && videoTitles.length > 0) {
            idx = videoTitles.indexOf(normalizedTitle);
          }
          // Fallback: map unknown titles to first sample
          const sampleUrl = samples[(idx >= 0 ? idx : 0) % samples.length];
          // New video source: reset any saved paused position
          pausedPositionRef.current = 0;
          setPlayingVideoUrl(sampleUrl);
          setUiState(UIState.VIDEO_PLAYING);
          setCurrentVideoTitle(normalizedTitle);
          setCurrentVideoIndex(idx >= 0 ? idx : null);
          return;
        }
        // Guard: ensure we have a demo id available for queries even if state hasn't settled yet
        const demoKey = demo?.id ?? demoId;
        if (!demoKey) {
          console.warn('⚠️ Demo id unavailable at tool call time; delaying fetch_video', { demo, demoId, title: normalizedTitle });
          setAlert({ type: 'info', message: 'Preparing demo… please try again in a moment.' });
          return;
        }
        // First attempt: exact title match
        const { data: videoExact, error: videoExactError } = await supabase
          .from('demo_videos')
          .select('storage_url')
          .eq('demo_id', demoKey)
          .eq('title', normalizedTitle)
          .single();

        let storagePath: string | null = null;
        if (!videoExactError && videoExact) {
          storagePath = videoExact.storage_url as string;
        } else {
          console.warn('Exact title match not found, attempting case-insensitive lookup for:', normalizedTitle);
          // Fallback: case-insensitive exact match (no wildcards)
          const { data: videosILike, error: ilikeError } = await supabase
            .from('demo_videos')
            .select('storage_url')
            .eq('demo_id', demoKey)
            .ilike('title', normalizedTitle)
            .limit(1);

          if (!ilikeError && Array.isArray(videosILike) && videosILike.length > 0) {
            storagePath = (videosILike[0] as any).storage_url as string;
          }
        }

        if (!storagePath) {
          logError(videoExactError || `Video not found: ${normalizedTitle}`, 'Video lookup');
          setAlert({ type: 'error', message: `Could not find a video titled "${normalizedTitle}".` });
          return;
        }

        // If storagePath is already a full URL, don't try to sign it
        if (/^https?:\/\//i.test(storagePath)) {
          console.log('Using direct video URL (no signing needed):', storagePath);
          // New video source: reset any saved paused position
          pausedPositionRef.current = 0;
          setPlayingVideoUrl(storagePath);
          setUiState(UIState.VIDEO_PLAYING);
          setCurrentVideoTitle(normalizedTitle);
          if (Array.isArray(videoTitles) && videoTitles.length > 0) {
            const idx = videoTitles.indexOf(normalizedTitle);
            setCurrentVideoIndex(idx >= 0 ? idx : null);
          }
          return;
        }

        const { data: signedUrlData, error: signedUrlError } = await supabase.storage
          .from('demo-videos')
          .createSignedUrl(storagePath, 3600);

        if (signedUrlError || !signedUrlData) {
          logError(signedUrlError || 'Unknown error creating signed URL', 'Error creating signed URL');
          setAlert({ type: 'error', message: 'There was a problem preparing the video for playback. Please try again.' });
          return;
        }

        console.log('Real-time video playback triggered:', signedUrlData.signedUrl);
        // New video source: reset any saved paused position
        pausedPositionRef.current = 0;
        setPlayingVideoUrl(signedUrlData.signedUrl);
        setUiState(UIState.VIDEO_PLAYING);
        setCurrentVideoTitle(normalizedTitle);
        if (Array.isArray(videoTitles) && videoTitles.length > 0) {
          const idx = videoTitles.indexOf(normalizedTitle);
          setCurrentVideoIndex(idx >= 0 ? idx : null);
        }
      } catch (error: unknown) {
        logError(error, 'Real-time tool call error');
        setAlert({ type: 'error', message: 'Unexpected error while loading the video.' });
      }
    };

    if (toolName === 'fetch_video') {
      // Quiescence window: ignore fetch shortly after a close to prevent immediate reopen
      if (Date.now() < suppressFetchUntilRef.current) {
        const reason = suppressReasonRef.current || 'suppression window';
        console.warn(`🛑 Suppressing fetch_video due to recent ${reason}`);
        return;
      }
      // If agent re-requests the same title while a video is already loaded, avoid resetting the src.
      try {
        const requestedTitleRaw = args?.title || args?.video_title || args?.video_name;
        if (requestedTitleRaw && typeof requestedTitleRaw === 'string') {
          const normalizedTitle = requestedTitleRaw.trim().replace(/^["']|["']$/g, '');
          if (
            currentVideoTitle &&
            playingVideoUrl &&
            normalizedTitle.toLowerCase() === currentVideoTitle.toLowerCase()
          ) {
            console.log('♻️ fetch_video for current title detected; resuming without reload');
            // Seek back to paused position if we have one, then play
            const t = pausedPositionRef.current || 0;
            if (t > 0) {
              console.log(`⏩ Resuming same video at ${t.toFixed(2)}s (fetch_video short-circuit)`);
            }
            if (t > 0 && videoPlayerRef.current?.seekTo) {
              videoPlayerRef.current.seekTo(t);
            }
            await videoPlayerRef.current?.play();
            return;
          }
        }
      } catch (e) {
        console.warn('fetch_video same-title resume check failed:', e);
      }
      await playByTitle(args?.title || args?.video_title || args?.video_name);
      return;
    }

    if (toolName === 'pause_video') {
      if (uiState === UIState.VIDEO_PLAYING) {
        // Record the current playback position before pausing
        try {
          const t = videoPlayerRef.current?.getCurrentTime?.() ?? 0;
          pausedPositionRef.current = t;
          console.log(`⏸️ Saved paused position at ${t.toFixed(2)}s`);
        } catch {}
        videoPlayerRef.current?.pause();
        // Prevent immediate re-fetch/play attempts triggered by the agent
        suppressFetchUntilRef.current = Date.now() + 1500;
        suppressReasonRef.current = 'pause';
      }
      return;
    }

    if (toolName === 'play_video') {
      if (uiState === UIState.VIDEO_PLAYING) {
        // Restore to the paused position if available before resuming
        try {
          const t = pausedPositionRef.current || 0;
          if (t > 0) {
            console.log(`▶️ Resuming video at ${t.toFixed(2)}s`);
          }
          if (t > 0 && videoPlayerRef.current?.seekTo) {
            videoPlayerRef.current.seekTo(t);
          }
        } catch {}
        await videoPlayerRef.current?.play();
        // Suppress redundant fetch_video immediately after resume to avoid src reset
        suppressFetchUntilRef.current = Date.now() + 1500;
        suppressReasonRef.current = 'resume';
      }
      return;
    }

    if (toolName === 'close_video') {
      handleVideoClose();
      return;
    }

    if (toolName === 'next_video') {
      if (Array.isArray(videoTitles) && videoTitles.length > 0) {
        const idx = currentVideoTitle ? videoTitles.indexOf(currentVideoTitle) : -1;
        const nextIdx = idx >= 0 ? (idx + 1) % videoTitles.length : 0;
        const nextTitle = videoTitles[nextIdx];
        await playByTitle(nextTitle);
      } else {
        console.warn('next_video called but no videoTitles available');
      }
      return;
    }

    if (toolName === 'show_trial_cta') {
      setShowCTA(true);
      return;
    }
  };

  const handleConversationEnd = () => {
    console.log('Conversation ended');
    setUiState(UIState.IDLE);
    router.push(`/demos/${demoId}`);
  };

  const handleVideoEnd = () => {
    console.log('Video ended, returning agent to full screen and showing CTA');
    pausedPositionRef.current = 0;
    setPlayingVideoUrl(null);
    setUiState(UIState.CONVERSATION);
    setShowCTA(true);
  };

  const handleVideoClose = () => {
    console.log('❎ Video closed by user; clearing paused position and returning to conversation');
    pausedPositionRef.current = 0;
    setPlayingVideoUrl(null);
    setUiState(UIState.CONVERSATION);
    // Show CTA after video ends
    setShowCTA(true);
    // Prevent immediate re-open by ignoring fetch_video for a short window
    suppressFetchUntilRef.current = Date.now() + 1500;
    suppressReasonRef.current = 'close';
    // Small delay to ensure smooth transition
    setTimeout(() => {
      console.log('Video closed, agent returned to full screen');
    }, 300);
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
                      onClick={(e: React.MouseEvent<HTMLAnchorElement>) => {
                        console.log('🔗 CTA Button clicked - Redirecting to configured URL');
                        console.log('🎯 CTA URL resolved:', ctaButtonUrl);
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
