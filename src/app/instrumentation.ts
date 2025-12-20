// Next.js App Router instrumentation entrypoint
// Initializes Sentry for the appropriate runtime (nodejs / edge)
// Also initializes debug logger to capture ALL console output

export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    // Initialize debug logger first (captures all console.log/warn/error)
    await import('../lib/debug-logger');
    // Then initialize Sentry
    await import('../sentry.server.config');
  } else if (process.env.NEXT_RUNTIME === 'edge') {
    await import('../sentry.edge.config');
  }
}
