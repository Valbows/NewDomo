/**
 * Debug Logger - writes logs to debug.log file
 *
 * Usage:
 *   import { debugLog } from '@/lib/debug-logger';
 *   debugLog('info', 'Component mounted', { userId: '123' });
 *
 * Enable by setting DEBUG_LOG=true in .env.development
 * Logs are written to /debug.log in the project root
 *
 * GLOBAL CONSOLE OVERRIDE:
 *   Import this file once in your app (e.g., in instrumentation.ts or layout.tsx)
 *   to automatically capture ALL console.log/warn/error calls to debug.log
 */

import fs from 'fs';
import path from 'path';

const DEBUG_ENABLED = process.env.DEBUG_LOG === 'true';
const LOG_FILE = path.join(process.cwd(), 'debug.log');

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

/**
 * Write a log line to the debug.log file
 */
function writeToFile(level: string, args: any[]): void {
  if (!DEBUG_ENABLED) return;

  try {
    const timestamp = new Date().toISOString();
    const message = args
      .map((arg) => {
        if (typeof arg === 'string') return arg;
        try {
          return JSON.stringify(arg);
        } catch {
          return String(arg);
        }
      })
      .join(' ');

    const logLine = `[${timestamp}] [${level.toUpperCase()}] ${message}\n`;
    fs.appendFileSync(LOG_FILE, logLine);
  } catch (err) {
    // Silently fail - don't break the app for logging
  }
}

/**
 * Server-side debug logger - writes to debug.log file
 * Only active when DEBUG_LOG=true
 */
export function debugLog(level: LogLevel, message: string, data?: any): void {
  // Write to file if DEBUG_LOG is enabled
  if (data) {
    writeToFile(level, [message, data]);
  } else {
    writeToFile(level, [message]);
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

/**
 * GLOBAL CONSOLE OVERRIDE
 * This intercepts ALL console.log/warn/error calls and writes them to debug.log
 * while still outputting to the original console
 */
if (DEBUG_ENABLED && typeof global !== 'undefined') {
  const originalConsole = {
    log: console.log.bind(console),
    warn: console.warn.bind(console),
    error: console.error.bind(console),
    debug: console.debug.bind(console),
    info: console.info.bind(console),
  };

  console.log = (...args: any[]) => {
    originalConsole.log(...args);
    writeToFile('LOG', args);
  };

  console.warn = (...args: any[]) => {
    originalConsole.warn(...args);
    writeToFile('WARN', args);
  };

  console.error = (...args: any[]) => {
    originalConsole.error(...args);
    writeToFile('ERROR', args);
  };

  console.debug = (...args: any[]) => {
    originalConsole.debug(...args);
    writeToFile('DEBUG', args);
  };

  console.info = (...args: any[]) => {
    originalConsole.info(...args);
    writeToFile('INFO', args);
  };

  // Log that we've initialized
  writeToFile('INFO', ['🚀 Debug logger initialized - all console output will be captured to debug.log']);
}

export default logger;
