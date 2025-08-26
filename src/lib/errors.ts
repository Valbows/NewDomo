import * as Sentry from '@sentry/nextjs';

// Centralized, typed error utilities
// Use these helpers to avoid `any` in catch blocks and ensure consistent messaging

export function getErrorMessage(error: unknown, fallback = 'An unknown error occurred'): string {
  if (typeof error === 'string') return error;
  if (error instanceof Error) return error.message;
  if (error && typeof error === 'object') {
    // Common API error shapes
    const maybeMessage = (error as any).message || (error as any).error_description || (error as any).error || (error as any).msg;
    if (typeof maybeMessage === 'string') return maybeMessage;
  }
  try {
    return JSON.stringify(error);
  } catch {
    return fallback;
  }
}

export function normalizeError(error: unknown): Error {
  return error instanceof Error ? error : new Error(getErrorMessage(error));
}

export function logError(error: unknown, context?: string) {
  const message = getErrorMessage(error);
  if (context) {
    console.error(`${context}: ${message}`, error);
  } else {
    console.error(message, error);
  }

  // Forward to Sentry in production only. This is safe even if Sentry isn't initialized.
  try {
    if (process.env.NODE_ENV === 'production') {
      Sentry.withScope((scope) => {
        if (context) scope.setContext('logError', { context });
        scope.setLevel('error');
        scope.setTag('from', 'logError');
      });
      Sentry.captureException(normalizeError(error));
    }
  } catch {
    // Never throw from logger
  }
}
