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
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Simple Video System Test</h1>
        <p className="text-gray-600 mb-8">
          This test uses mock video URLs to test the video player component without database dependencies.
        </p>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Test Controls */}
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-xl font-semibold mb-4">Video Playback Tests</h2>
              <div className="space-y-3">
                {Object.keys(mockVideos).map((videoTitle) => (
                  <button
                    key={videoTitle}
                    onClick={() => testVideoPlayback(videoTitle)}
                    className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-left"
                  >
                    Play: {videoTitle}
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-xl font-semibold mb-4">Tool Call Simulation</h2>
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
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-xl font-semibold mb-4">Test Results</h2>
              <div className="bg-gray-100 rounded-md p-4 max-h-96 overflow-y-auto">
                {testResults.length === 0 ? (
                  <p className="text-gray-500 italic">No tests run yet...</p>
                ) : (
                  <div className="space-y-1">
                    {testResults.map((result, index) => (
                      <div key={index} className="text-sm font-mono">
                        {result}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <button
                onClick={() => setTestResults([])}
                className="mt-3 px-3 py-1 bg-gray-500 text-white text-sm rounded hover:bg-gray-600"
              >
                Clear Results
              </button>
            </div>
          </div>

          {/* Video Display */}
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-xl font-semibold mb-4">Video Player</h2>
              {playingVideoUrl ? (
                <InlineVideoPlayer
                  videoUrl={playingVideoUrl}
                  onClose={() => {
                    setPlayingVideoUrl(null);
                    addTestResult('🔴 Video player closed');
                  }}
                />
              ) : (
                <div className="h-64 bg-gray-100 rounded-lg flex items-center justify-center">
                  <p className="text-gray-500">No video playing</p>
                </div>
              )}
            </div>

            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-xl font-semibold mb-4">Current Status</h2>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Video URL:</span>
                  <span className="font-mono text-xs">
                    {playingVideoUrl ? playingVideoUrl.substring(0, 50) + '...' : 'None'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Tests Run:</span>
                  <span>{testResults.length}</span>
                </div>
                <div className="flex justify-between">
                  <span>Available Videos:</span>
                  <span>{Object.keys(mockVideos).length}</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-xl font-semibold mb-4">Mock Video URLs</h2>
              <div className="space-y-2 text-xs">
                {Object.entries(mockVideos).map(([title, url]) => (
                  <div key={title} className="border-b pb-2">
                    <div className="font-semibold">{title}</div>
                    <div className="text-gray-500 font-mono">{url}</div>
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
