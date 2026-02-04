'use client';

/**
 * AgentHeader Component
 *
 * Header bar for the agent conversation view displaying:
 * - Agent avatar/initials
 * - Agent name
 * - Connection status indicator
 * - Help button
 */

import { memo, type ReactNode } from 'react';
import { useMeetingState } from '@daily-co/daily-react';

interface AgentHeaderProps {
  /** Agent name to display */
  agentName?: string;
  /** Override connection status (for testing) */
  connectionStatus?: 'connected' | 'connecting' | 'disconnected' | 'error';
  /** Callback when help button is clicked */
  onHelpClick?: () => void;
  /** Optional children to render (e.g., ModuleProgressIndicator) */
  children?: ReactNode;
}

export const AgentHeader = memo(function AgentHeader({
  agentName = 'Video Agent',
  connectionStatus: overrideStatus,
  onHelpClick,
  children,
}: AgentHeaderProps) {
  const meetingState = useMeetingState();

  // Determine connection status from Daily meeting state
  const getConnectionStatus = (): 'connected' | 'connecting' | 'disconnected' | 'error' => {
    if (overrideStatus) return overrideStatus;

    switch (meetingState) {
      case 'joined-meeting':
        return 'connected';
      case 'joining-meeting':
        return 'connecting';
      case 'error':
        return 'error';
      case 'left-meeting':
      case 'new':
      default:
        return 'disconnected';
    }
  };

  const status = getConnectionStatus();

  // Status configuration
  const statusConfig = {
    connected: {
      text: 'Connected',
      dotClass: 'bg-domo-success',
      textClass: 'text-domo-success',
    },
    connecting: {
      text: 'Connecting...',
      dotClass: 'bg-amber-500 animate-pulse',
      textClass: 'text-amber-500',
    },
    disconnected: {
      text: 'Disconnected',
      dotClass: 'bg-domo-text-secondary',
      textClass: 'text-domo-text-secondary',
    },
    error: {
      text: 'Connection Error',
      dotClass: 'bg-red-500',
      textClass: 'text-red-500',
    },
  };

  const { text, dotClass, textClass } = statusConfig[status];

  // Generate initials from agent name
  const initials = agentName
    .split(' ')
    .map((word) => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <header className="flex-shrink-0 bg-domo-bg-card border-b border-domo-border px-3 sm:px-4 py-2 sm:py-3">
      <div className="flex items-center justify-between">
        {/* Left side: Agent info */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          {/* Agent avatar with initials */}
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-domo-bg-elevated border border-domo-border flex items-center justify-center flex-shrink-0">
            <span className="text-xs sm:text-sm font-semibold text-domo-text-primary">{initials}</span>
          </div>
          {/* Agent name */}
          <span className="text-sm sm:text-base font-semibold text-domo-text-primary truncate max-w-[120px] sm:max-w-none">{agentName}</span>

          {/* Optional children (e.g., ModuleProgressIndicator) - hidden on very small screens */}
          <div className="hidden sm:block">
            {children}
          </div>
        </div>

        {/* Right side: Status and help */}
        <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
          {/* Connection status */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            <div className={`w-2 h-2 rounded-full ${dotClass}`} />
            <span className={`text-xs sm:text-sm font-medium ${textClass} hidden sm:inline`}>{text}</span>
          </div>

          {/* Help button */}
          <button
            onClick={onHelpClick}
            className="p-2 rounded-full hover:bg-domo-bg-elevated text-domo-text-secondary hover:text-domo-text-primary transition-colors"
            title="Help"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </button>
        </div>
      </div>
    </header>
  );
});
