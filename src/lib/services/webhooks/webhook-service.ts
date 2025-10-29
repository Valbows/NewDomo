/**
 * Main Webhook Service
 * Consolidated webhook processing service that orchestrates all webhook functionality
 */

import { 
  WebhookEventData, 
  WebhookProcessingResult, 
  WebhookVerificationResult,
  WebhookSecurityConfig,
  WebhookServiceResult 
} from './types';
import { WebhookSecurityService } from './security-service';
import { WebhookEventProcessingService } from './event-processing-service';
import { WebhookToolCallService } from './tool-call-service';
import { WebhookDataIngestionService } from './data-ingestion-service';
import { WebhookValidationService } from './validation-service';

export class WebhookProcessingService {
  private securityService: WebhookSecurityService;
  private eventProcessingService: WebhookEventProcessingService;
  private toolCallService: WebhookToolCallService;
  private dataIngestionService: WebhookDataIngestionService;
  private validationService: WebhookValidationService;

  constructor() {
    this.securityService = new WebhookSecurityService();
    this.eventProcessingService = new WebhookEventProcessingService();
    this.toolCallService = new WebhookToolCallService();
    this.dataIngestionService = new WebhookDataIngestionService();
    this.validationService = new WebhookValidationService();
  }

  /**
   * Process complete webhook request
   */
  async processWebhookRequest(
    rawBody: string,
    headers: Record<string, string | null>,
    urlParams: URLSearchParams
  ): Promise<WebhookServiceResult<WebhookProcessingResult>> {
    try {
      // Parse event from raw body
      let event: WebhookEventData;
      try {
        event = JSON.parse(rawBody);
      } catch (error) {
        return {
          success: false,
          error: 'Invalid JSON payload',
        };
      }

      // Validate webhook
      const validation = this.validationService.validateWebhook(rawBody, headers, event);
      if (!validation.isValid) {
        console.error('Webhook validation failed:', validation.errors);
        return {
          success: false,
          error: `Validation failed: ${validation.errors.join(', ')}`,
        };
      }

      // Log warnings if any
      if (validation.warnings.length > 0) {
        console.warn('Webhook validation warnings:', validation.warnings);
      }

      // Verify webhook authenticity
      const signature = 
        headers['x-tavus-signature'] ||
        headers['tavus-signature'] ||
        headers['x-signature'];
      const tokenParam = urlParams.get('t') || urlParams.get('token');

      const config = this.securityService.getSecurityConfig();
      const verificationResult = await this.eventProcessingService.verifyWebhook(
        rawBody,
        signature,
        tokenParam,
        config
      );

      if (!verificationResult.isValid) {
        return {
          success: false,
          error: 'Webhook authentication failed',
        };
      }

      console.log(`Webhook authenticated via ${verificationResult.method}`);

      // Check idempotency for tool-call events
      const idempotencyResult = await this.eventProcessingService.checkIdempotency(
        event,
        rawBody,
        // Note: supabase client should be passed from the handler
        null
      );

      if (idempotencyResult.isDuplicate) {
        return {
          success: true,
          data: {
            success: true,
            processed: false,
            error: 'Duplicate event (idempotency)',
          },
        };
      }

      // Process the event
      const processingResult = await this.eventProcessingService.processEvent(
        event,
        // Note: supabase client should be passed from the handler
        null
      );

      return {
        success: true,
        data: processingResult,
      };
    } catch (error) {
      console.error('Error processing webhook request:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown webhook processing error',
      };
    }
  }

  /**
   * Verify webhook signature
   */
  verifyWebhookSignature(
    rawBody: string,
    signature: string | null,
    secret: string
  ): boolean {
    return this.securityService.verifySignature(rawBody, signature, secret);
  }

  /**
   * Verify webhook token
   */
  verifyWebhookToken(
    tokenParam: string | null,
    tokenEnv: string | undefined
  ): boolean {
    return this.securityService.verifyToken(tokenParam, tokenEnv);
  }

  /**
   * Parse tool call from event
   */
  parseToolCallFromEvent(event: WebhookEventData): {
    toolName: string | null;
    toolArgs: any;
  } {
    return this.toolCallService.parseToolCall(event);
  }

  /**
   * Process webhook event (legacy interface for backward compatibility)
   */
  async processWebhookEvent(
    event: WebhookEventData,
    supabase: any
  ): Promise<WebhookServiceResult<void>> {
    try {
      const result = await this.eventProcessingService.processEvent(event, supabase);
      
      if (result.success && result.processed) {
        // Ingest event data for analytics
        await this.dataIngestionService.processDataIngestion(
          event,
          event.conversation_id || '',
          supabase
        );
      }

      return {
        success: result.success,
        error: result.error,
      };
    } catch (error) {
      console.error('Error processing webhook event:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown event processing error',
      };
    }
  }

  /**
   * Get webhook URL status
   */
  getWebhookUrlStatus(): {
    webhookUrl: string;
    isNgrok: boolean;
    isLocalhost: boolean;
    isProduction: boolean;
    warning?: string;
  } {
    const webhookUrl = this.getWebhookUrl();
    const isNgrok = webhookUrl.includes('ngrok');
    const isLocalhost = webhookUrl.includes('localhost');
    
    return {
      webhookUrl,
      isNgrok,
      isLocalhost,
      isProduction: !isNgrok && !isLocalhost,
      warning: isNgrok ? 'Using ngrok URL - remember to update when ngrok restarts' : undefined,
    };
  }

  /**
   * Get webhook URL
   */
  getWebhookUrl(): string {
    const baseUrl = (process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000').replace(/\/$/, '');
    const urlToken = (process.env.TAVUS_WEBHOOK_TOKEN || '').trim();
    return `${baseUrl}/api/tavus-webhook${urlToken ? `?t=${encodeURIComponent(urlToken)}` : ''}`;
  }

  /**
   * Validate webhook URL accessibility
   */
  async validateWebhookUrl(url?: string): Promise<boolean> {
    const webhookUrl = url || this.getWebhookUrl();
    
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      const response = await fetch(webhookUrl.replace('?t=', '?test=true&t='), {
        method: 'HEAD',
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      return response.status === 200 || response.status === 405; // 405 is OK (method not allowed for HEAD)
    } catch (error) {
      console.warn(`⚠️ Webhook URL validation failed: ${error}`);
      return false;
    }
  }

  /**
   * Access to individual services for advanced use cases
   */
  get services() {
    return {
      security: this.securityService,
      eventProcessing: this.eventProcessingService,
      toolCall: this.toolCallService,
      dataIngestion: this.dataIngestionService,
      validation: this.validationService,
    };
  }
}

/**
 * Create a new webhook processing service instance
 */
export function createWebhookProcessingService(): WebhookProcessingService {
  return new WebhookProcessingService();
}

/**
 * Default webhook processing service instance (singleton)
 */
let defaultWebhookProcessingService: WebhookProcessingService | null = null;

export function getWebhookProcessingService(): WebhookProcessingService {
  if (!defaultWebhookProcessingService) {
    defaultWebhookProcessingService = createWebhookProcessingService();
  }
  return defaultWebhookProcessingService;
}