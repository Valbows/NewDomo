'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { CVIProvider } from '@/components/cvi/components/cvi-provider';
import { TavusConversationCVI } from './components/TavusConversationCVI';
import { InlineVideoPlayer } from './components/InlineVideoPlayer';
import { UIState } from '@/lib/tavus/UI_STATES';

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

        setDemo(demoData);

        // Check if we have a conversation URL
        if (demoData.metadata?.tavusShareableLink) {
          console.log('🔗 Setting conversation URL from metadata:', demoData.metadata.tavusShareableLink);
          setConversationUrl(demoData.metadata.tavusShareableLink);
          setUiState(UIState.CONVERSATION);
        } else if (demoData.tavus_conversation_id) {
          // Fallback: construct URL from conversation ID
          const fallbackUrl = `https://tavus.daily.co/${demoData.tavus_conversation_id}`;
          console.log('🔗 Using fallback conversation URL:', fallbackUrl);
          setConversationUrl(fallbackUrl);
          setUiState(UIState.CONVERSATION);
        } else {
          setError('No conversation available for this demo');
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

  const handleVideoClose = () => {
    setPlayingVideoUrl(null);
    setUiState(UIState.CONVERSATION);
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
                ? 'fixed bottom-4 right-4 w-80 h-60 z-50 shadow-2xl' 
                : 'w-full h-full flex items-center justify-center p-4'
            } transition-all duration-300`}>
              <div className="bg-white rounded-lg shadow-lg overflow-hidden w-full h-full">
                <div className="p-2 bg-indigo-600 text-white flex justify-between items-center">
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
                  height: uiState === UIState.VIDEO_PLAYING ? '200px' : '600px' 
                }}>
                  <TavusConversationCVI
                    conversationUrl={conversationUrl}
                    onLeave={handleConversationEnd}
                    onToolCall={handleRealTimeToolCall}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Video Player - Full screen when playing */}
          {uiState === UIState.VIDEO_PLAYING && playingVideoUrl && (
            <div className="absolute inset-0 bg-black flex items-center justify-center p-4">
              <div className="w-full max-w-6xl mx-auto">
                <div className="bg-white rounded-lg shadow-lg overflow-hidden">
                  <div className="p-4 bg-gray-800 text-white flex justify-between items-center">
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
                  <div className="relative" style={{ height: '70vh' }}>
                    <InlineVideoPlayer
                      videoUrl={playingVideoUrl}
                      onClose={handleVideoClose}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </CVIProvider>
  );
}
