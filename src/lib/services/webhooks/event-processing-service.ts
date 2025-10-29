/**
 * Webhook Event Processing Service
 * Business logic for processing webhook events and managing idempotency
 */

import crypto from 'crypto';
import { 
  IWebhookProcessingService, 
  WebhookEventData, 
  WebhookVerificationResult, 
  WebhookProcessingResult, 
  IdempotencyResult,
  WebhookSecurityConfig 
} from './types';
import { WebhookSecurityService } from './security-service';
import { WebhookToolCallService } from './tool-call-service';

export class WebhookEventProcessingService implements IWebhookProcessingService {
  private securityService: WebhookSecurityService;
  private toolCallService: WebhookToolCallService;

  constructor() {
    this.securityService = new WebhookSecurityService();
    this.toolCallService = new WebhookToolCallService();
  }

  /**
   * Verify webhook authenticity using signature or token
   */
  async verifyWebhook(
    rawBody: string,
    signature: string | null,
    token: string | null,
    config: WebhookSecurityConfig
  ): Promise<WebhookVerificationResult> {
    try {
      const result = this.securityService.verifyWebhookAuthentication(
        rawBody,
        signature,
        token
      );

      return {
        isValid: result.isValid,
        method: result.method,
        error: result.error,
      };
    } catch (error) {
      return {
        isValid: false,
        method: 'none',
        error: error instanceof Error ? error.message : 'Unknown verification error',
      };
    }
  }

  /**
   * Check for duplicate events using idempotency
   */
  async checkIdempotency(
    event: WebhookEventData,
    rawBody: string,
    supabase: any
  ): Promise<IdempotencyResult> {
    try {
      // Only check idempotency for tool-call events
      const { toolName } = this.toolCallService.parseToolCall(event);
      
      if (!toolName) {
        return {
          isDuplicate: false,
          eventId: '',
        };
      }

      // Generate event ID from various sources
      const eventIdCandidate =
        event?.id || 
        event?.event_id || 
        event?.data?.id || 
        event?.data?.event_id;
      
      const eventId = String(
        eventIdCandidate || crypto.createHash('sha256').update(rawBody).digest('hex')
      );

      // Check if event already exists
      const { data: existing } = await supabase
        .from('processed_webhook_events')
        .select('event_id')
        .eq('event_id', eventId)
        .single();

      if (existing?.event_id) {
        console.log('Idempotency: duplicate tool-call event detected, skipping processing:', eventId);
        return {
          isDuplicate: true,
          eventId,
        };
      }

      // Insert new event ID to prevent future duplicates
      await supabase
        .from('processed_webhook_events')
        .insert({ event_id: eventId });

      return {
        isDuplicate: false,
        eventId,
      };
    } catch (error) {
      // Non-fatal error - log warning but don't fail the webhook
      console.warn('Idempotency check/insert failed (non-fatal):', error);
      return {
        isDuplicate: false,
        eventId: '',
        error: error instanceof Error ? error.message : 'Unknown idempotency error',
      };
    }
  }

  /**
   * Process webhook event and extract tool calls
   */
  async processEvent(
    event: WebhookEventData,
    supabase: any
  ): Promise<WebhookProcessingResult> {
    try {
      const conversationId = event.conversation_id;
      
      if (!conversationId) {
        return {
          success: false,
          processed: false,
          error: 'No conversation ID found in event',
        };
      }

      // Parse tool call from event
      const { toolName, toolArgs } = this.toolCallService.parseToolCall(event);

      console.log('=== WEBHOOK EVENT PROCESSING ===');
      console.log('Event Type:', event.event_type);
      console.log('Conversation ID:', conversationId);
      console.log('Tool Call:', toolName, toolArgs);
      console.log('================================');

      // If no tool call, check for other event types
      if (!toolName) {
        return await this.processNonToolCallEvent(event, conversationId, supabase);
      }

      // Process tool call
      const toolResult = await this.toolCallService.executeToolCall(
        toolName,
        toolArgs,
        conversationId,
        supabase
      );

      return {
        success: toolResult.success,
        processed: true,
        toolCall: {
          name: toolName,
          args: toolArgs,
        },
        error: toolResult.error,
        data: toolResult.data,
      };
    } catch (error) {
      console.error('Error processing webhook event:', error);
      return {
        success: false,
        processed: false,
        error: error instanceof Error ? error.message : 'Unknown processing error',
      };
    }
  }

