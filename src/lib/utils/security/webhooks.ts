/**
 * Webhook Security Utilities
 * Functions for webhook signature verification and security validation
 */

import crypto from 'crypto';

/**
 * Extracts a signature value from common header formats.
 * Supports:
 * - raw hex/base64 (e.g., "<hex>")
 * - prefixed (e.g., "sha256=<hex>")
 * - multi-part (e.g., "t=timestamp,v1=<hex>")
 * 
 * @param header - The signature header value
 * @returns Extracted signature or null if invalid
 */
export function extractSignature(header: string): string | null {
  if (!header) return null;
  const trimmed = header.trim();

  // Handle comma/space separated key=value pairs (e.g., Stripe style)
  if (trimmed.includes(',')) {
    const parts = trimmed.split(',').map((p) => p.trim());
    for (const part of parts) {
      const [k, v] = part.split('=');
      if (!k || !v) continue;
      if (k.toLowerCase() === 'v1' || k.toLowerCase() === 'signature') return v;
      if (k.toLowerCase() === 'sha256') return v;
    }
  }

  // Handle prefix like sha256=<sig>
  const shaIdx = trimmed.toLowerCase().indexOf('sha256=');
  if (shaIdx === 0) return trimmed.slice('sha256='.length);

  return trimmed;
}

/**
 * Verifies an HMAC-SHA256 signature using a constant-time comparison.
 * The header may be raw hex, base64, or prefixed formats handled by extractSignature.
 * 
 * @param payload - The raw payload string to verify
 * @param header - The signature header value
 * @param secret - The secret key for HMAC verification
 * @returns True if signature is valid, false otherwise
 */
export function verifyHmacSha256Signature(payload: string, header: string | null, secret: string): boolean {
  if (!payload || !header || !secret) return false;
  const rawSig = extractSignature(header);
  if (!rawSig) return false;

  const computed = crypto.createHmac('sha256', secret).update(payload, 'utf8').digest();

  // Try hex first
  try {
    const providedHexBuf = Buffer.from(rawSig, 'hex');
    if (providedHexBuf.length === computed.length && crypto.timingSafeEqual(providedHexBuf, computed)) {
      return true;
    }
  } catch (_) {
    // fall through
  }

  // Fallback: try base64
  try {
    const providedB64Buf = Buffer.from(rawSig, 'base64');
    if (providedB64Buf.length === computed.length && crypto.timingSafeEqual(providedB64Buf, computed)) {
      return true;
    }
  } catch (_) {
    // fall through
  }

  return false;
}

/**
 * Generate HMAC-SHA256 signature for testing purposes
 * 
 * @param payload - The payload to sign
 * @param secret - The secret key
 * @param format - Output format ('hex' or 'base64')
 * @returns Generated signature
 */
export function generateHmacSha256Signature(
  payload: string, 
  secret: string, 
  format: 'hex' | 'base64' = 'hex'
): string {
  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(payload, 'utf8');
  return hmac.digest(format);
}

/**
 * Validate webhook timestamp to prevent replay attacks
 * 
 * @param timestamp - The timestamp from webhook headers
 * @param toleranceSeconds - Maximum age in seconds (default: 300 = 5 minutes)
 * @returns True if timestamp is within tolerance, false otherwise
 */
export function validateWebhookTimestamp(timestamp: string | number, toleranceSeconds: number = 300): boolean {
  const now = Math.floor(Date.now() / 1000);
  const webhookTime = typeof timestamp === 'string' ? parseInt(timestamp, 10) : timestamp;
  
  if (isNaN(webhookTime)) return false;
  
  const timeDiff = Math.abs(now - webhookTime);
  return timeDiff <= toleranceSeconds;
}