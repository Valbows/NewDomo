/**
 * Webhook Tool Call Service
 * Business logic for parsing and executing tool calls from webhook events
 */

import { IWebhookToolCallService, WebhookEventData, WebhookServiceResult } from './types';

export class WebhookToolCallService implements IWebhookToolCallService {
  /**
   * Parse tool call from webhook event using the tool parser
   */
  parseToolCall(event: WebhookEventData): {
    toolName: string | null;
    toolArgs: any;
  } {
    try {
      // Import the tool parser dynamically to avoid circular dependencies
      const { parseToolCallFromEvent } = require('../../tools/toolParser');
      return parseToolCallFromEvent(event);
    } catch (error) {
      console.error('Error parsing tool call:', error);
      return { toolName: null, toolArgs: {} };
    }
  }

  /**
   * Validate tool call arguments
   */
  validateToolCall(
    toolName: string,
    toolArgs: any
  ): {
    isValid: boolean;
    error?: string;
  } {
    try {
      // Validate known tool calls
      switch (toolName) {
        case 'fetch_video':
        case 'play_video':
          return this.validateVideoToolCall(toolArgs);
        
        case 'show_trial_cta':
          return this.validateCTAToolCall(toolArgs);
        
        case 'pause_video':
        case 'next_video':
        case 'close_video':
          // These tools don't require arguments
          return { isValid: true };
        
        default:
          return {
            isValid: false,
            error: `Unknown tool: ${toolName}`,
          };
      }
    } catch (error) {
      return {
        isValid: false,
        error: error instanceof Error ? error.message : 'Unknown validation error',
      };
    }
  }

