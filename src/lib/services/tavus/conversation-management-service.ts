/**
 * Tavus Conversation Management Service
 * High-level business logic for conversation operations
 */

import { ConversationService, createConversationService } from './conversation-service';
import { PersonaManagementService, createPersonaManagementService } from './persona-management-service';
import { TavusClient, createTavusClient } from './tavus-client';
import { ConversationResponse, ServiceResult } from './types';

export class ConversationManagementService {
  private conversationService: ConversationService;
  private personaManagementService: PersonaManagementService;

  constructor(client?: TavusClient) {
    const tavusClient = client || createTavusClient();
    this.conversationService = createConversationService(tavusClient);
    this.personaManagementService = createPersonaManagementService(tavusClient);
  }

  /**
   * Start conversation for demo with validation and reuse logic
   */
  async startConversationForDemo(
    demoId: string,
    userId: string,
    supabase: any,
    forceNew: boolean = false
  ): Promise<ServiceResult<ConversationResponse>> {
    try {
      console.log(`🚀 Starting conversation for demo ${demoId} (forceNew: ${forceNew})`);

      // Verify user owns the demo and get the persona ID
      const { data: demo, error: demoError } = await supabase
        .from('demos')
        .select('user_id, tavus_persona_id, tavus_conversation_id, metadata')
        .eq('id', demoId)
        .single();

      if (demoError || !demo || demo.user_id !== userId) {
        return {
          success: false,
          error: 'Demo not found or you do not have permission',
        };
      }

      if (!demo.tavus_persona_id) {
        return {
          success: false,
          error: 'This demo does not have a configured agent persona',
        };
      }

      // Reuse existing active conversation if valid Daily room URL exists and still active
      if (!forceNew) {
        const reuseResult = await this.tryReuseExistingConversation(demo);
        if (reuseResult.success && reuseResult.data) {
          console.log('♻️ Reusing existing conversation');
          return {
            success: true,
            data: reuseResult.data,
          };
        }
      }

      // Get replica ID (prefer env override, else fetch persona default)
      const replicaResult = await this.getReplicaId(demo.tavus_persona_id);
      if (!replicaResult.success) {
        return {
          success: false,
          error: replicaResult.error,
        };
      }

      // Create new conversation
      const conversationResult = await this.conversationService.createConversationWithWebhook(
        demo.tavus_persona_id,
        replicaResult.data,
        undefined // Let persona use its configured objectives
      );

      if (!conversationResult.success) {
        return conversationResult;
      }

      // Save conversation data to demo
      const saveResult = await this.saveConversationToDemo(
        supabase,
        demoId,
        conversationResult.data!
      );

      if (!saveResult.success) {
        console.warn('Failed to save conversation to demo:', saveResult.error);
        // Continue anyway, conversation was created successfully
      }

      console.log(`✅ Started new conversation ${conversationResult.data!.conversation_id} for demo ${demoId}`);
      return conversationResult;
    } catch (error) {
      console.error('Error starting conversation for demo:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * End conversation for demo with validation
   */
  async endConversationForDemo(
    demoId: string,
    userId: string,
    conversationId: string | null,
    supabase: any
  ): Promise<ServiceResult<ConversationResponse>> {
    try {
      console.log(`🛑 Ending conversation for demo ${demoId}`);

      // Verify user owns the demo if demoId is provided
      if (demoId) {
        const { data: demo, error: demoError } = await supabase
          .from('demos')
          .select('user_id, tavus_conversation_id')
          .eq('id', demoId)
          .single();

        if (demoError || !demo || demo.user_id !== userId) {
          return {
            success: false,
            error: 'Demo not found or you do not have permission',
          };
        }

        // Resolve conversation ID
        if (!conversationId && demo.tavus_conversation_id) {
          console.log('🔄 Using stored conversation ID from demo');
          conversationId = demo.tavus_conversation_id;
        } else if (demo.tavus_conversation_id !== conversationId) {
          if (demo.tavus_conversation_id) {
            console.log('🔄 Conversation ID mismatch, using stored ID from demo');
            conversationId = demo.tavus_conversation_id;
          } else {
            console.warn('⚠️ No stored conversation ID in demo, using provided ID');
          }
        }
      }

      // Final validation
      if (!conversationId || conversationId.trim() === '' || 
          conversationId === 'null' || conversationId === 'undefined') {
        return {
          success: false,
          error: 'No valid conversation ID found',
        };
      }

      console.log('🎯 Final conversation ID to end:', conversationId);

      // End the conversation
      const endResult = await this.conversationService.endConversation(conversationId);
      
      if (endResult.success) {
        console.log(`✅ Successfully ended conversation: ${conversationId}`);
      }

      return endResult;
    } catch (error) {
      console.error('Error ending conversation for demo:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Get conversation status for demo
   */
  async getConversationStatusForDemo(
    demoId: string,
    supabase: any
  ): Promise<ServiceResult<{
    hasActiveConversation: boolean;
    conversationId?: string;
    conversationUrl?: string;
    status?: string;
  }>> {
    try {
      const { data: demo, error: demoError } = await supabase
        .from('demos')
        .select('tavus_conversation_id, metadata')
        .eq('id', demoId)
        .single();

      if (demoError || !demo) {
        return {
          success: false,
          error: 'Demo not found',
        };
      }

      if (!demo.tavus_conversation_id) {
        return {
          success: true,
          data: {
            hasActiveConversation: false,
          },
        };
      }

      // Check if conversation is still active
      const conversationResult = await this.conversationService.getConversation(demo.tavus_conversation_id);
      
      // Parse metadata for conversation URL
      let conversationUrl: string | undefined;
      try {
        const metadata = typeof demo.metadata === 'string' ? JSON.parse(demo.metadata) : demo.metadata;
        conversationUrl = metadata?.tavusShareableLink;
      } catch {
        // Ignore metadata parsing errors
      }

      return {
        success: true,
        data: {
          hasActiveConversation: conversationResult.success && 
                                conversationResult.data?.status !== 'ended',
          conversationId: demo.tavus_conversation_id,
          conversationUrl,
          status: conversationResult.data?.status,
        },
      };
    } catch (error) {
      console.error('Error getting conversation status for demo:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Try to reuse existing conversation if valid
   */
  private async tryReuseExistingConversation(demo: any): Promise<ServiceResult<ConversationResponse | null>> {
    try {
      const metadata = typeof demo.metadata === 'string' ? JSON.parse(demo.metadata) : demo.metadata;
      const existingUrl = metadata?.tavusShareableLink as string | undefined;
      
      if (existingUrl && this.conversationService.isDailyRoomUrl(existingUrl)) {
        const roomExists = await this.conversationService.dailyRoomExists(existingUrl);
        
        if (roomExists) {
          return {
            success: true,
            data: {
              conversation_id: demo.tavus_conversation_id || null,
              conversation_url: existingUrl,
              status: 'active',
              created_at: '',
            },
          };
        } else {
          console.warn('Existing Daily URL appears stale or missing. Will create new conversation:', existingUrl);
        }
      }

      return {
        success: true,
        data: null, // No reusable conversation found
      };
    } catch (error) {
      console.warn('Failed to parse demo metadata while checking for existing conversation URL:', error);
      return {
        success: true,
        data: null,
      };
    }
  }

  /**
   * Get replica ID for conversation
   */
  private async getReplicaId(personaId: string): Promise<ServiceResult<string>> {
    try {
      // Prefer environment override
      let replicaId = (process.env.TAVUS_REPLICA_ID || '').trim();
      
      if (!replicaId) {
        // Fetch persona default replica ID
        const personaResult = await this.personaManagementService.validatePersonaConfiguration(personaId);
        
        if (personaResult.success) {
          replicaId = (personaResult.data!.persona as any)?.default_replica_id || '';
          
          if (replicaId) {
            console.log('Using persona default_replica_id for conversation:', replicaId);
          } else {
            console.warn('Persona has no default_replica_id; a replica_id must be provided via TAVUS_REPLICA_ID.');
          }
        } else {
          console.warn('Failed to fetch persona for default_replica_id');
        }
      } else {
        console.log('Using replica_id from env for conversation:', replicaId);
      }

      if (!replicaId) {
        const msg = 'Missing replica_id: Set TAVUS_REPLICA_ID or assign a default replica to the persona.';
        return {
          success: false,
          error: msg,
        };
      }

      return {
        success: true,
        data: replicaId,
      };
    } catch (error) {
      console.error('Error getting replica ID:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Save conversation data to demo
   */
  private async saveConversationToDemo(
    supabase: any,
    demoId: string,
    conversation: ConversationResponse
  ): Promise<ServiceResult<void>> {
    try {
      // Get current demo metadata
      const { data: currentDemo, error: fetchError } = await supabase
        .from('demos')
        .select('metadata')
        .eq('id', demoId)
        .single();

      if (fetchError) {
        console.warn('Error fetching current demo metadata:', fetchError);
      }

      // Update metadata with conversation URL
      const updatedMetadata = {
        ...(typeof currentDemo?.metadata === 'string' ? 
            (() => { try { return JSON.parse(currentDemo?.metadata as any) } catch { return {} } })() : 
            currentDemo?.metadata),
        tavusShareableLink: conversation.conversation_url
      };

      const { error: updateError } = await supabase
        .from('demos')
        .update({ 
          tavus_conversation_id: conversation.conversation_id,
          metadata: updatedMetadata
        })
        .eq('id', demoId);

      if (updateError) {
        return {
          success: false,
          error: 'Failed to save conversation to demo',
        };
      }

      return {
        success: true,
      };
    } catch (error) {
      console.error('Error saving conversation to demo:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}

/**
 * Create a new conversation management service instance
 */
export function createConversationManagementService(client?: TavusClient): ConversationManagementService {
  return new ConversationManagementService(client);
}