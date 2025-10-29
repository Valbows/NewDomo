/**
 * Type definitions for CVI (Conversational Video Interface) components
 */

import { ReactNode } from 'react';

export interface CVIProviderProps {
  children: ReactNode;
  roomUrl?: string;
  token?: string;
  onJoin?: () => void;
  onLeave?: () => void;
  onError?: (error: Error) => void;
}

export interface ConversationProps {
  roomUrl: string;
  token: string;
  onEnd?: () => void;
  onError?: (error: Error) => void;
  className?: string;
}

export interface AudioWaveProps {
  id: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  color?: string;
}

export interface DeviceSelectProps {
  onCameraChange?: (deviceId: string) => void;
  onMicrophoneChange?: (deviceId: string) => void;
  onSpeakerChange?: (deviceId: string) => void;
  className?: string;
}

export interface MediaDevice {
  deviceId: string;
  label: string;
  kind: 'videoinput' | 'audioinput' | 'audiooutput';
}

export interface CallState {
  isJoined: boolean;
  isConnecting: boolean;
  error: string | null;
  participants: Participant[];
  localParticipant: LocalParticipant | null;
}

export interface Participant {
  id: string;
  name?: string;
  isLocal: boolean;
  isVideoEnabled: boolean;
  isAudioEnabled: boolean;
  isScreenSharing: boolean;
}

export interface LocalParticipant extends Participant {
  camera: MediaDevice | null;
  microphone: MediaDevice | null;
  speaker: MediaDevice | null;
}

export interface CVICallHookReturn {
  callState: CallState;
  joinCall: (roomUrl: string, token?: string) => Promise<void>;
  leaveCall: () => Promise<void>;
  toggleCamera: () => void;
  toggleMicrophone: () => void;
  startScreenShare: () => void;
  stopScreenShare: () => void;
}

export interface LocalCameraHookReturn {
  isEnabled: boolean;
  device: MediaDevice | null;
  devices: MediaDevice[];
  toggle: () => void;
  setDevice: (deviceId: string) => void;
  error: string | null;
}

export interface LocalMicrophoneHookReturn {
  isEnabled: boolean;
  device: MediaDevice | null;
  devices: MediaDevice[];
  toggle: () => void;
  setDevice: (deviceId: string) => void;
  audioLevel: number;
  error: string | null;
}

export interface LocalScreenshareHookReturn {
  isSharing: boolean;
  start: () => Promise<void>;
  stop: () => void;
  error: string | null;
}

export interface ReplicaIdsHookReturn {
  replicaIds: string[];
  activeReplicaId: string | null;
  setActiveReplica: (id: string) => void;
}

// CVI Events
export const CVI_EVENTS = {
  CALL_JOINED: 'call.joined',
  CALL_LEFT: 'call.left',
  PARTICIPANT_JOINED: 'participant.joined',
  PARTICIPANT_LEFT: 'participant.left',
  CAMERA_TOGGLED: 'camera.toggled',
  MICROPHONE_TOGGLED: 'microphone.toggled',
  SCREENSHARE_STARTED: 'screenshare.started',
  SCREENSHARE_STOPPED: 'screenshare.stopped',
  ERROR: 'error',
} as const;

// CVI States
export const CVI_STATES = {
  IDLE: 'idle',
  CONNECTING: 'connecting',
  CONNECTED: 'connected',
  DISCONNECTING: 'disconnecting',
  ERROR: 'error',
} as const;