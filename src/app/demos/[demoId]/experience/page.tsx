'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { UIState } from '@/lib/tavus/UI_STATES';
import { InlineVideoPlayer } from './components/InlineVideoPlayer';
import { TavusConversation } from './components/TavusConversation';
import { useRouter } from 'next/navigation';

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

export default function DemoExperiencePage({ params }: { params: { demoId: string } }) {
  const { demoId } = params;
  const router = useRouter();
  const [demo, setDemo] = useState<Demo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [uiState, setUiState] = useState<UIState>(UIState.IDLE);
  const [playingVideoUrl, setPlayingVideoUrl] = useState<string | null>(null);
  const [showCTA, setShowCTA] = useState(false);
  const [ctaData, setCTAData] = useState<any>(null);
  const [isMonitoring, setIsMonitoring] = useState(false);
  
  // CTA settings from demo metadata
  const ctaTitle = demo?.metadata?.ctaTitle || 'Ready to Get Started?';
  const ctaMessage = demo?.metadata?.ctaMessage || 'Start your free trial today and see the difference!';
  const ctaButtonText = demo?.metadata?.ctaButtonText || 'Start Free Trial';
  const ctaButtonUrl = demo?.metadata?.ctaButtonUrl || '';
  const [tavusConversationUrl, setTavusConversationUrl] = useState<string | null>(null);

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
            setTavusConversationUrl(demoData.metadata.tavusShareableLink);
          } else {
            // Fallback: construct URL from conversation ID
            const fallbackUrl = `https://tavus.daily.co/${demoData.tavus_conversation_id}`;
            console.log('Using fallback conversation URL:', fallbackUrl);
            setTavusConversationUrl(fallbackUrl);
          }
        } else {
          // No conversation exists - show message to start one
          setError('Please start a demo conversation first from the Agent Settings tab.');
        }

      } catch (err: any) {
        setError(err.message || 'Failed to load demo.');
      } finally {
        setLoading(false);
      }
    };

    fetchDemoAndStartConversation();
  }, [demoId]);

  // Monitor conversation for video requests
  useEffect(() => {
    if (!demo?.tavus_conversation_id || !tavusConversationUrl) return;

    const monitorConversation = async () => {
      try {
        const response = await fetch('/api/monitor-conversation', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            conversationId: demo.tavus_conversation_id,
            demoId: demo.id
          })
        });

        const result = await response.json();
        if (result.conversationActive) {
          console.log('Conversation monitoring active:', result.message);
        }
      } catch (error) {
        console.error('Conversation monitoring error:', error);
      }
    };

    // Start monitoring when conversation is active
    setIsMonitoring(true);
    const interval = setInterval(monitorConversation, 10000); // Check every 10 seconds

    return () => {
      clearInterval(interval);
      setIsMonitoring(false);
    };
  }, [demo?.tavus_conversation_id, tavusConversationUrl, demo?.id]);

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
              onClick={() => router.push(`/demos/${demoId}/configure`)}
              className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
            >
              Configure Demo
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Left Column: Tavus Conversation */}
          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            <div className="p-4 bg-indigo-600 text-white">
              <h2 className="text-lg font-semibold">AI Demo Assistant</h2>
              <p className="text-indigo-100 text-sm">Ask questions and request to see specific features</p>
            </div>
            
            {tavusConversationUrl ? (
              <TavusConversation 
                conversationUrl={tavusConversationUrl}
                onToolCall={handleRealTimeToolCall}
                isMonitoring={isMonitoring}
              />
            ) : (
              <div className="h-96 flex items-center justify-center bg-gray-100">
                <p className="text-gray-500">Starting conversation...</p>
              </div>
            )}
          </div>

          {/* Right Column: Video Player & CTA */}
          <div className="space-y-6">
            
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
          </div>
        </div>
      </main>
    </div>
  );
}
