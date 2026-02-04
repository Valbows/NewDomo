import * as Sentry from '@sentry/nextjs';

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN || process.env.SENTRY_DSN;

// Initialize Sentry for Client runtime (browser)
Sentry.init({
  dsn: dsn || undefined,
  enabled: Boolean(dsn),
  environment: process.env.VERCEL_ENV || process.env.NODE_ENV || 'development',

  // Performance Monitoring
  tracesSampleRate: Number(process.env.SENTRY_TRACES_SAMPLE_RATE ?? '0.1'),

  // Session Replay - capture user sessions for debugging
  replaysSessionSampleRate: 0.1, // 10% of sessions
  replaysOnErrorSampleRate: 1.0, // 100% of sessions with errors

  // Integrations
  integrations: [
    Sentry.replayIntegration({
      // Mask all text content for privacy
      maskAllText: false,
      // Block all media for privacy
      blockAllMedia: false,
    }),
    Sentry.browserTracingIntegration(),
  ],

  // Filter out noisy errors
  ignoreErrors: [
    // Browser extensions
    /^chrome-extension:\/\//,
    /^moz-extension:\/\//,
    // Common benign errors
    'ResizeObserver loop limit exceeded',
    'ResizeObserver loop completed with undelivered notifications',
    // Network errors users can't control
    'Network request failed',
    'Failed to fetch',
    'Load failed',
    // User aborted
    'AbortError',
    'The operation was aborted',
  ],

  // Don't send PII by default
  sendDefaultPii: false,

  // Add context to errors
  beforeSend(event, hint) {
    // Add extra context for debugging
    if (event.exception) {
      event.tags = {
        ...event.tags,
        errorType: hint.originalException instanceof Error
          ? hint.originalException.constructor.name
          : 'Unknown',
      };
    }
    return event;
  },
});
