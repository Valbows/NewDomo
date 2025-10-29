/**
 * Webhook Validation Utilities
 * Specialized validation functions for webhook events and payloads
 */

import { isPresent, isNonEmptyString, isValidArrayLength } from './common';

export interface WebhookValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Validate webhook payload size and structure
 * 
 * @param rawBody - Raw webhook payload
 * @param maxSize - Maximum allowed size in bytes (default: 1MB)
 * @returns Validation result
 */
export function validateWebhookPayloadSize(rawBody: string, maxSize: number = 1024 * 1024): WebhookValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!isNonEmptyString(rawBody)) {
    errors.push('Webhook payload is empty or invalid');
    return { isValid: false, errors, warnings };
  }

  // Check payload size
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
  if (rawBody.length > warningSize && rawBody.length <= maxSize) {
    warnings.push(`Large payload detected: ${rawBody.length} bytes`);
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Validate webhook headers for required fields
 * 
 * @param headers - Webhook headers object
 * @returns Validation result
 */
export function validateWebhookHeaders(headers: Record<string, string | null>): WebhookValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!headers || typeof headers !== 'object') {
    errors.push('Headers object is missing or invalid');
    return { isValid: false, errors, warnings };
  }

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
 * Validate conversation ID format
 * 
 * @param conversationId - Conversation ID to validate
 * @returns Validation result
 */
export function validateConversationId(conversationId: string | null | undefined): WebhookValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!isPresent(conversationId)) {
    errors.push('Conversation ID is required');
    return { isValid: false, errors, warnings };
  }

  if (!isNonEmptyString(conversationId)) {
    errors.push('Conversation ID must be a non-empty string');
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
 * 
 * @param event - Event object containing timestamp
 * @param maxAgeHours - Maximum age in hours (default: 1)
 * @returns Validation result
 */
export function validateEventTimestamp(event: any, maxAgeHours: number = 1): WebhookValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  const timestamp = 
    event?.data?.timestamp ||
    event?.timestamp ||
    event?.data?.created_at ||
    event?.created_at;

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

  // Check if timestamp is too old
  const maxAgeMs = maxAgeHours * 60 * 60 * 1000;
  const ageMs = Date.now() - date.getTime();
  if (ageMs > maxAgeMs) {
    warnings.push(`Event timestamp is more than ${maxAgeHours} hour(s) old`);
  }

  // Check if timestamp is in the future
  if (date.getTime() > Date.now()) {
    warnings.push('Event timestamp is in the future');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Extract event type from various possible locations in webhook payload
 * 
 * @param event - Event object
 * @returns Event type string or null if not found
 */
export function extractEventType(event: any): string | null {
  return (
    event?.event_type ||
    event?.type ||
    event?.data?.event_type ||
    event?.data?.type ||
    null
  );
}

/**
 * Check if event type requires conversation ID
 * 
 * @param eventType - Event type string
 * @returns True if conversation ID is required, false otherwise
 */
export function requiresConversationId(eventType: string | null): boolean {
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
 * 
 * @param eventType - Event type string
 * @returns True if it's a tool call event, false otherwise
 */
export function isToolCallEvent(eventType: string | null): boolean {
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
 * 
 * @param eventType - Event type string
 * @returns True if it's an objective completion event, false otherwise
 */
export function isObjectiveCompletionEvent(eventType: string | null): boolean {
  if (!eventType) return false;
  
  return (
    eventType === 'application.objective_completed' ||
    eventType === 'objective_completed' ||
    eventType === 'conversation.objective.completed'
  );
}