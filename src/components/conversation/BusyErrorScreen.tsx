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
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center px-6">
          <div className="text-6xl mb-4">🙏</div>
          <div className="text-white text-xl font-semibold mb-2">
            Demo is Currently Busy
          </div>
          <div className="text-gray-400 mb-6">
            We're chatting with other customers right now.
            <br />
            Please try again in a few minutes.
          </div>
          <button
            onClick={onRetry || (() => window.location.reload())}
            className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center">
      <div className="text-center px-6">
        <div className="text-red-400 text-lg mb-4">{error}</div>
        {onBack && (
          <button
            onClick={onBack}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
          >
            {backLabel}
          </button>
        )}
      </div>
    </div>
  );
}
