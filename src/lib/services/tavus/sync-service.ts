/**
 * Data Synchronization Service
 * Handles data synchronization between Tavus and local database
 */

import {TavusClient} from './tavus-client';
import {ServiceResult} from './types';

export class SyncService {
  private client: TavusClient;

  constructor(client: TavusClient) {
    this.client = client;
  }

  /**
   * Sync objectives data with Tavus
   */
  async syncObjectivesData(demoId: string): Promise<ServiceResult<string | null>> {
    try {
      // Import the function dynamically to avoid circular dependencies
      const { getObjectivesForDemo } = await import('../../tavus/custom-objectives-integration');
      const objectivesId = await getObjectivesForDemo(demoId);
      
      return {
        success: true,
        data: objectivesId,
      };
    } catch (error) {
      // console.error('Error syncing objectives data:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Sync custom objective with Tavus
   */
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
      // console.error('Error syncing custom objective with Tavus:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Validate objectives override configuration
   */
  async validateObjectivesOverride(demoId: string): Promise<ServiceResult<any>> {
    try {
      // Import the function dynamically to avoid circular dependencies
      const { validateObjectivesOverride } = await import('../../tavus/custom-objectives-integration');
      const result = await validateObjectivesOverride(demoId);
      
      return {
        success: true,
        data: result,
      };
    } catch (error) {
      // console.error('Error validating objectives override:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Sync analytics data with external systems
   */
  async syncAnalyticsData(supabase: any, conversationId: string, event: any): Promise<ServiceResult<void>> {
    try {
      // Import the analytics service dynamically to avoid circular dependencies
      const { AnalyticsService, createAnalyticsService } = await import('./analytics-service');
      const analyticsService = createAnalyticsService(this.client);
      
      // Check if event should be ingested
      if (analyticsService.shouldIngestEvent(event)) {

        
        // Store in detailed conversation_details table
        await analyticsService.storeDetailedConversationData(supabase, conversationId, event);
      }

      return {
        success: true,
      };
    } catch (error) {
      // console.error('Error syncing analytics data:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Sync persona data with Tavus
   */
  async syncPersonaData(personaId: string): Promise<ServiceResult<any>> {
    try {
      // Import the persona management service dynamically to avoid circular dependencies
      const { PersonaManagementService, createPersonaManagementService } = await import('./persona-management-service');
      const personaService = createPersonaManagementService(this.client);
      
      return await personaService.validatePersonaConfiguration(personaId);
    } catch (error) {
      // console.error('Error syncing persona data:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Sync conversation data with Tavus
   */
  async syncConversationData(demoId: string, supabase: any): Promise<ServiceResult<any>> {
    try {
      // Import the conversation management service dynamically to avoid circular dependencies
      const { ConversationManagementService, createConversationManagementService } = await import('./conversation-management-service');
      const conversationService = createConversationManagementService(this.client);
      
      return await conversationService.getConversationStatusForDemo(demoId, supabase);
    } catch (error) {
      // console.error('Error syncing conversation data:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Sync webhook configuration with Tavus
   */
  async syncWebhookConfiguration(): Promise<ServiceResult<any>> {
    try {
      // Import the webhook service dynamically to avoid circular dependencies
      const { WebhookService, createWebhookService } = await import('./webhook-service');
      const webhookService = createWebhookService(this.client);
      
      return {
        success: true,
        data: webhookService.getWebhookUrlStatus(),
      };
    } catch (error) {
      // console.error('Error syncing webhook configuration:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Perform full data synchronization
   */
  async performFullSync(demoId: string, supabase: any): Promise<ServiceResult<{
    objectives: any;
    persona: any;
    conversation: any;
    webhook: any;
  }>> {
    try {
      const [objectivesResult, conversationResult, webhookResult] = await Promise.allSettled([
        this.syncObjectivesData(demoId),
        this.syncConversationData(demoId, supabase),
        this.syncWebhookConfiguration(),
      ]);

      const results = {
        objectives: objectivesResult.status === 'fulfilled' ? objectivesResult.value : null,
        persona: null, // Will be set if persona sync is needed
        conversation: conversationResult.status === 'fulfilled' ? conversationResult.value : null,
        webhook: webhookResult.status === 'fulfilled' ? webhookResult.value : null,
      };

      return {
        success: true,
        data: results,
      };
    } catch (error) {
      // console.error('Error performing full sync:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}

/**
 * Create a new sync service instance
 */
export function createSyncService(client: TavusClient): SyncService {
  return new SyncService(client);
}