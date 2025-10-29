/**
 * Webhook Data Ingestion Service
 * Business logic for storing and broadcasting webhook event data
 */

import { IWebhookDataIngestionService, WebhookEventData, WebhookServiceResult } from './types';

export class WebhookDataIngestionService implements IWebhookDataIngestionService {
  /**
   * Store webhook event data in analytics tables
   */
  async storeEventData(
    event: WebhookEventData,
    conversationId: string,
    supabase: any
  ): Promise<WebhookServiceResult<void>> {
    try {
      // Import analytics service dynamically to avoid circular dependencies
      const { getTavusService } = await import('../tavus/integration-service');
      const tavusService = getTavusService();

      // Store in legacy analytics format for backward compatibility
      await tavusService.services.analytics.ingestAnalyticsEvent(supabase, conversationId, event);

      return {
        success: true,
      };
    } catch (error) {
      console.error('Error storing event data:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown storage error',
      };
    }
  }

  /**
   * Store detailed conversation data
   */
  async storeConversationData(
    event: WebhookEventData,
    conversationId: string,
    supabase: any
  ): Promise<WebhookServiceResult<void>> {
    try {
      // Import analytics service dynamically to avoid circular dependencies
      const { getTavusService } = await import('../tavus/integration-service');
      const tavusService = getTavusService();

      // Store in detailed conversation_details table
      await tavusService.services.analytics.storeDetailedConversationData(supabase, conversationId, event);

      return {
        success: true,
      };
    } catch (error) {
      console.error('Error storing conversation data:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown conversation storage error',
      };
    }
  }

  /**
   * Broadcast real-time updates to subscribers
   */
  async broadcastUpdate(
    event: WebhookEventData,
    conversationId: string,
    supabase: any
  ): Promise<WebhookServiceResult<void>> {
    try {
      // Find the demo associated with this conversation
      const { data: demoForBroadcast } = await supabase
        .from('demos')
        .select('id')
        .eq('tavus_conversation_id', conversationId)
        .single();

      if (!demoForBroadcast?.id) {
        return {
          success: false,
          error: 'Demo not found for conversation',
        };
      }

      const channelName = `demo-${demoForBroadcast.id}`;
      const channel = supabase.channel(channelName);
      
      // Subscribe to channel with timeout
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

      // Broadcast analytics update
      await channel.send({
        type: 'broadcast',
        event: 'analytics_updated',
        payload: {
          conversation_id: conversationId,
          event_type: event.event_type,
          timestamp: new Date().toISOString(),
        },
      });
      
      console.log(`Broadcasted analytics_updated for demo ${demoForBroadcast.id}`);
      await supabase.removeChannel(channel);

      return {
        success: true,
      };
    } catch (error) {
      console.warn('Broadcast failed (non-fatal):', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown broadcast error',
      };
    }
  }

  /**
   * Check if event should be ingested for analytics
   */
  shouldIngestEvent(event: WebhookEventData): boolean {
    try {
      // Import analytics service dynamically to avoid circular dependencies
      const { getTavusService } = require('../tavus/integration-service');
      const tavusService = getTavusService();
      return tavusService.services.analytics.shouldIngestEvent(event);
    } catch (error) {
      console.error('Error checking if event should be ingested:', error);
      return false;
    }
  }

  /**
   * Process complete data ingestion workflow
   */
  async processDataIngestion(
    event: WebhookEventData,
    conversationId: string,
    supabase: any
  ): Promise<WebhookServiceResult<{
    stored: boolean;
    conversationDataStored: boolean;
    broadcasted: boolean;
  }>> {
    try {
      let stored = false;
      let conversationDataStored = false;
      let broadcasted = false;

      // Check if event should be ingested
      if (this.shouldIngestEvent(event)) {
        // Store analytics data
        const storeResult = await this.storeEventData(event, conversationId, supabase);
        stored = storeResult.success;

        // Store detailed conversation data
        const conversationResult = await this.storeConversationData(event, conversationId, supabase);
        conversationDataStored = conversationResult.success;

        // Broadcast update
        const broadcastResult = await this.broadcastUpdate(event, conversationId, supabase);
        broadcasted = broadcastResult.success;
      }

      return {
        success: true,
        data: {
          stored,
          conversationDataStored,
          broadcasted,
        },
      };
    } catch (error) {
      console.error('Error processing data ingestion:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown ingestion processing error',
      };
    }
  }