  /**
   * Process non-tool-call events (analytics, objectives, etc.)
   */
  private async processNonToolCallEvent(
    event: WebhookEventData,
    conversationId: string,
    supabase: any
  ): Promise<WebhookProcessingResult> {
    try {
      // Handle objective completion events
      const isObjectiveCompletion = 
        event.event_type === 'application.objective_completed' || 
        event.event_type === 'objective_completed' || 
        event.event_type === 'conversation.objective.completed';
      
      if (isObjectiveCompletion) {
        // Import analytics service dynamically to avoid circular dependencies
        const { getTavusService } = await import('../tavus/integration-service');
        const tavusService = getTavusService();
        
        const result = await tavusService.services.analytics.processObjectiveCompletion(supabase, event);
        
        return {
          success: result.success,
          processed: true,
          error: result.error,
          data: result.data,
        };
      }

      // Handle analytics ingestion for other events
      const shouldIngest = this.shouldIngestAnalyticsEvent(event);
      
      if (shouldIngest) {
        // Import analytics service dynamically
        const { getTavusService } = await import('../tavus/integration-service');
        const tavusService = getTavusService();
        
        // Store in legacy format for backward compatibility
        await tavusService.services.analytics.ingestAnalyticsEvent(supabase, conversationId, event);
        
        // Store in detailed conversation_details table
        await tavusService.services.analytics.storeDetailedConversationData(supabase, conversationId, event);

        return {
          success: true,
          processed: true,
        };
      }

      return {
        success: true,
        processed: false,
      };
    } catch (error) {
      console.error('Error processing non-tool-call event:', error);
      return {
        success: false,
        processed: false,
        error: error instanceof Error ? error.message : 'Unknown event processing error',
      };
    }
  }

  /**
   * Ingest event data for analytics and storage
   */
  async ingestEventData(
    event: WebhookEventData,
    conversationId: string,
    supabase: any
  ): Promise<{ success: boolean; stored: boolean; broadcasted: boolean; error?: string }> {
    try {
      let stored = false;
      let broadcasted = false;

      // Check if event should be ingested
      if (this.shouldIngestAnalyticsEvent(event)) {
        // Import analytics service dynamically
        const { getTavusService } = await import('../tavus/integration-service');
        const tavusService = getTavusService();
        
        // Store analytics data
        await tavusService.services.analytics.ingestAnalyticsEvent(supabase, conversationId, event);
        await tavusService.services.analytics.storeDetailedConversationData(supabase, conversationId, event);
        stored = true;

        // Broadcast analytics update
        await this.broadcastAnalyticsUpdate(supabase, conversationId);
        broadcasted = true;
      }

      return {
        success: true,
        stored,
        broadcasted,
      };
    } catch (error) {
      console.error('Error ingesting event data:', error);
      return {
        success: false,
        stored: false,
        broadcasted: false,
        error: error instanceof Error ? error.message : 'Unknown ingestion error',
      };
    }
  }

  /**
   * Check if event should be ingested for analytics
   */
  private shouldIngestAnalyticsEvent(event: WebhookEventData): boolean {
    // Import analytics service dynamically
    try {
      const { getTavusService } = require('../tavus/integration-service');
      const tavusService = getTavusService();
      return tavusService.services.analytics.shouldIngestEvent(event);
    } catch (error) {
      console.error('Error checking if event should be ingested:', error);
      return false;
    }
  }

  /**
   * Broadcast analytics update to real-time subscribers
   */
  private async broadcastAnalyticsUpdate(supabase: any, conversationId: string): Promise<void> {
    try {
      const { data: demoForBroadcast } = await supabase
        .from('demos')
        .select('id')
        .eq('tavus_conversation_id', conversationId)
        .single();

      if (demoForBroadcast?.id) {
        const channelName = `demo-${demoForBroadcast.id}`;
        const channel = supabase.channel(channelName);
        
        await new Promise<void>((resolve, reject) => {
          let settled = false;
          channel.subscribe((status: string) => {
            if (status === 'SUBSCRIBED' && !settled) {
              settled = true;
              console.log(`Server Realtime: SUBSCRIBED to ${channelName}`);
              resolve();
            }
          });
          setTimeout(() => {
            if (!settled) {
              settled = true;
              reject(new Error('Server Realtime subscribe timeout'));
            }
          }, 2000);
        });

        await channel.send({
          type: 'broadcast',
          event: 'analytics_updated',
          payload: {
            conversation_id: conversationId,
          },
        });
        
        console.log(`Broadcasted analytics_updated for demo ${demoForBroadcast.id}`);
        await supabase.removeChannel(channel);
      }
    } catch (error) {
      console.warn('Analytics broadcast failed (non-fatal):', error);
    }
  }
}

/**
 * Create a new webhook event processing service instance
 */
export function createWebhookEventProcessingService(): WebhookEventProcessingService {
  return new WebhookEventProcessingService();
}