import * as Sentry from '@sentry/nextjs';

const dsn = process.env.SENTRY_DSN;

// Initialize Sentry for Edge runtime (Edge Route Handlers)
Sentry.init({
  dsn: dsn || undefined,
  enabled: Boolean(dsn),
  environment: process.env.VERCEL_ENV || process.env.NODE_ENV || 'development',

  // Performance Monitoring
  tracesSampleRate: Number(process.env.SENTRY_TRACES_SAMPLE_RATE ?? '0.1'),

  // Don't send PII
  sendDefaultPii: false,

  // Tag edge runtime errors
  beforeSend(event) {
    event.tags = {
      ...event.tags,
      runtime: 'edge',
    };
    return event;
  },
});
