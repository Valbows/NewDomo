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
    <div className="min-h-screen bg-domo-bg-dark p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-8">Video System Test</h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Test Controls */}
          <div className="space-y-6">
            <div className="bg-domo-bg-card rounded-lg border border-domo-border p-6">
              <h2 className="text-xl font-semibold text-white mb-4">Manual Video Tests</h2>
              <div className="space-y-3">
                <button
                  onClick={() => testVideoFetch('Fourth Video')}
                  className="w-full px-4 py-2 bg-domo-primary text-white rounded-md hover:bg-domo-secondary"
                >
                  Test: Fourth Video
                </button>
                <button
                  onClick={() => testVideoFetch('First Video')}
                  className="w-full px-4 py-2 bg-domo-success text-white rounded-md hover:bg-domo-success/80"
                >
                  Test: First Video
                </button>
                <button
                  onClick={() => testVideoFetch('Nonexistent Video')}
                  className="w-full px-4 py-2 bg-domo-error text-white rounded-md hover:bg-domo-error/80"
                >
                  Test: Nonexistent Video (Should Fail)
                </button>
              </div>
            </div>

            <div className="bg-domo-bg-card rounded-lg border border-domo-border p-6">
              <h2 className="text-xl font-semibold text-white mb-4">Tool Call Simulation</h2>
              <div className="space-y-3">
                <button
                  onClick={() => testToolCall('fetch_video', { title: 'Fourth Video' })}
                  className="w-full px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
                >
                  Simulate Tool Call: fetch_video
                </button>
                <button
                  onClick={() => testToolCall('unknown_tool', { data: 'test' })}
                  className="w-full px-4 py-2 bg-domo-bg-elevated text-white rounded-md hover:bg-domo-border"
                >
                  Simulate Unknown Tool Call
                </button>
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
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
