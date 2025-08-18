import * as Sentry from '@sentry/nextjs';

// Initialize Sentry for Node.js runtime (Route Handlers, Server Components)
Sentry.init({
  dsn: process.env.SENTRY_DSN || undefined,
  enabled: Boolean(process.env.SENTRY_DSN),
  environment: process.env.VERCEL_ENV || process.env.NODE_ENV || 'development',
  // Tune rates per environment via env if needed
  tracesSampleRate: Number(process.env.SENTRY_TRACES_SAMPLE_RATE ?? '0.1'),
  profilesSampleRate: Number(process.env.SENTRY_PROFILES_SAMPLE_RATE ?? '0.1'),
  sendDefaultPii: false,
  debug: process.env.NODE_ENV === 'development',
});