  /**
   * Execute tool call using appropriate service
   */
  async executeToolCall(
    toolName: string,
    toolArgs: any,
    conversationId: string,
    supabase: any
  ): Promise<WebhookServiceResult<any>> {
    try {
      // Validate tool call first
      const validation = this.validateToolCall(toolName, toolArgs);
      if (!validation.isValid) {
        return {
          success: false,
          error: validation.error,
        };
      }

      // Execute based on tool type
      switch (toolName) {
        case 'fetch_video':
        case 'play_video':
          return await this.executeVideoToolCall(toolArgs, conversationId, supabase);
        
        case 'show_trial_cta':
          return await this.executeCTAToolCall(conversationId, supabase);
        
        case 'pause_video':
        case 'next_video':
        case 'close_video':
          // These are UI control commands - no server-side action needed
          return {
            success: true,
            data: {
              action: toolName,
              message: `${toolName} command processed`,
            },
          };
        
        default:
          return {
            success: false,
            error: `Unsupported tool: ${toolName}`,
          };
      }
    } catch (error) {
      console.error(`Error executing tool call ${toolName}:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown execution error',
      };
    }
  }

  /**
   * Validate video tool call arguments
   */
  private validateVideoToolCall(toolArgs: any): {
    isValid: boolean;
    error?: string;
  } {
    const candidateTitle = (
      toolArgs?.video_title ||
      toolArgs?.title ||
      toolArgs?.videoName ||
      toolArgs?.video_name ||
      (typeof toolArgs === 'string' ? toolArgs : null)
    ) as string | null;
    
    const videoTitle = typeof candidateTitle === 'string' ? 
      candidateTitle.trim().replace(/^['"]|['"]$/g, '') : '';

    if (!videoTitle) {
      return {
        isValid: false,
        error: 'Invalid or missing video title',
      };
    }

    return { isValid: true };
  }

  /**
   * Validate CTA tool call arguments
   */
  private validateCTAToolCall(toolArgs: any): {
    isValid: boolean;
    error?: string;
  } {
    // CTA tool call doesn't require specific arguments
    return { isValid: true };
  }

  /**
   * Execute video tool call
   */
  private async executeVideoToolCall(
    toolArgs: any,
    conversationId: string,
    supabase: any
  ): Promise<WebhookServiceResult<any>> {
    try {
      const candidateTitle = (
        toolArgs?.video_title ||
        toolArgs?.title ||
        toolArgs?.videoName ||
        toolArgs?.video_name ||
        (typeof toolArgs === 'string' ? toolArgs : null)
      ) as string | null;
      
      const videoTitle = typeof candidateTitle === 'string' ? 
        candidateTitle.trim().replace(/^['"]|['"]$/g, '') : '';

      // Validate video title
      if (!videoTitle) {
        console.warn('🚨 GUARDRAIL VIOLATION: Invalid video title in tool call', {
          conversation_id: conversationId,
          video_title: videoTitle,
          timestamp: new Date().toISOString()
        });
        
        return {
          success: false,
          error: 'Invalid or missing video title',
        };
      }

      // Import Tavus service dynamically to avoid circular dependencies
      const { getTavusService } = await import('../tavus/integration-service');
      const tavusService = getTavusService();

      const videoRequest = {
        video_title: videoTitle,
        demo_id: '', // Will be resolved by media service
        conversation_id: conversationId,
      };

      const result = await tavusService.services.media.handleVideoRequest(videoRequest, supabase);
      
      if (result.success) {
        // Track video showcase data
        await this.trackVideoShowcase(conversationId, videoTitle, supabase);
      }

      return result;
    } catch (error) {
      console.error('Error executing video tool call:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown video execution error',
      };
    }
  }

  /**
   * Execute CTA tool call
   */
  private async executeCTAToolCall(
    conversationId: string,
    supabase: any
  ): Promise<WebhookServiceResult<any>> {
    try {
      console.log('Processing show_trial_cta tool call');
      
      // Import Tavus service dynamically to avoid circular dependencies
      const { getTavusService } = await import('../tavus/integration-service');
      const tavusService = getTavusService();

      // Process CTA display
      const ctaResult = await tavusService.services.webhook.processCTADisplay(conversationId, supabase);
      if (!ctaResult.success) {
        return ctaResult;
      }

      const ctaEvent = ctaResult.data!;

      // Track CTA shown event
      await tavusService.services.webhook.trackCTAShown(ctaEvent, supabase);

      // Broadcast CTA event to frontend
      await this.broadcastCTAEvent(supabase, ctaEvent);

      return {
        success: true,
        data: ctaEvent,
      };
    } catch (error) {
      console.error('Error executing CTA tool call:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown CTA execution error',
      };
    }
  }

  /**
   * Track video showcase data
   */
  private async trackVideoShowcase(
    conversationId: string,
    videoTitle: string,
    supabase: any
  ): Promise<void> {
    try {
      // Find the demo associated with this conversation
      const { data: demo, error: demoError } = await supabase
        .from('demos')
        .select('id')
        .eq('tavus_conversation_id', conversationId)
        .single();

      if (demoError || !demo) {
        console.warn('Could not find demo for video showcase tracking:', conversationId);
        return;
      }

      // Import Tavus service dynamically
      const { getTavusService } = await import('../tavus/integration-service');
      const tavusService = getTavusService();

      await tavusService.services.webhook.trackVideoShowcase(
        conversationId,
        demo.id,
        videoTitle,
        supabase
      );
    } catch (error) {
      console.warn('Video showcase tracking failed (non-fatal):', error);
    }
  }

  /**
   * Broadcast CTA event to real-time subscribers
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
        event: 'show_trial_cta',
        payload: {
          cta_title: ctaEvent.cta_config.title ?? null,
          cta_message: ctaEvent.cta_config.message ?? null,
          cta_button_text: ctaEvent.cta_config.button_text ?? null,
          cta_button_url: ctaEvent.cta_config.button_url ?? null,
        },
      });
      
      console.log(`Broadcasted show_trial_cta event for demo ${ctaEvent.demo_id}`);
      await supabase.removeChannel(channel);
    } catch (error) {
      console.warn('CTA broadcast failed (non-fatal):', error);
    }
  }
}

/**
 * Create a new webhook tool call service instance
 */
export function createWebhookToolCallService(): WebhookToolCallService {
  return new WebhookToolCallService();
}