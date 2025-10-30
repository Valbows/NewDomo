/**
 * Webhook Validation Service
 * Business logic for validating webhook events and payloads
 * 
 * @deprecated This service has been moved to src/lib/utils/validation/webhook.ts
 * Use the consolidated validation utilities instead.
 */

import { WebhookEventData } from './types';
import { 
  validateWebhookPayloadSize,
  validateWebhookHeaders,
  validateConversationId,
  validateEventTimestamp,
  extractEventType,
  requiresConversationId,
  isToolCallEvent,
  isObjectiveCompletionEvent,
  type WebhookValidationResult
} from '@/lib/utils/validation/webhook';

export { type WebhookValidationResult } from '@/lib/utils/validation/webhook';

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
   * @deprecated Use validateWebhookPayloadSize from utils/validation/webhook instead
   */
  validatePayloadSize(rawBody: string): WebhookValidationResult {
    return validateWebhookPayloadSize(rawBody);
  }

  /**
   * Validate webhook headers
   * @deprecated Use validateWebhookHeaders from utils/validation/webhook instead
   */
  validateHeaders(headers: Record<string, string | null>): WebhookValidationResult {
    return validateWebhookHeaders(headers);
  }

  /**
   * Extract event type from various possible locations
   * @deprecated Use extractEventType from utils/validation/webhook instead
   */
  private extractEventType(event: WebhookEventData): string | null {
    return extractEventType(event);
  }

  /**
   * Check if event type requires conversation ID
   * @deprecated Use requiresConversationId from utils/validation/webhook instead
   */
  private requiresConversationId(eventType: string | null): boolean {
    return requiresConversationId(eventType);
  }

  /**
   * Check if event is a tool call event
   * @deprecated Use isToolCallEvent from utils/validation/webhook instead
   */
  private isToolCallEvent(eventType: string | null): boolean {
    return isToolCallEvent(eventType);
  }

  /**
   * Check if event is an objective completion event
   * @deprecated Use isObjectiveCompletionEvent from utils/validation/webhook instead
   */
  private isObjectiveCompletionEvent(eventType: string | null): boolean {
    return isObjectiveCompletionEvent(eventType);
  }

  /**
   * Validate conversation ID format
   * @deprecated Use validateConversationId from utils/validation/webhook instead
   */
  validateConversationId(conversationId: string | null | undefined): WebhookValidationResult {
    return validateConversationId(conversationId);
  }

  /**
   * Validate event timestamp
   * @deprecated Use validateEventTimestamp from utils/validation/webhook instead
   */
  validateEventTimestamp(event: WebhookEventData): WebhookValidationResult {
    return validateEventTimestamp(event);
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