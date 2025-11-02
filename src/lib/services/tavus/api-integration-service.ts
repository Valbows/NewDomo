/**
 * API Integration Service
 * Handles external API integrations and webhook processing
 */

import {TavusClient} from './tavus-client';
import {ServiceResult} from './types';

export class ApiIntegrationService {
  private client: TavusClient;

  constructor(client: TavusClient) {
    this.client = client;
  }

  /**
   * Process webhook event and route to appropriate handlers
   */
  async processWebhookEvent(event: any, supabase: any): Promise<ServiceResult<void>> {
    try {
      const conversationId = event.conversation_id;

      // Handle objective completion events
      const isObjectiveCompletion = event.event_type === 'application.objective_completed' || 
                                   event.event_type === 'objective_completed' || 
                                   event.event_type === 'conversation.objective.completed';
      
      if (isObjectiveCompletion) {
        return await this.processObjectiveCompletion(supabase, event);
      }

      return {
        success: true,
      };
    } catch (error) {
      // console.error('Error processing webhook event:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Process objective completion event
   */
  private async processObjectiveCompletion(supabase: any, event: any): Promise<ServiceResult<void>> {
    try {
      // Import the analytics service dynamically to avoid circular dependencies
      const { AnalyticsService, createAnalyticsService } = await import('./analytics-service');
      const analyticsService = createAnalyticsService(this.client);
      
      return await analyticsService.processObjectiveCompletion(supabase, event);
    } catch (error) {
      // console.error('Error processing objective completion:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Handle video tool call
   */
  async handleVideoToolCall(
    toolArgs: any,
    conversationId: string,
    supabase: any
  ): Promise<ServiceResult<void>> {
    try {
      const candidateTitle = (
        toolArgs?.video_title ||
        toolArgs?.title ||
        toolArgs?.videoName ||
        toolArgs?.video_name ||
        (typeof toolArgs === 'string' ? toolArgs : null)
      ) as string | null;
      
      const videoTitle = typeof candidateTitle === 'string' ? 
        candidateTitle.trim().replace(/^['&quot;]|['&quot;]$/g, '') : '';

      const videoRequest = {
        video_title: videoTitle,
        demo_id: '', // Will be resolved by media service
        conversation_id: conversationId,
      };

      // Import the media service dynamically to avoid circular dependencies
      const { MediaService, createMediaService } = await import('./media-service');
      const mediaService = createMediaService(this.client);
      
      const result = await mediaService.handleVideoRequest(videoRequest, supabase);
      
      if (!result.success) {
        // console.error('Video request failed:', result.error);
      }

      return {
        success: result.success,
        error: result.error,
      };
    } catch (error) {
      // console.error('Error handling video tool call:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Handle CTA tool call
   */
  async handleCTAToolCall(
    conversationId: string,
    supabase: any
  ): Promise<ServiceResult<void>> {
    try {

      // Import the webhook service dynamically to avoid circular dependencies
      const { WebhookService, createWebhookService } = await import('./webhook-service');
      const webhookService = createWebhookService(this.client);
      
      // Process CTA display
      const ctaResult = await webhookService.processCTADisplay(conversationId, supabase);
      if (!ctaResult.success) {
        return {
          success: false,
          error: ctaResult.error
        };
      }

      const ctaEvent = ctaResult.data!;

      // Track CTA shown event
      await webhookService.trackCTAShown(ctaEvent, supabase);

      // Broadcast CTA event to frontend
      await this.broadcastCTAEvent(supabase, ctaEvent);

      return {
        success: true,
      };
    } catch (error) {
      // console.error('Error handling CTA tool call:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Broadcast CTA event to frontend
   */
  private async broadcastCTAEvent(supabase: any, ctaEvent: any): Promise<void> {
    try {
      const channelName = `demo-${ctaEvent.demo_id}`;
      const channel = supabase.channel(channelName);
      
      await new Promise<void>((resolve, reject) => {
        let settled = false;
        channel.subscribe((status: string) => {
          if (status === 'SUBSCRIBED' && !settled) {
            settled = true;

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
        event: 'show_trial_cta',
        payload: {
          cta_title: ctaEvent.cta_config.title ?? null,
          cta_message: ctaEvent.cta_config.message ?? null,
          cta_button_text: ctaEvent.cta_config.button_text ?? null,
          cta_button_url: ctaEvent.cta_config.button_url ?? null,
        },
      });

      await supabase.removeChannel(channel);
    } catch (error) {
      // console.warn('CTA broadcast failed (non-fatal):', error);
    }
  }

  /**
   * Broadcast analytics update to frontend
   */
  async broadcastAnalyticsUpdate(supabase: any, conversationId: string): Promise<void> {
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

        await supabase.removeChannel(channel);
      }
    } catch (error) {
      // console.warn('Analytics broadcast failed (non-fatal):', error);
    }
  }

  /**
   * Validate webhook URL
   */
  async validateWebhookUrl(url?: string): Promise<boolean> {
    // Import the webhook service dynamically to avoid circular dependencies
    const { WebhookService, createWebhookService } = await import('./webhook-service');
    const webhookService = createWebhookService(this.client);
    
    return webhookService.validateWebhookUrl(url);
  }

  /**
   * Update webhook URLs for all objectives
   */
  async updateWebhookUrlsForAllObjectives(newWebhookUrl?: string): Promise<ServiceResult<void>> {
    try {
      // Import the function dynamically to avoid circular dependencies
      const { updateWebhookUrlsForAllObjectives } = await import('../../tavus/webhook-url-manager');
      await updateWebhookUrlsForAllObjectives(newWebhookUrl);
      
      return {
        success: true,
      };
    } catch (error) {
      // console.error('Error updating webhook URLs:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}

/**
 * Create a new API integration service instance
 */
export function createApiIntegrationService(client: TavusClient): ApiIntegrationService {
  return new ApiIntegrationService(client);
}