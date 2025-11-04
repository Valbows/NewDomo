// Conditional Sentry utilities for API routes
// This allows the app to build and run even when @sentry/nextjs is not available

import { NextRequest, NextResponse } from 'next/server';

// Conditional Sentry import
let Sentry: any = null;
try {
  // eslint-disable-next-line
  Sentry = require('@sentry/nextjs');
} catch (e) {
  // Sentry not available; will use fallback behavior
}

export function wrapRouteHandlerWithSentry<T extends any[]>(
  handler: (...args: T) => Promise<NextResponse>,
  options: {
    method: string;
    parameterizedRoute: string;
  }
): (...args: T) => Promise<NextResponse> {
  // If Sentry is available, use it to wrap the handler
  if (Sentry?.wrapRouteHandlerWithSentry) {
    return Sentry.wrapRouteHandlerWithSentry(handler, options);
  }
  
  // Otherwise, return the handler as-is (no Sentry integration)
  return handler;
}

// Export Sentry instance for direct usage (will be null if not available)
export { Sentry };
