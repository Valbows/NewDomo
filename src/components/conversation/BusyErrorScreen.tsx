'use client';

interface BusyErrorScreenProps {
  error: string;
  onRetry?: () => void;
  onBack?: () => void;
  backLabel?: string;
}

/**
 * Shared error screen for conversation pages.
 * Shows a friendly "busy" message for capacity errors,
 * or a generic error message for other errors.
 */
export function BusyErrorScreen({
  error,
  onRetry,
  onBack,
  backLabel = 'Go Back',
}: BusyErrorScreenProps) {
  const isBusyError =
    error.toLowerCase().includes('failed to start') ||
    error.toLowerCase().includes('tavus') ||
    error.toLowerCase().includes('limit') ||
    error.toLowerCase().includes('capacity');

  if (isBusyError) {
    return (
      <div className="min-h-screen bg-domo-bg-dark flex items-center justify-center">
        <div className="text-center px-6">
          <div className="text-6xl mb-4">🙏</div>
          <div className="text-white text-xl font-semibold mb-2">
            Demo is Currently Busy
          </div>
          <div className="text-domo-text-secondary mb-6">
            We're chatting with other customers right now.
            <br />
            Please try again in a few minutes.
          </div>
          <button
            onClick={onRetry || (() => window.location.reload())}
            className="px-6 py-3 bg-domo-primary hover:bg-domo-secondary text-white font-semibold rounded-lg transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-domo-bg-dark flex items-center justify-center">
      <div className="text-center px-6">
        <div className="text-domo-error text-lg mb-4">{error}</div>
        {onBack && (
          <button
            onClick={onBack}
            className="px-4 py-2 bg-domo-bg-elevated hover:bg-domo-bg-elevated/80 text-white rounded-lg transition-colors border border-domo-border"
          >
            {backLabel}
          </button>
        )}
      </div>
    </div>
  );
}
