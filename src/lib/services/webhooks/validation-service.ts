/**
 * Webhook Validation Service
 * Business logic for validating webhook events and payloads
 */

import { WebhookEventData } from './types';

export interface WebhookValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export class WebhookValidationService {
  /**
   * Validate webhook event structure and content
   */
  validateWebhookEvent(event: WebhookEventData): WebhookValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check basic event structure
    if (!event) {
      errors.push('Event is null or undefined');
      return { isValid: false, errors, warnings };
    }

    // Validate event type
    const eventType = this.extractEventType(event);
    if (!eventType) {
      warnings.push('No event type found in event');
    }

    // Validate conversation ID for events that require it
    const conversationId = event.conversation_id;
    if (this.requiresConversationId(eventType) && !conversationId) {
      errors.push('Conversation ID is required for this event type');
    }

    // Validate tool call events
    if (this.isToolCallEvent(eventType)) {
      const toolValidation = this.validateToolCallEvent(event);
      errors.push(...toolValidation.errors);
      warnings.push(...toolValidation.warnings);
    }

    // Validate objective completion events
    if (this.isObjectiveCompletionEvent(eventType)) {
      const objectiveValidation = this.validateObjectiveCompletionEvent(event);
      errors.push(...objectiveValidation.errors);
      warnings.push(...objectiveValidation.warnings);
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Validate tool call event structure
   */
  private validateToolCallEvent(event: WebhookEventData): WebhookValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check for tool call data
    const hasToolName = !!(
      event.data?.name ||
      event.data?.function?.name ||
      event.name ||
      event.function?.name
    );

    if (!hasToolName) {
      warnings.push('Tool call event missing tool name');
    }

    // Check for arguments
    const hasArgs = !!(
      event.data?.args ||
      event.data?.arguments ||
      event.data?.function?.arguments ||
      event.args ||
      event.arguments ||
      event.function?.arguments
    );

    if (!hasArgs) {
      warnings.push('Tool call event missing arguments');
    }

    return { isValid: errors.length === 0, errors, warnings };
  }

  /**
   * Validate objective completion event structure
   */
  private validateObjectiveCompletionEvent(event: WebhookEventData): WebhookValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check for objective data
    const hasObjectiveData = !!(
      (event.data as any)?.objective_id ||
      (event.data as any)?.objective_name ||
      (event as any).objective_id ||
      (event as any).objective_name
    );

    if (!hasObjectiveData) {
      warnings.push('Objective completion event missing objective data');
    }

