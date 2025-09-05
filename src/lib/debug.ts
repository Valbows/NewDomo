// Lightweight debug helpers for client-side auth flow tracing.
// Logs in development by default, or when NEXT_PUBLIC_DEBUG_AUTH is 'true'.

export function debugAuth(...args: unknown[]) {
  try {
    // process.env.NODE_ENV is statically replaced by Next.js at build time
    // NEXT_PUBLIC_DEBUG_AUTH is available client-side when defined
    const shouldLog = process.env.NODE_ENV !== 'production' || process.env.NEXT_PUBLIC_DEBUG_AUTH === 'true';
    if (shouldLog && typeof console !== 'undefined' && typeof console.debug === 'function') {
      console.debug('[auth]', ...args);
    }
  } catch {
    // Never throw from logger
  }
}
