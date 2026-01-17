'use client';

import { useState } from 'react';
import { InlineVideoPlayer } from '../demos/[demoId]/experience/components/InlineVideoPlayer';

export default function SimpleVideoTestPage() {
  const [playingVideoUrl, setPlayingVideoUrl] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<string[]>([]);

  const addTestResult = (message: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  // Mock video URLs for testing
  const mockVideos = {
    'First Video': 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    'Second Video': 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
    'Third Video': 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    'Fourth Video': 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4'
  };

  const testVideoPlayback = (videoTitle: string) => {
    addTestResult(`Testing video playback for: ${videoTitle}`);

    const videoUrl = mockVideos[videoTitle as keyof typeof mockVideos];
    if (videoUrl) {
      setPlayingVideoUrl(videoUrl);
      addTestResult(`✅ Playing video: ${videoTitle}`);
    } else {
      addTestResult(`❌ Video not found: ${videoTitle}`);
    }
  };

  const testToolCall = (toolName: string, args: any) => {
    addTestResult(`🔧 Tool call received: ${toolName} with args: ${JSON.stringify(args)}`);

    if (toolName === 'fetch_video' && args.title) {
      testVideoPlayback(args.title);
    }
  };

  return (
    <div className="min-h-screen bg-domo-bg-dark p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-8">Simple Video System Test</h1>
        <p className="text-domo-text-secondary mb-8">
          This test uses mock video URLs to test the video player component without database dependencies.
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Test Controls */}
          <div className="space-y-6">
            <div className="bg-domo-bg-card rounded-lg border border-domo-border p-6">
              <h2 className="text-xl font-semibold text-white mb-4">Video Playback Tests</h2>
              <div className="space-y-3">
                {Object.keys(mockVideos).map((videoTitle) => (
                  <button
                    key={videoTitle}
                    onClick={() => testVideoPlayback(videoTitle)}
                    className="w-full px-4 py-2 bg-domo-primary text-white rounded-md hover:bg-domo-secondary text-left"
                  >
                    Play: {videoTitle}
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-domo-bg-card rounded-lg border border-domo-border p-6">
              <h2 className="text-xl font-semibold text-white mb-4">Tool Call Simulation</h2>
              <div className="space-y-3">
                {Object.keys(mockVideos).map((videoTitle) => (
                  <button
                    key={videoTitle}
                    onClick={() => testToolCall('fetch_video', { title: videoTitle })}
                    className="w-full px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 text-left"
                  >
                    Tool Call: {videoTitle}
                  </button>
                ))}
              </div>
            </div>

            {/* Test Results */}
            <div className="bg-domo-bg-card rounded-lg border border-domo-border p-6">
              <h2 className="text-xl font-semibold text-white mb-4">Test Results</h2>
              <div className="bg-domo-bg-elevated rounded-md p-4 max-h-96 overflow-y-auto">
                {testResults.length === 0 ? (
                  <p className="text-domo-text-muted italic">No tests run yet...</p>
                ) : (
                  <div className="space-y-1">
                    {testResults.map((result, index) => (
                      <div key={index} className="text-sm font-mono text-domo-text-secondary">
                        {result}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <button
                onClick={() => setTestResults([])}
                className="mt-3 px-3 py-1 bg-domo-bg-elevated text-white text-sm rounded hover:bg-domo-border"
              >
                Clear Results
              </button>
            </div>
          </div>

          {/* Video Display */}
          <div className="space-y-6">
            <div className="bg-domo-bg-card rounded-lg border border-domo-border p-6">
              <h2 className="text-xl font-semibold text-white mb-4">Video Player</h2>
              {playingVideoUrl ? (
                <InlineVideoPlayer
                  videoUrl={playingVideoUrl}
                  onClose={() => {
                    setPlayingVideoUrl(null);
                    addTestResult('🔴 Video player closed');
                  }}
                />
              ) : (
                <div className="h-64 bg-domo-bg-elevated rounded-lg flex items-center justify-center">
                  <p className="text-domo-text-muted">No video playing</p>
                </div>
              )}
            </div>

            <div className="bg-domo-bg-card rounded-lg border border-domo-border p-6">
              <h2 className="text-xl font-semibold text-white mb-4">Current Status</h2>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-domo-text-secondary">Video URL:</span>
                  <span className="font-mono text-xs text-domo-text-muted">
                    {playingVideoUrl ? playingVideoUrl.substring(0, 50) + '...' : 'None'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-domo-text-secondary">Tests Run:</span>
                  <span className="text-white">{testResults.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-domo-text-secondary">Available Videos:</span>
                  <span className="text-white">{Object.keys(mockVideos).length}</span>
                </div>
              </div>
            </div>

            <div className="bg-domo-bg-card rounded-lg border border-domo-border p-6">
              <h2 className="text-xl font-semibold text-white mb-4">Mock Video URLs</h2>
              <div className="space-y-2 text-xs">
                {Object.entries(mockVideos).map(([title, url]) => (
                  <div key={title} className="border-b border-domo-border pb-2">
                    <div className="font-semibold text-white">{title}</div>
                    <div className="text-domo-text-muted font-mono">{url}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
