'use client';

import { useState, useEffect } from 'react';
import { Video, Mic, MicOff, VideoOff } from 'lucide-react';

interface PreCallLobbyProps {
  demoName: string;
  agentName?: string;
  onJoinCall: () => void;
  loading?: boolean;
  error?: string | null;
}

export function PreCallLobby({
  demoName,
  agentName = 'AI Assistant',
  onJoinCall,
  loading = false,
  error = null,
}: PreCallLobbyProps) {
  const [cameraPermission, setCameraPermission] = useState<'granted' | 'denied' | 'prompt'>('prompt');
  const [micPermission, setMicPermission] = useState<'granted' | 'denied' | 'prompt'>('prompt');
  const [checkingPermissions, setCheckingPermissions] = useState(true);

  // Check media permissions on mount
  useEffect(() => {
    const checkPermissions = async () => {
      try {
        // Check camera permission
        const cameraStatus = await navigator.permissions.query({ name: 'camera' as PermissionName });
        setCameraPermission(cameraStatus.state);
        cameraStatus.onchange = () => setCameraPermission(cameraStatus.state);

        // Check microphone permission
        const micStatus = await navigator.permissions.query({ name: 'microphone' as PermissionName });
        setMicPermission(micStatus.state);
        micStatus.onchange = () => setMicPermission(micStatus.state);
      } catch (err) {
        // Permissions API not supported, assume prompt state
        console.warn('Permissions API not supported:', err);
      } finally {
        setCheckingPermissions(false);
      }
    };

    checkPermissions();
  }, []);

  const getPermissionIcon = (permission: 'granted' | 'denied' | 'prompt', type: 'camera' | 'mic') => {
    if (type === 'camera') {
      return permission === 'denied' ? (
        <VideoOff className="w-5 h-5 text-domo-error" />
      ) : (
        <Video className={`w-5 h-5 ${permission === 'granted' ? 'text-domo-success' : 'text-domo-text-muted'}`} />
      );
    }
    return permission === 'denied' ? (
      <MicOff className="w-5 h-5 text-domo-error" />
    ) : (
      <Mic className={`w-5 h-5 ${permission === 'granted' ? 'text-domo-success' : 'text-domo-text-muted'}`} />
    );
  };

  const getPermissionText = (permission: 'granted' | 'denied' | 'prompt') => {
    switch (permission) {
      case 'granted':
        return 'Ready';
      case 'denied':
        return 'Blocked';
      default:
        return 'Will ask';
    }
  };

  return (
    <div className="min-h-screen bg-domo-bg-dark flex items-center justify-center p-4">
      <div className="bg-domo-bg-card border border-domo-border rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-domo-primary to-domo-secondary px-6 py-8 text-center">
          {/* Agent Avatar */}
          <div className="w-24 h-24 mx-auto bg-domo-bg-card rounded-full flex items-center justify-center shadow-lg mb-4">
            <div className="w-20 h-20 bg-gradient-to-br from-domo-primary to-domo-secondary rounded-full flex items-center justify-center">
              <svg
                className="w-12 h-12 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                />
              </svg>
            </div>
          </div>

          <h1 className="text-2xl font-bold text-white mb-1 font-heading">
            Meet {agentName}
          </h1>
          <p className="text-white/80 text-sm">
            Your AI Demo Assistant
          </p>
        </div>

        {/* Content */}
        <div className="px-6 py-6">
          <div className="text-center mb-6">
            <p className="text-domo-text-secondary leading-relaxed">
              Ready to explore <span className="font-semibold text-white">{demoName}</span>?
              I'll guide you through the features and answer any questions you have.
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 bg-domo-error/10 border border-domo-error/20 rounded-lg">
              <p className="text-domo-error text-sm text-center">{error}</p>
            </div>
          )}

          {/* Join Button */}
          <button
            onClick={onJoinCall}
            disabled={loading}
            className="w-full py-4 px-6 bg-gradient-to-r from-domo-primary to-domo-secondary text-white font-semibold rounded-xl hover:from-domo-primary/90 hover:to-domo-secondary/90 transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
          >
            {loading ? (
              <>
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>Connecting...</span>
              </>
            ) : (
              <>
                <Video className="w-5 h-5" />
                <span>Join Video Call</span>
              </>
            )}
          </button>

          {/* Permission Status */}
          {!checkingPermissions && (
            <div className="mt-4 flex justify-center gap-6">
              <div className="flex items-center gap-2 text-sm">
                {getPermissionIcon(cameraPermission, 'camera')}
                <span className={`${cameraPermission === 'denied' ? 'text-domo-error' : 'text-domo-text-secondary'}`}>
                  Camera: {getPermissionText(cameraPermission)}
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                {getPermissionIcon(micPermission, 'mic')}
                <span className={`${micPermission === 'denied' ? 'text-domo-error' : 'text-domo-text-secondary'}`}>
                  Mic: {getPermissionText(micPermission)}
                </span>
              </div>
            </div>
          )}

          {/* Permission Warning */}
          {(cameraPermission === 'denied' || micPermission === 'denied') && (
            <p className="mt-3 text-xs text-center text-amber-400">
              Please enable camera and microphone in your browser settings for the best experience.
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-domo-bg-elevated border-t border-domo-border">
          <p className="text-xs text-center text-domo-text-muted">
            Powered by <span className="font-medium text-domo-text-secondary">Domo</span>
          </p>
        </div>
      </div>
    </div>
  );
}

export default PreCallLobby;
