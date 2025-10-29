/**
 * Webhook Service Types
 * Type definitions for webhook processing and management
 */

export interface WebhookEventData {
  event_type?: string;
  type?: string;
  conversation_id?: string;
  id?: string;
  event_id?: string;
  data?: {
    event_type?: string;
    type?: string;
    id?: string;
    event_id?: string;
    name?: string;
    args?: any;
    arguments?: any;
    function?: {
      name?: string;
      arguments?: any;
    };
    properties?: {
      name?: string;
      args?: any;
      arguments?: any;
      function?: {
        name?: string;
        arguments?: any;
      };
      speech?: string;
    };
    speech?: string;
    transcript?: Array<{
      role: string;
      tool_calls?: Array<{
        function?: {
          name?: string;
          arguments?: string;
        };
      }>;
    }>;
  };
  name?: string;
  args?: any;
  arguments?: any;
  function?: {
    name?: string;
    arguments?: any;
  };
  properties?: {
    name?: string;
    args?: any;
    arguments?: any;
    function?: {
      name?: string;
      arguments?: any;
    };
    speech?: string;
  };
  speech?: string;
}

export interface WebhookVerificationResult {
  isValid: boolean;
  method: 'signature' | 'token' | 'none';
  error?: string;
}

export interface WebhookProcessingResult {
  success: boolean;
  processed: boolean;
  toolCall?: {
    name: string;
    args: any;
  };
  error?: string;
  data?: any;
}

export interface IdempotencyResult {
  isDuplicate: boolean;
  eventId: string;
  error?: string;
}

export interface WebhookSecurityConfig {
  secret?: string;
  token?: string;
  requireSignature: boolean;
  requireToken: boolean;
}

export interface WebhookEventIngestionResult {
  success: boolean;
  stored: boolean;
  broadcasted: boolean;
  error?: string;
}

export interface WebhookServiceResult<T = void> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Webhook service interface for processing webhook events
 */
export interface IWebhookProcessingService {
  /**
   * Verify webhook authenticity using signature or token
   */
  verifyWebhook(
    rawBody: string,
    signature: string | null,
    token: string | null,
    config: WebhookSecurityConfig
  ): Promise<WebhookVerificationResult>;

  /**
   * Check for duplicate events using idempotency
   */
  checkIdempotency(
    event: WebhookEventData,
    rawBody: string,
    supabase: any
  ): Promise<IdempotencyResult>;

  /**
   * Process webhook event and extract tool calls
   */
  processEvent(
    event: WebhookEventData,
    supabase: any
  ): Promise<WebhookProcessingResult>;

  /**
   * Ingest event data for analytics and storage
   */
  ingestEventData(
    event: WebhookEventData,
    conversationId: string,
    supabase: any
  ): Promise<WebhookEventIngestionResult>;
}

/**
 * Webhook security service interface
 */
export interface IWebhookSecurityService {
  /**
   * Verify HMAC signature
   */
  verifySignature(
    payload: string,
    signature: string | null,
    secret: string
  ): boolean;

  /**
   * Verify webhook token
   */
  verifyToken(
    tokenParam: string | null,
    tokenEnv: string | undefined
  ): boolean;

  /**
   * Extract signature from header
   */
  extractSignature(header: string | null): string | null;

  /**
   * Validate webhook configuration
   */
  validateConfig(config: WebhookSecurityConfig): boolean;
}

/**
 * Webhook tool call service interface
 */
export interface IWebhookToolCallService {
  /**
   * Parse tool call from webhook event
   */
  parseToolCall(event: WebhookEventData): {
    toolName: string | null;
    toolArgs: any;
  };

  /**
   * Validate tool call arguments
   */
  validateToolCall(
    toolName: string,
    toolArgs: any
  ): {
    isValid: boolean;
    error?: string;
  };

  /**
   * Process tool call execution
   */
  executeToolCall(
    toolName: string,
    toolArgs: any,
    conversationId: string,
    supabase: any
  ): Promise<WebhookServiceResult<any>>;
}

/**
 * Webhook data ingestion service interface
 */
export interface IWebhookDataIngestionService {
  /**
   * Store webhook event data
   */
  storeEventData(
    event: WebhookEventData,
    conversationId: string,
    supabase: any
  ): Promise<WebhookServiceResult<void>>;

  /**
   * Store detailed conversation data
   */
  storeConversationData(
    event: WebhookEventData,
    conversationId: string,
    supabase: any
  ): Promise<WebhookServiceResult<void>>;

  /**
   * Broadcast real-time updates
   */
  broadcastUpdate(
    event: WebhookEventData,
    conversationId: string,
    supabase: any
  ): Promise<WebhookServiceResult<void>>;

  /**
   * Track CTA click events
   */
  trackCTAClick(
    clickData: {
      conversationId: string;
      demoId: string;
      ctaUrl?: string;
      userAgent: string;
      ipAddress: string;
      timestamp: string;
    },
    supabase: any
  ): Promise<WebhookServiceResult<void>>;

  /**
   * Check if event should be ingested
   */
  shouldIngestEvent(event: WebhookEventData): boolean;
}