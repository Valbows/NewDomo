import {InlineVideoPlayer} from './InlineVideoPlayer';
import type { InlineVideoPlayerHandle } from './InlineVideoPlayer';
import {UIState} from '@/lib/tavus';

interface VideoControlsProps {
  uiState: UIState;
  playingVideoUrl: string | null;
  videoPlayerRef: React.RefObject<InlineVideoPlayerHandle>;
  onVideoClose: () => void;
  onVideoEnd: () => void;
}

export function VideoControls({
  uiState,
  playingVideoUrl,
  videoPlayerRef,
  onVideoClose,
  onVideoEnd,
}: VideoControlsProps) {
  if (uiState !== UIState.VIDEO_PLAYING || !playingVideoUrl) {
    return null;
  }

  return (
    <div className="absolute inset-0 bg-black flex flex-col z-30" data-testid="video-overlay">
      <div className="flex-shrink-0 bg-gray-800 text-white p-4 flex justify-between items-center">
        <h2 className="text-lg font-semibold">Demo Video</h2>
        <button
          data-testid="button-close-video"
          onClick={onVideoClose}
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
            onClose={onVideoClose}
            onVideoEnd={onVideoEnd}
          />
        </div>
      </div>
    </div>
  );
}