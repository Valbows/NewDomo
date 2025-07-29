'use client';

import { useEffect, useRef, useState } from 'react';

interface InlineVideoPlayerProps {
  videoUrl: string;
  onClose: () => void;
  onVideoEnd?: () => void;
}

export function InlineVideoPlayer({ videoUrl, onClose, onVideoEnd }: InlineVideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>('');

  useEffect(() => {
    const videoElement = videoRef.current;
    if (!videoElement) return;

    const handleCanPlay = async () => {
      // Autoplay the video
      try {
        await videoElement.play();
        console.log('Video started playing:', videoUrl);
      } catch (error) {
        console.error("Video autoplay failed:", error);
      }
    };

    const handleEnded = () => {
      console.log('Video ended');
      if (onVideoEnd) {
        onVideoEnd();
      }
    };

    const handleError = (error: Event) => {
      console.error('Video error:', error);
      const videoElement = error.target as HTMLVideoElement;
      if (videoElement && videoElement.error) {
        const errorDetails = {
          code: videoElement.error.code,
          message: videoElement.error.message,
          networkState: videoElement.networkState,
          readyState: videoElement.readyState,
          src: videoElement.src
        };
        console.error('Video error details:', errorDetails);
        setHasError(true);
        setErrorMessage(`Video loading failed (Code: ${videoElement.error.code}): ${videoElement.error.message}`);
      } else {
        setHasError(true);
        setErrorMessage('Unknown video error occurred');
      }
    };

    videoElement.addEventListener('canplay', handleCanPlay);
    videoElement.addEventListener('ended', handleEnded);
    videoElement.addEventListener('error', handleError);

    // Clean up event listeners
    return () => {
      videoElement.removeEventListener('canplay', handleCanPlay);
      videoElement.removeEventListener('ended', handleEnded);
      videoElement.removeEventListener('error', handleError);
    };
  }, [videoUrl]);

  return (
    <div className="space-y-4">
      <div className="relative">
        <video
          ref={videoRef}
          src={videoUrl}
          controls
          autoPlay
          muted // Muting is often required for autoplay to work reliably
          className="w-full h-full bg-black rounded-lg"
          poster="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' fill='%23f3f4f6'/%3E%3Ctext x='50' y='50' font-family='Arial' font-size='14' fill='%236b7280' text-anchor='middle' dy='0.3em'%3ELoading...%3C/text%3E%3C/svg%3E"
        />
        
        {/* Error overlay */}
        {hasError && (
          <div className="absolute inset-0 bg-red-100 border-2 border-red-300 rounded-lg flex items-center justify-center">
            <div className="text-center p-4">
              <div className="text-red-600 text-4xl mb-2">⚠️</div>
              <h4 className="text-red-800 font-semibold mb-2">Video Loading Error</h4>
              <p className="text-red-700 text-sm mb-3">{errorMessage}</p>
              <div className="text-xs text-red-600 mb-3">
                <p>Video URL: {videoUrl}</p>
              </div>
              <button
                onClick={onClose}
                className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
              >
                Close
              </button>
            </div>
          </div>
        )}
        
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-2 right-2 bg-black bg-opacity-50 text-white rounded-full p-2 hover:bg-opacity-70 transition-opacity"
          title="Close video"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      
      {/* Video info */}
      <div className="flex items-center justify-between text-sm text-gray-600">
        <span>🎬 Demo video playing</span>
        <button
          onClick={onClose}
          className="text-indigo-600 hover:text-indigo-800 font-medium"
        >
          Close Video
        </button>
      </div>
    </div>
  );
}
