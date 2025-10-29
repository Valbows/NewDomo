/**
 * Tavus Conversation Service
 * Business logic for conversation management
 */

import { TavusClient, createTavusClient } from './tavus-client';
import { ConversationConfig, ConversationResponse, ServiceResult } from './types';

export class ConversationService {
  private client: TavusClient;

  constructor(client?: TavusClient) {
    this.client = client || createTavusClient();
  }

  /**
   * Start a new conversation
   */
  async startConversation(config: ConversationConfig): Promise<ServiceResult<ConversationResponse>> {
    try {
      const response = await this.client.post<ConversationResponse>('/conversations', config);
      
      if (!response.data) {
        return {
          success: false,
          error: response.error || 'Failed to start conversation',
        };
      }

      console.log(`✅ Started conversation ${response.data.conversation_id}`);
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      console.error('Error starting conversation:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Get conversation by ID
   */
  async getConversation(conversationId: string): Promise<ServiceResult<ConversationResponse>> {
    try {
      const response = await this.client.get<ConversationResponse>(`/conversations/${conversationId}`);
      
      if (!response.data) {
        return {
          success: false,
          error: response.error || 'Conversation not found',
        };
      }

      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      console.error('Error getting conversation:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * End a conversation
   */
  async endConversation(conversationId: string): Promise<ServiceResult<ConversationResponse>> {
    try {
      // First check if conversation exists and its status
      const getResult = await this.getConversation(conversationId);
      
      if (!getResult.success) {
        if (getResult.error?.includes('not found') || getResult.error?.includes('404')) {
          // Conversation not found, consider it already ended
          return {
            success: true,
            data: {
              conversation_id: conversationId,
              conversation_url: '',
              status: 'ended',
              created_at: '',
            },
          };
        }
        return getResult;
      }

      // If already ended, return success
      if (getResult.data?.status === 'ended' || getResult.data?.status === 'completed') {
        return {
          success: true,
          data: getResult.data,
        };
      }

      // End the conversation
      const response = await this.client.post<ConversationResponse>(
        `/conversations/${conversationId}/end`
      );
      
      if (!response.data && response.status !== 200) {
        // Handle specific error cases
        if (response.status === 404 || response.status === 409) {
          // 404: Not found, 409: Conflict (already ended)
          return {
            success: true,
            data: {
              conversation_id: conversationId,
              conversation_url: '',
              status: 'ended',
              created_at: '',
            },
          };
        }
        
        return {
          success: false,
          error: response.error || 'Failed to end conversation',
        };
      }

      console.log(`✅ Ended conversation ${conversationId}`);
      return {
        success: true,
        data: response.data || {
          conversation_id: conversationId,
          conversation_url: '',
          status: 'ended',
          created_at: '',
        },
      };
    } catch (error) {
      console.error('Error ending conversation:', error);
      
      // Even if API fails, consider it a success since conversation might have ended
      console.warn('API call failed but conversation may have ended successfully');
      return {
        success: true,
        data: {
          conversation_id: conversationId,
          conversation_url: '',
          status: 'ended',
          created_at: '',
        },
      };
    }
  }

  /**
   * Create conversation with webhook callback
   */
  async createConversationWithWebhook(
    personaId: string,
    replicaId?: string,
    objectivesId?: string
  ): Promise<ServiceResult<ConversationResponse>> {
    try {
      // Build callback URL with webhook token
      const baseUrl = (process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000').replace(/\/$/, '');
      const urlToken = (process.env.TAVUS_WEBHOOK_TOKEN || '').trim();
      const callbackUrl = `${baseUrl}/api/tavus-webhook${urlToken ? `?t=${encodeURIComponent(urlToken)}` : ''}`;

      const config: ConversationConfig = {
        persona_id: personaId,
        callback_url: callbackUrl,
        ...(replicaId ? { replica_id: replicaId } : {}),
        ...(objectivesId ? { objectives_id: objectivesId } : {}),
      };

      return await this.startConversation(config);
    } catch (error) {
      console.error('Error creating conversation with webhook:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Validate Daily room URL
   */
  isDailyRoomUrl(url: string): boolean {
    return /^https?:\/\/[a-z0-9.-]+\.daily\.co\/.+/i.test(url);
  }

  /**
   * Parse Daily URL into components
   */
  parseDailyUrl(url: string): { domain: string; room: string } | null {
    const match = url.match(/^https?:\/\/([a-z0-9-]+)\.daily\.co\/([^\/?#]+)/i);
    if (!match) return null;
    return { 
      domain: match[1], 
      room: decodeURIComponent(match[2]) 
    };
  }

  /**
   * Check if Daily room exists
   */
  async dailyRoomExists(url: string): Promise<boolean> {
    const parsed = this.parseDailyUrl(url);
    if (!parsed) return false;
    
    try {
      const response = await fetch(`https://gs.daily.co/rooms/check/${parsed.domain}/${parsed.room}`);
      return response.ok;
    } catch {
      return false;
    }
  }
}

/**
 * Create a new conversation service instance
 */
export function createConversationService(client?: TavusClient): ConversationService {
  return new ConversationService(client);
}