    return { isValid: errors.length === 0, errors, warnings };
  }

  /**
   * Validate webhook payload size and structure
   */
  validatePayloadSize(rawBody: string): WebhookValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check payload size (max 1MB)
    const maxSize = 1024 * 1024; // 1MB
    if (rawBody.length > maxSize) {
      errors.push(`Payload too large: ${rawBody.length} bytes (max: ${maxSize})`);
    }

    // Check if payload is valid JSON
    try {
      JSON.parse(rawBody);
    } catch (error) {
      errors.push('Invalid JSON payload');
    }

    // Warn about very large payloads
    const warningSize = 100 * 1024; // 100KB
    if (rawBody.length > warningSize) {
      warnings.push(`Large payload detected: ${rawBody.length} bytes`);
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Validate webhook headers
   */
  validateHeaders(headers: Record<string, string | null>): WebhookValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check for required headers
    const contentType = headers['content-type'];
    if (!contentType) {
      warnings.push('Missing Content-Type header');
    } else if (!contentType.includes('application/json')) {
      warnings.push('Content-Type is not application/json');
    }

    // Check for signature headers
    const signature = 
      headers['x-tavus-signature'] ||
      headers['tavus-signature'] ||
      headers['x-signature'];
    
    if (!signature) {
      warnings.push('No signature header found');
    }

    // Check user agent
    const userAgent = headers['user-agent'];
    if (!userAgent) {
      warnings.push('Missing User-Agent header');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Extract event type from various possible locations
   */
  private extractEventType(event: WebhookEventData): string | null {
    return (
      event.event_type ||
      event.type ||
      event.data?.event_type ||
      event.data?.type ||
      null
    );
  }

  /**
   * Check if event type requires conversation ID
   */
  private requiresConversationId(eventType: string | null): boolean {
    if (!eventType) return false;
    
    const requiresConversation = [
      'conversation.toolcall',
      'conversation.tool_call',
      'tool_call',
      'conversation.utterance',
      'application.transcription_ready',
      'application.objective_completed',
    ];

    return requiresConversation.some(type => 
      eventType.toLowerCase().includes(type.toLowerCase())
    );
  }

  /**
   * Check if event is a tool call event
   */
  private isToolCallEvent(eventType: string | null): boolean {
    if (!eventType) return false;
    
    const normalizedType = eventType.toLowerCase().replace(/[.\-]/g, '_');
    return (
      normalizedType === 'conversation_toolcall' ||
      normalizedType === 'conversation_tool_call' ||
      normalizedType === 'tool_call' ||
      normalizedType.endsWith('_toolcall') ||
      normalizedType.endsWith('_tool_call') ||
      normalizedType.includes('tool_call')
    );
  }

  /**
   * Check if event is an objective completion event
   */
  private isObjectiveCompletionEvent(eventType: string | null): boolean {
    if (!eventType) return false;
    
    return (
      eventType === 'application.objective_completed' ||
      eventType === 'objective_completed' ||
      eventType === 'conversation.objective.completed'
    );
  }

  /**
   * Validate conversation ID format
   */
  validateConversationId(conversationId: string | null | undefined): WebhookValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!conversationId) {
      errors.push('Conversation ID is required');
      return { isValid: false, errors, warnings };
    }

    // Check format (should be a UUID or similar identifier)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(conversationId)) {
      warnings.push('Conversation ID does not match UUID format');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Validate event timestamp
   */
  validateEventTimestamp(event: WebhookEventData): WebhookValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    const timestamp = 
      (event.data as any)?.timestamp ||
      (event as any).timestamp ||
      (event.data as any)?.created_at ||
      (event as any).created_at;

    if (!timestamp) {
      warnings.push('No timestamp found in event');
      return { isValid: true, errors, warnings };
    }

    // Check if timestamp is valid
    const date = new Date(timestamp);
    if (isNaN(date.getTime())) {
      errors.push('Invalid timestamp format');
      return { isValid: false, errors, warnings };
    }

    // Check if timestamp is too old (more than 1 hour)
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    if (date < oneHourAgo) {
      warnings.push('Event timestamp is more than 1 hour old');
    }

    // Check if timestamp is in the future
    const now = new Date();
    if (date > now) {
      warnings.push('Event timestamp is in the future');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Comprehensive webhook validation
   */
  validateWebhook(
    rawBody: string,
    headers: Record<string, string | null>,
    event?: WebhookEventData
  ): WebhookValidationResult {
    const allErrors: string[] = [];
    const allWarnings: string[] = [];

    // Validate payload size
    const payloadValidation = this.validatePayloadSize(rawBody);
    allErrors.push(...payloadValidation.errors);
    allWarnings.push(...payloadValidation.warnings);

    // Validate headers
    const headerValidation = this.validateHeaders(headers);
    allErrors.push(...headerValidation.errors);
    allWarnings.push(...headerValidation.warnings);

    // Validate event if provided
    if (event) {
      const eventValidation = this.validateWebhookEvent(event);
      allErrors.push(...eventValidation.errors);
      allWarnings.push(...eventValidation.warnings);

      // Validate conversation ID
      const conversationValidation = this.validateConversationId(event.conversation_id);
      allErrors.push(...conversationValidation.errors);
      allWarnings.push(...conversationValidation.warnings);

      // Validate timestamp
      const timestampValidation = this.validateEventTimestamp(event);
      allErrors.push(...timestampValidation.errors);
      allWarnings.push(...timestampValidation.warnings);
    }

    return {
      isValid: allErrors.length === 0,
      errors: allErrors,
      warnings: allWarnings,
    };
  }
}

/**
 * Create a new webhook validation service instance
 */
export function createWebhookValidationService(): WebhookValidationService {
  return new WebhookValidationService();
}