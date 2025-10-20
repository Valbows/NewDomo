'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { CVIProvider } from '@/components/cvi/components/cvi-provider';
import { InlineVideoPlayer } from './components/InlineVideoPlayer';
import { UIState } from '@/lib/tavus/UI_STATES';

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
}

export default function DemoExperiencePage() {
  const params = useParams();
  const demoId = params.demoId as string;
  const [demo, setDemo] = useState<Demo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [uiState, setUiState] = useState<UIState>(UIState.IDLE);
  const [playingVideoUrl, setPlayingVideoUrl] = useState<string | null>(null);
  const [showCTA, setShowCTA] = useState(false);
  const [, setCTAData] = useState<any>(null);
  const [conversationUrl, setConversationUrl] = useState<string | null>(null);

  // CTA settings from demo metadata
  const ctaTitle = demo?.metadata?.ctaTitle || 'Ready to Get Started?';
  const ctaMessage = demo?.metadata?.ctaMessage || 'Start your free trial today and see the difference!';
  const ctaButtonText = demo?.metadata?.ctaButtonText || 'Start Free Trial';
  const ctaButtonUrl = demo?.metadata?.ctaButtonUrl || '';

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

        if (demoError) throw demoError;
        if (!demoData) throw new Error('Demo not found.');

        setDemo(demoData);

        // Check if Tavus conversation exists
        if (demoData.tavus_conversation_id) {
          if (demoData.metadata?.tavusShareableLink) {
            // Use existing conversation from metadata
            console.log('🔗 Setting conversation URL from metadata:', demoData.metadata.tavusShareableLink);
            setConversationUrl(demoData.metadata.tavusShareableLink);
          } else {
            // Fallback: construct URL from conversation ID
            const fallbackUrl = `https://app.tavus.io/conversation/${demoData.tavus_conversation_id}`;
            console.log('🔗 Using fallback conversation URL:', fallbackUrl);
            setConversationUrl(fallbackUrl);
          }
        } else {
          // No conversation exists - show message to start one
          setError('Please start a demo conversation first from the Agent Settings tab.');
        }

      } catch (err: any) {
        console.error('Error fetching demo:', err);
        setError('Failed to load demo. Please try again.');
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

  // Subscribe to real-time events (backup for webhook-based tool calls)
  useEffect(() => {
    if (!demo) return;

    const channel = supabase.channel(`demo-${demoId}`);

    channel
      .on('broadcast', { event: 'play_video' }, (payload) => {
        console.log('Received play_video event via webhook:', payload);
        if (payload?.payload?.url) {
          setPlayingVideoUrl(payload.payload.url);
          setUiState(UIState.VIDEO_PLAYING);
        }
      })
      .on('broadcast', { event: 'show_trial_cta' }, (payload) => {
        console.log('Received show_trial_cta event:', payload);
        setShowCTA(true);
        setCTAData(payload.payload);
        setUiState(UIState.DEMO_COMPLETE);
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log(`Successfully subscribed to demo events: ${demoId}`);
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [demo, demoId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading demo experience...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={() => window.history.back()}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{demo?.name}</h1>
              <p className="text-gray-600">Interactive Demo Experience</p>
            </div>
            <button
              onClick={() => window.location.href = `/demos/${demoId}/configure`}
              className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
            >
              Configure Demo
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center p-4">
        <CVIProvider>
          {uiState === UIState.LOADING && (
            <div className="text-gray-600">Loading demo...</div>
          )}

          {uiState === UIState.SERVICE_ERROR && (
            <div role="alert" className="text-red-600">{error || 'An error occurred'}</div>
          )}
            
            {/* Video Player */}
            <div className="bg-white rounded-lg shadow-lg overflow-hidden">
              <div className="p-4 bg-gray-50 border-b">
                <h3 className="text-lg font-semibold text-gray-900">Demo Content</h3>
              </div>
              
              <div className="p-6">
                {playingVideoUrl ? (
                  <InlineVideoPlayer
                    videoUrl={playingVideoUrl}
                    onClose={() => {
                      setPlayingVideoUrl(null);
                      setUiState(UIState.IDLE);
                    }}
                  />
) : (
                  <div className="h-64 bg-gray-100 rounded-lg flex items-center justify-center">
                    <div className="text-center">
                      <div className="text-4xl mb-2">🎬</div>
                      <p className="text-gray-600 mb-4">Ask the AI assistant to show you a demo video</p>
                      
                      {/* Manual trigger for testing */}
                      <button
                        onClick={async () => {
                          try {
                            const response = await fetch('/api/test-video-playback', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ 
                                demoId: demo?.id, 
                                videoTitle: 'Fourth Video' 
                              })
                            });
                            const result = await response.json();
                            console.log('Manual video trigger result:', result);
                          } catch (error) {
                            console.error('Manual video trigger error:', error);
                          }
                        }}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 text-sm"
                      >
                        🧪 Test Video Playback
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* CTA Section */}
            {showCTA && (
              <div className="bg-gradient-to-r from-green-400 to-blue-500 rounded-lg shadow-lg overflow-hidden">
                <div className="p-6 text-white">
                  <div className="flex items-center mb-4">
                    <div className="text-2xl mr-3">✅</div>
                    <div>
                      <h3 className="text-xl font-bold">{ctaTitle}</h3>
                      <p className="text-green-100">{ctaMessage}</p>
                    </div>
                  </div>
                  
                  <div className="flex space-x-4">
                    {ctaButtonUrl ? (
                      <a
                        href={ctaButtonUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-6 py-3 bg-white text-green-600 font-semibold rounded-lg hover:bg-gray-100 transition-colors"
                      >
                        {ctaButtonText}
                      </a>
                    ) : (
                      <button className="px-6 py-3 bg-white text-green-600 font-semibold rounded-lg hover:bg-gray-100 transition-colors">
                        {ctaButtonText}
                      </button>
                    )}
                    <button className="px-6 py-3 border-2 border-white text-white font-semibold rounded-lg hover:bg-white hover:text-green-600 transition-colors">
                      Learn More
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Demo Instructions */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">How to Use This Demo</h3>
              <ul className="space-y-2 text-gray-600">
                <li className="flex items-start">
                  <span className="text-indigo-600 mr-2">1.</span>
                  Start a conversation with the AI assistant on the left
                </li>
                <li className="flex items-start">
                  <span className="text-indigo-600 mr-2">2.</span>
                  Ask questions about the product or request to see specific features
                </li>
                <li className="flex items-start">
                  <span className="text-indigo-600 mr-2">3.</span>
                  Watch demo videos appear on the right when requested
                </li>
                <li className="flex items-start">
                  <span className="text-indigo-600 mr-2">4.</span>
                  Get personalized recommendations and next steps
                </li>
              </ul>
            </div>
        </CVIProvider>
      </main>
    </div>
  );
}
