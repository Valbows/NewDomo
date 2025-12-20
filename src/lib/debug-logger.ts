/**
 * Debug Logger - writes logs to debug.log file
 *
 * Usage:
 *   import { debugLog } from '@/lib/debug-logger';
 *   debugLog('info', 'Component mounted', { userId: '123' });
 *
 * Enable by setting DEBUG_LOG=true in .env.development
 * Logs are written to /debug.log in the project root
 */

import fs from 'fs';
import path from 'path';

const DEBUG_ENABLED = process.env.DEBUG_LOG === 'true';
const LOG_FILE = path.join(process.cwd(), 'debug.log');

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const LEVEL_EMOJI: Record<LogLevel, string> = {
  debug: '🔍',
  info: 'ℹ️',
  warn: '⚠️',
  error: '❌',
};

/**
 * Server-side debug logger - writes to debug.log file
 * Only active when DEBUG_LOG=true
 */
export function debugLog(level: LogLevel, message: string, data?: any): void {
  // Always log to console in development
  const consoleMethod = level === 'error' ? console.error : level === 'warn' ? console.warn : console.log;

  if (process.env.NODE_ENV === 'development') {
    if (data) {
      consoleMethod(`${LEVEL_EMOJI[level]} [${level.toUpperCase()}] ${message}`, data);
    } else {
      consoleMethod(`${LEVEL_EMOJI[level]} [${level.toUpperCase()}] ${message}`);
    }
  }

  // Write to file if DEBUG_LOG is enabled
  if (DEBUG_ENABLED) {
    try {
      const timestamp = new Date().toISOString();
      const dataStr = data ? ` | ${JSON.stringify(data)}` : '';
      const logLine = `[${timestamp}] [${level.toUpperCase()}] ${message}${dataStr}\n`;

      fs.appendFileSync(LOG_FILE, logLine);
    } catch (err) {
      // Silently fail - don't break the app for logging
    }
  }
}

/**
 * Clear the debug log file
 */
export function clearDebugLog(): void {
  if (DEBUG_ENABLED) {
    try {
      fs.writeFileSync(LOG_FILE, `--- Debug log cleared at ${new Date().toISOString()} ---\n`);
    } catch (err) {
      // Silently fail
    }
  }
}

/**
 * Convenience methods
 */
export const logger = {
  debug: (message: string, data?: any) => debugLog('debug', message, data),
  info: (message: string, data?: any) => debugLog('info', message, data),
  warn: (message: string, data?: any) => debugLog('warn', message, data),
  error: (message: string, data?: any) => debugLog('error', message, data),
  clear: clearDebugLog,
};

export default logger;
