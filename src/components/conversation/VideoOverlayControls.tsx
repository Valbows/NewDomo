'use client';

import React from 'react';
import {
  useDaily,
  useLocalSessionId,
  useVideoTrack,
  useAudioTrack,
} from '@daily-co/daily-react';

interface VideoOverlayControlsProps {
  onLeave: () => void;
}

/**
 * Floating control buttons for video overlay mode.
 * Shows mic, camera, and end call buttons positioned at bottom-right.
 */
export function VideoOverlayControls({ onLeave }: VideoOverlayControlsProps) {
  const daily = useDaily();
  const localId = useLocalSessionId();
  const videoState = useVideoTrack(localId);
  const audioState = useAudioTrack(localId);

  const isMicOff = audioState.isOff;
  const isCamOff = videoState.isOff;

  const toggleMic = () => {
    if (!daily) return;
    daily.setLocalAudio(!isMicOff);
  };

  const toggleCam = () => {
    if (!daily) return;
    daily.setLocalVideo(!isCamOff);
  };

  const handleLeave = () => {
    if (daily) {
      daily.leave();
    }
    onLeave();
  };

  return (
    <div
      className="absolute bottom-6 right-6 flex gap-3 pointer-events-auto"
      style={{ zIndex: 30 }}
    >
      {/* Mic button */}
      <button
        onClick={toggleMic}
        className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
          isMicOff
            ? 'bg-red-500/90 hover:bg-red-500'
            : 'bg-white/15 hover:bg-white/25'
        }`}
        title={isMicOff ? 'Unmute' : 'Mute'}
      >
        {isMicOff ? (
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
          </svg>
        ) : (
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
          </svg>
        )}
      </button>

      {/* Camera button */}
      <button
        onClick={toggleCam}
        className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
          isCamOff
            ? 'bg-red-500/90 hover:bg-red-500'
            : 'bg-white/15 hover:bg-white/25'
        }`}
        title={isCamOff ? 'Turn on camera' : 'Turn off camera'}
      >
        {isCamOff ? (
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3l18 18" />
          </svg>
        ) : (
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
        )}
      </button>

      {/* End call button */}
      <button
        onClick={handleLeave}
        className="w-12 h-12 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center transition-all"
        title="End call"
      >
        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}

export default VideoOverlayControls;
