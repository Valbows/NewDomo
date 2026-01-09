/**
 * Client-side Debug Logger
 *
 * Usage in React components:
 *   import { clientLogger } from '@/lib/client-logger';
 *   clientLogger.info('Button clicked', { buttonId: 'submit' });
 *
 * This sends logs to /api/debug-log which writes to debug.log file
 * Only active in development mode
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const IS_DEV = process.env.NODE_ENV === 'development';

async function sendLog(level: LogLevel, message: string, data?: any, source?: string): Promise<void> {
  // Only log to browser console in development mode
  if (IS_DEV) {
    const consoleMethod = level === 'error' ? console.error : level === 'warn' ? console.warn : console.log;
    const prefix = source ? `[${source}]` : '';

    if (data) {
      consoleMethod(`${prefix} ${message}`, data);
    } else {
      consoleMethod(`${prefix} ${message}`);
    }
  }

  // Send to server to write to debug.log (only in dev)
  if (IS_DEV) {
    try {
      await fetch('/api/debug-log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ level, message, data, source }),
      });
    } catch {
      // Silently fail - don't break the app for logging
    }
  }
}

/**
 * Create a logger with a source name for easier identification
 */
export function createClientLogger(source: string) {
  return {
    debug: (message: string, data?: any) => sendLog('debug', message, data, source),
    info: (message: string, data?: any) => sendLog('info', message, data, source),
    warn: (message: string, data?: any) => sendLog('warn', message, data, source),
    error: (message: string, data?: any) => sendLog('error', message, data, source),
  };
}

/**
 * Default client logger (no source prefix)
 */
export const clientLogger = {
  debug: (message: string, data?: any) => sendLog('debug', message, data),
  info: (message: string, data?: any) => sendLog('info', message, data),
  warn: (message: string, data?: any) => sendLog('warn', message, data),
  error: (message: string, data?: any) => sendLog('error', message, data),
};

export default clientLogger;
