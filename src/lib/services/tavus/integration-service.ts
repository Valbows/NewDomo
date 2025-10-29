/**
 * Tavus Integration Service
 * High-level service that consolidates all Tavus functionality
 */

import { TavusClient, createTavusClient } from './tavus-client';
import { PersonaManagementService, createPersonaManagementService } from './persona-management-service';
import { ConversationManagementService, createConversationManagementService } from './conversation-management-service';
import { ObjectivesService, createObjectivesService } from './objectives-service';
import { GuardrailsService, createGuardrailsService } from './guardrails-service';
import { WebhookService, createWebhookService } from './webhook-service';
import { AnalyticsService, createAnalyticsService } from './analytics-service';
import { MediaService, createMediaService } from './media-service';
import { ServiceResult, PersonaConfig, PersonaResponse, ConversationResponse } from './types';

export class TavusIntegrationService {
  private client: TavusClient;
  private personaManagement: PersonaManagementService;
  private conversationManagement: ConversationManagementService;
  private objectives: ObjectivesService;
  private guardrails: GuardrailsService;
  private webhook: WebhookService;
  private analytics: AnalyticsService;
  private media: MediaService;

  constructor(client?: TavusClient) {
    this.client = client || createTavusClient();
    this.personaManagement = createPersonaManagementService(this.client);
    this.conversationManagement = createConversationManagementService(this.client);
    this.objectives = createObjectivesService(this.client);
    this.guardrails = createGuardrailsService(this.client);
    this.webhook = createWebhookService(this.client);
    this.analytics = createAnalyticsService(this.client);
    this.media = createMediaService(this.client);
  }

  // Persona Management
  async createCompleteDomoAIPersona(config: Partial<PersonaConfig> = {}): Promise<ServiceResult<PersonaResponse>> {
    return this.personaManagement.createCompleteDomoAIPersona(config);
  }

  async updatePersonaObjectives(personaId: string, objectivesId: string): Promise<ServiceResult<PersonaResponse>> {
    return this.personaManagement.updatePersonaObjectives(personaId, objectivesId);
  }

  async validatePersonaConfiguration(personaId: string) {
    return this.personaManagement.validatePersonaConfiguration(personaId);
  }

  async getPersonaStatusForDemo(demoId: string, supabase: any) {
    return this.personaManagement.getPersonaStatusForDemo(demoId, supabase);
  }

  async ensurePersonaProductionReady(personaId: string): Promise<ServiceResult<PersonaResponse>> {
    return this.personaManagement.ensurePersonaProductionReady(personaId);
  }

  // Conversation Management
  async startConversationForDemo(
    demoId: string,
    userId: string,
    supabase: any,
    forceNew: boolean = false
  ): Promise<ServiceResult<ConversationResponse>> {
    return this.conversationManagement.startConversationForDemo(demoId, userId, supabase, forceNew);
  }

  async endConversationForDemo(
    demoId: string,
    userId: string,
    conversationId: string | null,
    supabase: any
  ): Promise<ServiceResult<ConversationResponse>> {
    return this.conversationManagement.endConversationForDemo(demoId, userId, conversationId, supabase);
  }

  async getConversationStatusForDemo(demoId: string, supabase: any) {
    return this.conversationManagement.getConversationStatusForDemo(demoId, supabase);
  }

