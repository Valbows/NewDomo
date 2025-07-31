'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { CVIProvider } from '@/components/cvi/components/cvi-provider';
import { TavusConversationCVI } from './components/TavusConversationCVI';
import { InlineVideoPlayer } from './components/InlineVideoPlayer';
import { UIState } from '@/lib/tavus/UI_STATES';

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

interface Demo {
  id: string;
  name: string;
  user_id: string;
  tavus_conversation_id: string;
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
}

export default function DemoExperiencePage() {
  const params = useParams();
  const router = useRouter();
  const demoId = params.demoId as string;
  const [demo, setDemo] = useState<Demo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [uiState, setUiState] = useState<UIState>(UIState.IDLE);
  const [playingVideoUrl, setPlayingVideoUrl] = useState<string | null>(null);
  const [conversationUrl, setConversationUrl] = useState<string | null>(null);
  const [showCTA, setShowCTA] = useState(false);

  // Fetch demo data and start conversation
  useEffect(() => {
    const fetchDemoAndStartConversation = async () => {
      try {
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
          } catch (e) {
            console.error('❌ Failed to parse metadata:', e);
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

        // Check if we have a conversation URL
        if (processedDemoData.metadata?.tavusShareableLink) {
          console.log('🔗 Setting conversation URL from metadata:', processedDemoData.metadata.tavusShareableLink);
          setConversationUrl(processedDemoData.metadata.tavusShareableLink);
          setUiState(UIState.CONVERSATION);
        } else if (processedDemoData.tavus_conversation_id) {
          // Fallback: construct URL from conversation ID
          const fallbackUrl = `https://tavus.daily.co/${processedDemoData.tavus_conversation_id}`;
          console.log('🔗 Using fallback conversation URL:', fallbackUrl);
          setConversationUrl(fallbackUrl);
          setUiState(UIState.CONVERSATION);
        } else {
          setError('No conversation URL found');
          setLoading(false);
          return;
        }
      } catch (err) {
        console.error('Error fetching demo:', err);
        setError('Failed to load demo');
      } finally {
        setLoading(false);
      }
    };

    fetchDemoAndStartConversation();
  }, [demoId]);

  // Handle real-time tool calls from Daily.co
  const handleRealTimeToolCall = async (toolName: string, args: any) => {
    console.log('Real-time tool call received:', toolName, args);
    
    if (toolName === 'fetch_video') {
      const videoTitle = args.title || args.video_title || 'Fourth Video';
      console.log('Processing real-time video request:', videoTitle);
      
      try {
        // Find the video in Supabase
        const { data: video, error: videoError } = await supabase
          .from('demo_videos')
          .select('storage_url')
          .eq('demo_id', demo?.id)
          .eq('title', videoTitle)
          .single();

        if (videoError || !video) {
          console.error('Video not found:', videoTitle);
          return;
        }

        // Generate signed URL
        const { data: signedUrlData, error: signedUrlError } = await supabase.storage
          .from('demo-videos')
          .createSignedUrl(video.storage_url, 3600);

        if (signedUrlError || !signedUrlData) {
          console.error('Error creating signed URL:', signedUrlError);
          return;
        }

        console.log('Real-time video playback triggered:', signedUrlData.signedUrl);
        setPlayingVideoUrl(signedUrlData.signedUrl);
        setUiState(UIState.VIDEO_PLAYING);
        
      } catch (error) {
        console.error('Real-time tool call error:', error);
      }
    }
  };

  const handleConversationEnd = () => {
    console.log('Conversation ended');
    setUiState(UIState.IDLE);
    router.push(`/demos/${demoId}`);
  };

  const handleVideoEnd = () => {
    console.log('Video ended, returning agent to full screen and showing CTA');
    setPlayingVideoUrl(null);
    setUiState(UIState.CONVERSATION);
    setShowCTA(true);
  };

  const handleVideoClose = () => {
    setPlayingVideoUrl(null);
    setUiState(UIState.CONVERSATION);
    // Show CTA after video ends
    setShowCTA(true);
    // Small delay to ensure smooth transition
    setTimeout(() => {
      console.log('Video closed, agent returned to full screen');
    }, 300);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading demo...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={() => router.back()}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

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
          {/* Conversation View - Full screen when no video, minimized when video playing */}
          {conversationUrl && (
            <div className={`${
              uiState === UIState.VIDEO_PLAYING 
                ? 'fixed bottom-4 right-4 w-96 h-72 z-50 shadow-2xl' 
                : 'w-full h-full flex items-center justify-center p-4'
            } transition-all duration-300`}>
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
                  <div className={uiState === UIState.VIDEO_PLAYING ? 'pip-video-layout' : ''}>
                    <TavusConversationCVI
                      conversationUrl={conversationUrl}
                      onLeave={handleConversationEnd}
                      onToolCall={handleRealTimeToolCall}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Video Player - Full screen when playing */}
          {uiState === UIState.VIDEO_PLAYING && playingVideoUrl && (
            <div className="absolute inset-0 bg-black flex flex-col">
              <div className="flex-shrink-0 bg-gray-800 text-white p-4 flex justify-between items-center">
                <h2 className="text-lg font-semibold">Demo Video</h2>
                <button
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
          <div className="fixed bottom-0 left-0 right-0 z-40 shadow-lg">
            <div className="bg-gradient-to-r from-green-400 to-blue-500">
              <div className="mx-auto max-w-7xl py-4 px-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="text-xl mr-3">✅</div>
                    <div>
                      <h3 className="text-lg font-bold text-white">
                        {demo?.metadata?.ctaTitle || 'Ready to Get Started?'}
                      </h3>
                      <p className="text-sm text-green-100">
                        {demo?.metadata?.ctaMessage || 'Take the next step today!'}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 ml-6">
                    <a
                      href={demo?.metadata?.ctaButtonUrl || 'https://bolt.new'}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e: React.MouseEvent<HTMLAnchorElement>) => {
                        console.log('🔗 CTA Button clicked - Redirecting to configured URL');
                        console.log('🎯 CTA URL from dashboard:', demo?.metadata?.ctaButtonUrl || 'https://bolt.new (fallback)');
                      }}
                      className="inline-flex items-center justify-center px-6 py-2 bg-white text-green-600 font-semibold rounded-lg shadow hover:bg-gray-50 transition-colors duration-200 text-sm"
                    >
                      {demo?.metadata?.ctaButtonText || 'Start Free Trial'}
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
