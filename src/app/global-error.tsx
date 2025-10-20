'use client';

import * as React from 'react';

// Conditional Sentry import - fallback gracefully if not available
let Sentry: any = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  Sentry = require('@sentry/nextjs');
} catch (e) {
  // Sentry not available; will fallback to simple error handling
}

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  // Optional extra logging
  React.useEffect(() => {
    // This will be picked up by Sentry via the ErrorBoundary as well
    // but we keep it here as a fallback
    // eslint-disable-next-line no-console
    console.error('GlobalError captured:', error);
  }, [error]);

  // Fallback component if Sentry is not available
  const ErrorFallback = ({ children }: { children: React.ReactNode }) => {
    if (Sentry?.ErrorBoundary) {
      return <Sentry.ErrorBoundary fallback={<p>Something went wrong.</p>}>{children}</Sentry.ErrorBoundary>;
    }
    return <>{children}</>;
  };

  return (
    <html>
      <body>
        <ErrorFallback>
          <div style={{ padding: 24 }}>
            <h2 style={{ fontWeight: 600, marginBottom: 12 }}>Something went wrong</h2>
            <button
              onClick={() => reset()}
              style={{
                padding: '8px 12px',
                background: '#111827',
                color: '#fff',
                borderRadius: 6,
              }}
            >
              Try again
            </button>
          </div>
        </ErrorFallback>
      </body>
    </html>
  );
}
