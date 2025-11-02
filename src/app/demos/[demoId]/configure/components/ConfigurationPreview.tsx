import {VideoPlayer} from './VideoPlayer';
import {UIState} from '@/lib/tavus';

interface ConfigurationPreviewProps {
  uiState: UIState;
  playingVideoUrl: string | null;
  onCloseVideo: () => void;
}

export function ConfigurationPreview({
  uiState,
  playingVideoUrl,
  onCloseVideo,
}: ConfigurationPreviewProps) {
  return (
    <>
      {/* UI State Indicator */}
      {uiState === UIState.VIDEO_PLAYING && (
        <div className="mb-4 p-3 bg-blue-100 border border-blue-300 rounded-md">
          <p className="text-blue-800 font-medium">🎥 Video Playing - Agent is showing demo content</p>
        </div>
      )}
      {uiState === UIState.DEMO_COMPLETE && (
        <div className="mb-4 p-4 bg-green-100 border border-green-300 rounded-md">
          <p className="text-green-800 font-medium">✅ Demo Complete - Ready for trial signup!</p>
          <button className="mt-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700">
            Start Your Trial
          </button>
        </div>
      )}
      {uiState === UIState.AGENT_THINKING && (
        <div className="mb-4 p-3 bg-yellow-100 border border-yellow-300 rounded-md">
          <p className="text-yellow-800 font-medium">🤔 Agent is thinking...</p>
        </div>
      )}
      
      {playingVideoUrl && (
        <VideoPlayer 
          videoUrl={playingVideoUrl} 
          onClose={onCloseVideo}
        />
      )}
    </>
  );
}