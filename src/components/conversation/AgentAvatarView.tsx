'use client';

/**
 * AgentAvatarView Component
 *
 * Displays the AI agent as a large centered video with status indicators.
 * Fills the available space with the agent video.
 */

import React, { memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DailyVideo, useActiveSpeakerId, useLocalSessionId } from '@daily-co/daily-react';
import { useReplicaIDs } from '@/components/cvi/hooks/use-replica-ids';
import { AudioWave } from '@/components/cvi/components/audio-wave';
import type { SpeakingStatus } from './types';

interface AgentAvatarViewProps {
  /** Override speaking status (for testing) */
  speakingStatus?: SpeakingStatus;
  /** Agent name to display */
  agentName?: string;
}

export const AgentAvatarView = memo(function AgentAvatarView({
  speakingStatus: overrideStatus,
  agentName,
}: AgentAvatarViewProps) {
  const replicaIds = useReplicaIDs();
  const replicaId = replicaIds[0];
  const activeSpeakerId = useActiveSpeakerId();
  const localSessionId = useLocalSessionId();

  // Determine if the agent is speaking
  const isAgentSpeaking = activeSpeakerId === replicaId;
  const status: SpeakingStatus = overrideStatus || (isAgentSpeaking ? 'speaking' : 'listening');

  if (!replicaId) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="w-full h-full flex flex-col items-center justify-center bg-domo-bg-dark"
      >
        {/* Centered connecting indicator */}
        <div className="flex flex-col items-center gap-6">
          <div className="relative">
            <motion.div
              className="absolute inset-0 rounded-full bg-domo-primary/20"
              animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.1, 0.3] }}
              transition={{ duration: 2, repeat: Infinity }}
              style={{ width: 120, height: 120, margin: -10 }}
            />
            <div className="w-24 h-24 rounded-full bg-domo-bg-elevated border-2 border-domo-border flex items-center justify-center">
              <motion.svg
                className="w-10 h-10 text-domo-text-secondary/50"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </motion.svg>
            </div>
          </div>

          {/* Connecting text */}
          <div className="flex items-center gap-2">
            <span className="text-domo-text-secondary text-lg">Connecting</span>
            <span className="flex gap-1">
              {[0, 1, 2].map((i) => (
                <motion.span
                  key={i}
                  className="w-1.5 h-1.5 bg-domo-text-secondary rounded-full"
                  animate={{ opacity: [0, 1, 0] }}
                  transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
                />
              ))}
            </span>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="w-full h-full flex flex-col items-center justify-center relative"
    >
      {/* Full-size video container - fills entire parent */}
      <div className="relative w-full h-full">
        {/* Speaking glow effect */}
        <AnimatePresence>
          {status === 'speaking' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-domo-primary/5 pointer-events-none"
            />
          )}
        </AnimatePresence>

        {/* Video container - fills all space */}
        <div
          className={`relative w-full h-full overflow-hidden transition-all duration-300 ${
            status === 'speaking'
              ? 'ring-2 ring-domo-primary ring-inset'
              : ''
          }`}
        >
          <DailyVideo
            sessionId={replicaId}
            type="video"
            className="w-full h-full object-cover"
          />
        </div>

        {/* Audio wave indicator at bottom center */}
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
          <AudioWave id={replicaId} />
        </div>

        {/* Status indicator - bottom left corner */}
        <div className="absolute bottom-4 left-4 flex items-center gap-2 bg-black/60 backdrop-blur-sm px-3 py-1.5 rounded-full">
          <div
            className={`w-2.5 h-2.5 rounded-full transition-colors duration-300 ${
              status === 'speaking'
                ? 'bg-domo-primary animate-pulse'
                : status === 'processing'
                  ? 'bg-amber-500 animate-pulse'
                  : 'bg-domo-success'
            }`}
          />
          <span
            className={`text-sm font-medium transition-colors duration-300 ${
              status === 'speaking'
                ? 'text-domo-primary'
                : status === 'processing'
                  ? 'text-amber-500'
                  : 'text-domo-success'
            }`}
          >
            {status === 'speaking' ? 'Speaking' : status === 'processing' ? 'Processing' : 'Listening'}
          </span>
        </div>

        {/* User video thumbnail - bottom right corner */}
        {localSessionId && (
          <div className="absolute bottom-4 right-4 w-32 h-24 rounded-lg overflow-hidden border-2 border-white/20 shadow-lg bg-domo-bg-dark">
            <DailyVideo
              sessionId={localSessionId}
              type="video"
              className="w-full h-full object-cover mirror"
              style={{ transform: 'scaleX(-1)' }}
            />
            <div className="absolute bottom-1 left-1 bg-black/60 backdrop-blur-sm px-2 py-0.5 rounded text-[10px] text-white font-medium">
              You
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
});
