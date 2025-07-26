'use client';

import { useState } from 'react';
import { InlineVideoPlayer } from '../demos/[demoId]/experience/components/InlineVideoPlayer';

export default function TestVideoPage() {
  const [playingVideoUrl, setPlayingVideoUrl] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<string[]>([]);

  const addTestResult = (message: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const testVideoFetch = async (videoTitle: string) => {
    try {
      addTestResult(`Testing video fetch for: ${videoTitle}`);
      
      const response = await fetch('/api/test-video-playback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          demoId: '12345678-1234-1234-1234-123456789012', // Using a test demo ID
          videoTitle: videoTitle
        })
      });
      
      const result = await response.json();
      addTestResult(`API Response: ${JSON.stringify(result)}`);
      
      if (result.success && result.videoUrl) {
        setPlayingVideoUrl(result.videoUrl);
        addTestResult(`✅ Video URL found: ${result.videoUrl}`);
      } else {
        addTestResult(`❌ No video found or error: ${result.message || 'Unknown error'}`);
      }
    } catch (error) {
      addTestResult(`❌ Fetch error: ${error}`);
      console.error('Video fetch test error:', error);
    }
  };

  const testToolCall = (toolName: string, args: any) => {
    addTestResult(`🔧 Tool call received: ${toolName} with args: ${JSON.stringify(args)}`);
    
    if (toolName === 'fetch_video' && args.title) {
      testVideoFetch(args.title);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Video System Test</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Test Controls */}
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-xl font-semibold mb-4">Manual Video Tests</h2>
              <div className="space-y-3">
                <button
                  onClick={() => testVideoFetch('Fourth Video')}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Test: Fourth Video
                </button>
                <button
                  onClick={() => testVideoFetch('First Video')}
                  className="w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                >
                  Test: First Video
                </button>
                <button
                  onClick={() => testVideoFetch('Nonexistent Video')}
                  className="w-full px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                >
                  Test: Nonexistent Video (Should Fail)
                </button>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-xl font-semibold mb-4">Tool Call Simulation</h2>
              <div className="space-y-3">
                <button
                  onClick={() => testToolCall('fetch_video', { title: 'Fourth Video' })}
                  className="w-full px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
                >
                  Simulate Tool Call: fetch_video
                </button>
                <button
                  onClick={() => testToolCall('unknown_tool', { data: 'test' })}
                  className="w-full px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
                >
                  Simulate Unknown Tool Call
                </button>
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
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
