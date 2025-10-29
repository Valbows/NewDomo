/**
 * Webhook Services
 * 
 * This module provides webhook-related business logic services.
 * Services in this module handle webhook processing, event handling,
 * and external service integrations via webhooks.
 */

// Export webhook service interfaces and types (excluding ServiceResult to avoid conflict)
export type {
  WebhookEventData,
  WebhookVerificationResult,
  WebhookProcessingResult,
  IdempotencyResult,
  WebhookSecurityConfig,
  WebhookEventIngestionResult,
  WebhookServiceResult,
  IWebhookProcessingService,
  IWebhookSecurityService,
  IWebhookToolCallService,
  IWebhookDataIngestionService
} from './types';

// Export main webhook processing service
export { WebhookProcessingService, createWebhookProcessingService, getWebhookProcessingService } from './webhook-service';

// Export individual services
export { WebhookSecurityService, createWebhookSecurityService } from './security-service';
export { WebhookEventProcessingService, createWebhookEventProcessingService } from './event-processing-service';
export { WebhookToolCallService, createWebhookToolCallService } from './tool-call-service';
export { WebhookDataIngestionService, createWebhookDataIngestionService } from './data-ingestion-service';
export { WebhookValidationService, createWebhookValidationService } from './validation-service';

// Import for singleton instances
import { WebhookDataIngestionService, createWebhookDataIngestionService } from './data-ingestion-service';

// Singleton service instances
let webhookDataIngestionServiceInstance: WebhookDataIngestionService | null = null;

/**
 * Get singleton webhook data ingestion service instance
 */
export function getWebhookDataIngestionService(): WebhookDataIngestionService {
  if (!webhookDataIngestionServiceInstance) {
    webhookDataIngestionServiceInstance = createWebhookDataIngestionService();
  }
  return webhookDataIngestionServiceInstance;
}