  /**
   * Store objective completion data
   */
  async storeObjectiveCompletion(
    event: WebhookEventData,
    supabase: any
  ): Promise<WebhookServiceResult<void>> {
    try {
      // Import analytics service dynamically to avoid circular dependencies
      const { getTavusService } = await import('../tavus/integration-service');
      const tavusService = getTavusService();

      const result = await tavusService.services.analytics.processObjectiveCompletion(supabase, event);
      
      return {
        success: result.success,
        error: result.error,
      };
    } catch (error) {
      console.error('Error storing objective completion:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown objective completion error',
      };
    }
  }

  /**
   * Track CTA click events
   */
  async trackCTAClick(
    clickData: {
      conversationId: string;
      demoId: string;
      ctaUrl?: string;
      userAgent: string;
      ipAddress: string;
      timestamp: string;
    },
    supabase: any
  ): Promise<WebhookServiceResult<void>> {
    try {
      const { conversationId, demoId, ctaUrl, userAgent, ipAddress, timestamp } = clickData;

      // Check if CTA tracking record already exists
      const { data: existing } = await supabase
        .from('cta_tracking')
        .select('id, cta_url')
        .eq('conversation_id', conversationId)
        .single();

      if (existing?.id) {
        // Update existing record with click data
        const { error: updateErr } = await supabase
          .from('cta_tracking')
          .update({
            cta_clicked_at: timestamp,
            user_agent: userAgent,
            ip_address: ipAddress,
            updated_at: timestamp,
            cta_url: ctaUrl || existing.cta_url || null,
          })
          .eq('id', existing.id);

        if (updateErr) {
          return {
            success: false,
            error: `Failed to update CTA click: ${updateErr.message}`,
          };
        }
      } else {
        // Insert new CTA tracking record
        const { error: insertErr } = await supabase
          .from('cta_tracking')
          .insert({
            conversation_id: conversationId,
            demo_id: demoId,
            cta_clicked_at: timestamp,
            user_agent: userAgent,
            ip_address: ipAddress,
            updated_at: timestamp,
            cta_url: ctaUrl || null,
          });

        if (insertErr) {
          return {
            success: false,
            error: `Failed to insert CTA click: ${insertErr.message}`,
          };
        }
      }

      return {
        success: true,
      };
    } catch (error) {
      console.error('Error tracking CTA click:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown CTA tracking error',
      };
    }
  }

  /**
   * Broadcast specific event types with custom payloads
   */
  async broadcastCustomEvent(
    eventType: string,
    payload: any,
    demoId: string,
    supabase: any
  ): Promise<WebhookServiceResult<void>> {
    try {
      const channelName = `demo-${demoId}`;
      const channel = supabase.channel(channelName);
      
      // Subscribe to channel with timeout
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

      // Broadcast custom event
      await channel.send({
        type: 'broadcast',
        event: eventType,
        payload: {
          ...payload,
          timestamp: new Date().toISOString(),
        },
      });
      
      console.log(`Broadcasted ${eventType} event for demo ${demoId}`);
      await supabase.removeChannel(channel);

      return {
        success: true,
      };
    } catch (error) {
      console.warn(`Custom event broadcast failed (non-fatal):`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown custom broadcast error',
      };
    }
  }
}

/**
 * Create a new webhook data ingestion service instance
 */
export function createWebhookDataIngestionService(): WebhookDataIngestionService {
  return new WebhookDataIngestionService();
}