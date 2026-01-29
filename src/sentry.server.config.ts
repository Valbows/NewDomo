import * as Sentry from '@sentry/nextjs';

const dsn = process.env.SENTRY_DSN;

// Initialize Sentry for Node.js runtime (Route Handlers, Server Components)
Sentry.init({
  dsn: dsn || undefined,
  enabled: Boolean(dsn),
  environment: process.env.VERCEL_ENV || process.env.NODE_ENV || 'development',

  // Performance Monitoring
  tracesSampleRate: Number(process.env.SENTRY_TRACES_SAMPLE_RATE ?? '0.1'),

  // Profiling (requires Sentry profiling plan)
  profilesSampleRate: Number(process.env.SENTRY_PROFILES_SAMPLE_RATE ?? '0.1'),

  // Filter out common non-actionable errors
  ignoreErrors: [
    // Database connection timeouts (usually transient)
    'Connection terminated unexpectedly',
    // Rate limiting from external APIs
    'Too Many Requests',
    '429',
  ],

  // Don't send PII
  sendDefaultPii: false,

  // Debug mode in development
  debug: process.env.NODE_ENV === 'development',

  // Add context to errors
  beforeSend(event, hint) {
    // Tag API route errors
    if (event.request?.url?.includes('/api/')) {
      event.tags = {
        ...event.tags,
        errorSource: 'api',
      };
    }
    return event;
  },
});