  // Objectives Management
  async getObjectivesForDemo(demoId: string): Promise<ServiceResult<string | null>> {
    try {
      // Import the function dynamically to avoid circular dependencies
      const { getObjectivesForDemo } = await import('../../tavus/custom-objectives-integration');
      const objectivesId = await getObjectivesForDemo(demoId);
      
      return {
        success: true,
        data: objectivesId,
      };
    } catch (error) {
      console.error('Error getting objectives for demo:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async syncCustomObjectiveWithTavus(customObjectiveId: string): Promise<ServiceResult<string | null>> {
    try {
      // Import the function dynamically to avoid circular dependencies
      const { syncCustomObjectiveWithTavus } = await import('../../tavus/custom-objectives-integration');
      const objectivesId = await syncCustomObjectiveWithTavus(customObjectiveId);
      
      return {
        success: true,
        data: objectivesId,
      };
    } catch (error) {
      console.error('Error syncing custom objective with Tavus:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async validateObjectivesOverride(demoId: string) {
    try {
      // Import the function dynamically to avoid circular dependencies
      const { validateObjectivesOverride } = await import('../../tavus/custom-objectives-integration');
      const result = await validateObjectivesOverride(demoId);
      
      return {
        success: true,
        data: result,
      };
    } catch (error) {
      console.error('Error validating objectives override:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  // Webhook Processing
  async processWebhookEvent(event: any, supabase: any): Promise<ServiceResult<void>> {
    try {
      const conversationId = event.conversation_id;
      const { toolName, toolArgs } = this.webhook.parseToolCallFromEvent(event);

      console.log('=== TAVUS WEBHOOK EVENT RECEIVED ===');
      console.log('Event Type:', event.event_type);
      console.log('Conversation ID:', conversationId);
      console.log('Tool Call:', toolName, toolArgs);
      console.log('=====================================');

      // Handle tool calls
      if (toolName === 'fetch_video' || toolName === 'play_video') {
        return await this.handleVideoToolCall(toolArgs, conversationId, supabase);
      } else if (toolName === 'show_trial_cta') {
        return await this.handleCTAToolCall(conversationId, supabase);
      }

      // Handle objective completion events
      const isObjectiveCompletion = event.event_type === 'application.objective_completed' || 
                                   event.event_type === 'objective_completed' || 
                                   event.event_type === 'conversation.objective.completed';
      
      if (isObjectiveCompletion) {
        return await this.analytics.processObjectiveCompletion(supabase, event);
      }

      // Handle analytics ingestion
      if (this.analytics.shouldIngestEvent(event)) {
        // Store in legacy format for backward compatibility
        await this.analytics.ingestAnalyticsEvent(supabase, conversationId, event);
        
        // Store in detailed conversation_details table
        await this.analytics.storeDetailedConversationData(supabase, conversationId, event);

        // Broadcast analytics update
        await this.broadcastAnalyticsUpdate(supabase, conversationId);
      }

      return {
        success: true,
      };
    } catch (error) {
      console.error('Error processing webhook event:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  // Video Tool Call Handler
  private async handleVideoToolCall(
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
        candidateTitle.trim().replace(/^['"]|['"]$/g, '') : '';

      const videoRequest = {
        video_title: videoTitle,
        demo_id: '', // Will be resolved by media service
        conversation_id: conversationId,
      };

      const result = await this.media.handleVideoRequest(videoRequest, supabase);
      
      if (!result.success) {
        console.error('Video request failed:', result.error);
      }

      return {
        success: result.success,
        error: result.error,
      };
    } catch (error) {
      console.error('Error handling video tool call:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  // CTA Tool Call Handler
  private async handleCTAToolCall(
    conversationId: string,
    supabase: any
  ): Promise<ServiceResult<void>> {
    try {
      console.log('Processing show_trial_cta tool call');
      
      // Process CTA display
      const ctaResult = await this.webhook.processCTADisplay(conversationId, supabase);
      if (!ctaResult.success) {
        return {
          success: false,
          error: ctaResult.error
        };
      }

      const ctaEvent = ctaResult.data!;

      // Track CTA shown event
      await this.webhook.trackCTAShown(ctaEvent, supabase);

      // Broadcast CTA event to frontend
      await this.broadcastCTAEvent(supabase, ctaEvent);

      return {
        success: true,
      };
    } catch (error) {
      console.error('Error handling CTA tool call:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  // Broadcast CTA Event
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

  // Broadcast Analytics Update
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

  // Webhook URL Management
  getWebhookUrlStatus() {
    return this.webhook.getWebhookUrlStatus();
  }

  async validateWebhookUrl(url?: string): Promise<boolean> {
    return this.webhook.validateWebhookUrl(url);
  }

  async updateWebhookUrlsForAllObjectives(newWebhookUrl?: string): Promise<ServiceResult<void>> {
    try {
      // Import the function dynamically to avoid circular dependencies
      const { updateWebhookUrlsForAllObjectives } = await import('../../tavus/webhook-url-manager');
      await updateWebhookUrlsForAllObjectives(newWebhookUrl);
      
      return {
        success: true,
      };
    } catch (error) {
      console.error('Error updating webhook URLs:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  // Direct access to sub-services for advanced use cases
  get services() {
    return {
      client: this.client,
      personaManagement: this.personaManagement,
      conversationManagement: this.conversationManagement,
      objectives: this.objectives,
      guardrails: this.guardrails,
      webhook: this.webhook,
      analytics: this.analytics,
      media: this.media,
    };
  }
}

/**
 * Create a new Tavus integration service instance
 */
export function createTavusIntegrationService(client?: TavusClient): TavusIntegrationService {
  return new TavusIntegrationService(client);
}

/**
 * Default Tavus service instance (singleton)
 */
let defaultTavusService: TavusIntegrationService | null = null;

export function getTavusService(): TavusIntegrationService {
  if (!defaultTavusService) {
    defaultTavusService = createTavusIntegrationService();
  }
  return defaultTavusService;
}