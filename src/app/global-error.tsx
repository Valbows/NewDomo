'use client';

import * as React from 'react';
import * as Sentry from '@sentry/nextjs';

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

  return (
    <html>
      <body>
        <Sentry.ErrorBoundary fallback={<p>Something went wrong.</p>}>
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
        </Sentry.ErrorBoundary>
      </body>
    </html>
  );
}
