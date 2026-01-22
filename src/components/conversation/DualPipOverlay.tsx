'use client';

import React from 'react';
import {
  DailyVideo,
  useLocalSessionId,
  useVideoTrack,
} from '@daily-co/daily-react';
import { useReplicaIDs } from '@/components/cvi/hooks/use-replica-ids';

interface DualPipOverlayProps {
  visible: boolean;
}

/**
 * Dual Picture-in-Picture overlay showing both Domo agent and User
 * during video playback. Positioned in bottom-left corner.
 */
export function DualPipOverlay({ visible }: DualPipOverlayProps) {
  const localId = useLocalSessionId();
  const replicaIds = useReplicaIDs();
  const replicaId = replicaIds[0];

  const localVideoState = useVideoTrack(localId);
  const replicaVideoState = useVideoTrack(replicaId);

  if (!visible || !replicaId) return null;

  return (
    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-4 pointer-events-auto" style={{ zIndex: 30 }}>
      {/* Domo Agent Video */}
      <div className="relative">
        <div
          className="w-28 h-28 rounded-full overflow-hidden border-3 border-domo-primary shadow-xl bg-domo-bg-card"
          title="Domo AI"
        >
          {replicaVideoState.isOff ? (
            <div className="w-full h-full flex items-center justify-center bg-domo-bg-elevated">
              <img src="/domo-logo.png" alt="Domo" className="w-16 h-16 object-contain" />
            </div>
          ) : (
            <DailyVideo
              sessionId={replicaId}
              type="video"
              className="w-full h-full object-cover scale-150"
              style={{ transform: 'scale(1.5)' }}
            />
          )}
        </div>
        <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 bg-domo-primary text-white text-[10px] px-1.5 py-0.5 rounded-full font-medium">
          Domo
        </div>
      </div>

      {/* User Video */}
      <div className="relative">
        <div
          className="w-28 h-28 rounded-full overflow-hidden border-3 border-domo-border shadow-xl bg-domo-bg-card"
          title="You"
        >
          {localVideoState.isOff ? (
            <div className="w-full h-full flex items-center justify-center bg-domo-bg-elevated">
              <svg className="w-12 h-12 text-domo-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
          ) : (
            <DailyVideo
              automirror
              sessionId={localId}
              type="video"
              className="w-full h-full object-cover scale-150"
              style={{ transform: 'scale(1.5)' }}
            />
          )}
        </div>
        <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 bg-domo-bg-elevated text-domo-text-secondary text-[10px] px-1.5 py-0.5 rounded-full font-medium border border-domo-border">
          You
        </div>
      </div>
    </div>
  );
}

export default DualPipOverlay;
