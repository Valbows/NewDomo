// Analytics sanitization utilities for Tavus webhook ingestion
// Extracted from /src/app/api/tavus-webhook/route.ts for reusability and unit testing.

export function sanitizeAnalyticsPayload(input: any): any {
  const PRUNE_KEYS = new Set([
    'transcript',
    'utterances',
    'messages',
    'raw',
    'audio',
    'media',
    'video',
    'frames',
  ]);
  const REDACT_KEYS = ['email', 'phone', 'name', 'user', 'speaker'];
  const emailRegex = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi;
  const phoneRegex = /(?:\+\d{1,3}[-.\s]?)?(?:\(\d{2,4}\)|\d{2,4})[-.\s]?\d{3,4}[-.\s]?\d{3,4}/g;

  function walk(val: any): any {
    if (val == null) return val;
    if (typeof val === 'string') {
      return val.replace(emailRegex, '[REDACTED_EMAIL]').replace(phoneRegex, '[REDACTED_PHONE]');
    }
    if (Array.isArray(val)) {
      return val.slice(0, 50).map(walk); // cap arrays to avoid huge payloads
    }
    if (typeof val === 'object') {
      const out: Record<string, any> = {};
      const keys = Object.keys(val).slice(0, 100); // cap object keys
      for (const k of keys) {
        if (PRUNE_KEYS.has(k)) {
          out[k] = '[REDACTED]';
          continue;
        }
        if (REDACT_KEYS.some((rk) => k.toLowerCase().includes(rk))) {
          out[k] = '[REDACTED]';
          continue;
        }
        out[k] = walk((val as any)[k]);
      }
      return out;
    }
    return val;
  }

  return walk(input);
}
