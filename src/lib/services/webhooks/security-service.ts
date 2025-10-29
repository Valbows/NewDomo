/**
 * Webhook Security Service
 * Business logic for webhook authentication and security validation
 */

import { IWebhookSecurityService, WebhookSecurityConfig } from './types';
import { verifyHmacSha256Signature } from '../../security/webhooks';

export class WebhookSecurityService implements IWebhookSecurityService {
  /**
   * Verify HMAC signature using the security module
   */
  verifySignature(
    payload: string,
    signature: string | null,
    secret: string
  ): boolean {
    if (!payload || !signature || !secret) {
      return false;
    }

    try {
      return verifyHmacSha256Signature(payload, signature, secret);
    } catch (error) {
      console.error('Error verifying webhook signature:', error);
      return false;
    }
  }

  /**
   * Verify webhook token parameter
   */
  verifyToken(
    tokenParam: string | null,
    tokenEnv: string | undefined
  ): boolean {
    if (!tokenEnv || !tokenParam) {
      return false;
    }

    try {
      return tokenParam.trim() === tokenEnv.trim();
    } catch (error) {
      console.error('Error verifying webhook token:', error);
      return false;
    }
  }

  /**
   * Extract signature from various header formats
   */
  extractSignature(header: string | null): string | null {
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
   * Validate webhook security configuration
   */
  validateConfig(config: WebhookSecurityConfig): boolean {
    // At least one authentication method must be available
    const hasSignature = config.requireSignature && !!config.secret;
    const hasToken = config.requireToken && !!config.token;
    
    return hasSignature || hasToken;
  }

  /**
   * Get webhook security configuration from environment
   */
  getSecurityConfig(): WebhookSecurityConfig {
    return {
      secret: process.env.TAVUS_WEBHOOK_SECRET,
      token: process.env.TAVUS_WEBHOOK_TOKEN,
      requireSignature: !!process.env.TAVUS_WEBHOOK_SECRET,
      requireToken: !!process.env.TAVUS_WEBHOOK_TOKEN,
    };
  }

  /**
   * Verify webhook using multiple authentication methods
   */
  verifyWebhookAuthentication(
    rawBody: string,
    signature: string | null,
    tokenParam: string | null
  ): {
    isValid: boolean;
    method: 'signature' | 'token' | 'none';
    error?: string;
  } {
    const config = this.getSecurityConfig();

    // Try signature verification first (preferred method)
    if (config.secret && signature) {
      const signatureValid = this.verifySignature(rawBody, signature, config.secret);
      if (signatureValid) {
        return {
          isValid: true,
          method: 'signature',
        };
      }
    }

    // Fallback to token verification
    if (config.token && tokenParam) {
      const tokenValid = this.verifyToken(tokenParam, config.token);
      if (tokenValid) {
        return {
          isValid: true,
          method: 'token',
        };
      }
    }

    // No valid authentication method found
    return {
      isValid: false,
      method: 'none',
      error: 'No valid authentication method found',
    };
  }
}

/**
 * Create a new webhook security service instance
 */
export function createWebhookSecurityService(): WebhookSecurityService {
  return new WebhookSecurityService();
}