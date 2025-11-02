interface StatusIndicatorsProps {
  loading: boolean;
  error: string | null;
  alert: { type: 'error' | 'info' | 'success'; message: string } | null;
  onDismissAlert: () => void;
}

export function StatusIndicators({
  loading,
  error,
  alert,
  onDismissAlert,
}: StatusIndicatorsProps) {
  return (
    <>
      {/* Alert banner */}
      {alert && (
        <div className="absolute top-4 right-4 z-50">
          <div className={`px-3 py-2 rounded shadow text-sm ${
            alert.type === 'error' ? 'bg-red-600 text-white' : 'bg-gray-800 text-white'
          }`}>
            <div className="flex items-center gap-2">
              <span>{alert.message}</span>
              <button
                aria-label="Dismiss alert"
                className="opacity-80 hover:opacity-100"
                onClick={onDismissAlert}
              >
                ✕
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Non-blocking loading banner */}
      {loading && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 bg-white/90 text-gray-700 px-3 py-1 rounded shadow text-sm">
          Loading demo...
        </div>
      )}
      
      {/* Non-blocking error banner */}
      {error && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 bg-red-600 text-white px-3 py-1 rounded shadow text-sm">
          {error}
        </div>
      )}
    </>
  );
}