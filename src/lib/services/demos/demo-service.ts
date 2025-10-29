/**
 * Demo Service Implementation
 * 
 * Handles demo creation, configuration, and management operations.
 */

import { createServerSupabaseClient } from '@/lib/utils/supabase';
import { createClient as createServiceClient } from '@supabase/supabase-js';
import { ServiceResult, ServiceErrorCode } from '../types';
import { IDemoService, DemoConfig, KnowledgeChunk, DemoVideo, TestDemoParams, PersonaStatus, PersonaDetails } from './types';
import { logError } from '@/lib/errors';

export class DemoService implements IDemoService {
  readonly name = 'DemoService';

  /**
   * Create a test demo with sample data
   */
  async createTestDemo(params?: TestDemoParams): Promise<ServiceResult<{ demoId: string; videosCreated: number }>> {
    try {
      // Use service role client to bypass RLS for testing
      const supabase = createServiceClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SECRET_KEY!,
        {
          auth: {
            autoRefreshToken: false,
            persistSession: false
          }
        }
      );

      const testDemoId = params?.demoId || '12345678-1234-1234-1234-123456789012';
      const testUserId = params?.userId || '12345678-1234-1234-1234-123456789012';
      const demoName = params?.name || 'Test Demo';

      // Check if demo already exists
      const { data: existingDemo } = await supabase
        .from('demos')
        .select('id')
        .eq('id', testDemoId)
        .single();

      if (existingDemo) {
        // Check if videos already exist for this demo
        const { data: existingVideos, error: existingVideosError } = await supabase
          .from('demo_videos')
          .select('id')
          .eq('demo_id', testDemoId);

        if (existingVideosError) {
          logError(existingVideosError, 'Existing videos check error');
          return {
            success: false,
            error: 'Failed to check existing videos',
            code: ServiceErrorCode.DATABASE_ERROR
          };
        }

        if (!existingVideos || existingVideos.length === 0) {
          const defaultVideos = this.getDefaultTestVideos(testDemoId);
          const { error: insertMissingVideosError } = await supabase
            .from('demo_videos')
            .insert(defaultVideos);

          if (insertMissingVideosError) {
            logError(insertMissingVideosError, 'Insert default videos for existing demo error');
            return {
              success: false,
              error: 'Failed to create test videos for existing demo',
              code: ServiceErrorCode.DATABASE_ERROR
            };
          }
        }

        return {
          success: true,
          data: { demoId: testDemoId, videosCreated: existingVideos?.length || 4 }
        };
      }

      // Create the demo
      const { data: demo, error: demoError } = await supabase
        .from('demos')
        .insert({
          id: testDemoId,
          name: demoName,
          user_id: testUserId,
          tavus_persona_id: null,
          video_storage_path: 'test-videos/',
          metadata: {
            uploadId: testDemoId,
            userId: testUserId,
            fileName: 'test-demo.json',
            fileType: 'application/json',
            fileSize: '1024',
            uploadTimestamp: new Date().toISOString(),
            agentName: 'Test Agent',
            agentPersonality: 'Helpful and knowledgeable',
            agentGreeting: 'Hello! I can help you with demo videos.'
          }
        })
        .select()
        .single();

      if (demoError) {
        logError(demoError, 'Demo creation error');
        return {
          success: false,
          error: 'Failed to create demo',
          code: ServiceErrorCode.DATABASE_ERROR
        };
      }

      // Create test videos
      const testVideos = params?.videos ? 
        params.videos.map((video, index) => ({
          demo_id: testDemoId,
          ...video,
          order_index: video.order_index || index + 1
        })) :
        this.getDefaultTestVideos(testDemoId);

      const { data: videos, error: videosError } = await supabase
        .from('demo_videos')
        .insert(testVideos)
        .select();

      if (videosError) {
        logError(videosError, 'Videos creation error');
        return {
          success: false,
          error: 'Failed to create videos',
          code: ServiceErrorCode.DATABASE_ERROR
        };
      }

      return {
        success: true,
        data: { demoId: testDemoId, videosCreated: videos?.length || 0 }
      };

    } catch (error) {
      logError(error, 'Test demo creation error');
      return {
        success: false,
        error: 'Internal error creating test demo',
        code: ServiceErrorCode.INTERNAL_ERROR
      };
    }
  }

  /**
   * Update demo persona ID
   */
  async updateDemoPersona(demoId: string, userId: string, personaId: string): Promise<ServiceResult<DemoConfig>> {
    try {
      const supabase = createServerSupabaseClient();

      const { data, error } = await supabase
        .from('demos')
        .update({ tavus_persona_id: personaId })
        .eq('id', demoId)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) {
        logError(error, 'Error updating demo persona');
        return {
          success: false,
          error: 'Failed to update demo persona',
          code: ServiceErrorCode.DATABASE_ERROR
        };
      }

      if (!data) {
        return {
          success: false,
          error: 'Demo not found',
          code: ServiceErrorCode.NOT_FOUND
        };
      }

      return {
        success: true,
        data: data as DemoConfig
      };

    } catch (error) {
      logError(error, 'Error updating demo persona');
      return {
        success: false,
        error: 'Internal error updating demo persona',
        code: ServiceErrorCode.INTERNAL_ERROR
      };
    }
  }

  /**
   * Get demo configuration
   */
  async getDemoConfig(demoId: string, userId: string): Promise<ServiceResult<DemoConfig>> {
    try {
      const supabase = createServerSupabaseClient();

      const { data: demo, error: demoError } = await supabase
        .from('demos')
        .select('*')
        .eq('id', demoId)
        .eq('user_id', userId)
        .single();

      if (demoError || !demo) {
        return {
          success: false,
          error: 'Demo not found or access denied',
          code: ServiceErrorCode.NOT_FOUND
        };
      }

      return {
        success: true,
        data: demo as DemoConfig
      };

    } catch (error) {
      logError(error, 'Error getting demo config');
      return {
        success: false,
        error: 'Internal error getting demo config',
        code: ServiceErrorCode.INTERNAL_ERROR
      };
    }
  }

  /**
   * Get knowledge base content for a demo
   */
  async getKnowledgeBase(demoId: string): Promise<ServiceResult<KnowledgeChunk[]>> {
    try {
      const supabase = createServerSupabaseClient();

      const { data: knowledgeChunks, error: knowledgeError } = await supabase
        .from('knowledge_chunks')
        .select('content, chunk_type, source')
        .eq('demo_id', demoId);

      if (knowledgeError) {
        logError(knowledgeError, 'Error fetching knowledge base');
        return {
          success: false,
          error: 'Failed to fetch knowledge base',
          code: ServiceErrorCode.DATABASE_ERROR
        };
      }

      return {
        success: true,
        data: (knowledgeChunks || []) as KnowledgeChunk[]
      };

    } catch (error) {
      logError(error, 'Error getting knowledge base');
      return {
        success: false,
        error: 'Internal error getting knowledge base',
        code: ServiceErrorCode.INTERNAL_ERROR
      };
    }
  }

  /**
   * Get demo videos
   */
  async getDemoVideos(demoId: string): Promise<ServiceResult<DemoVideo[]>> {
    try {
      const supabase = createServerSupabaseClient();

      const { data: demoVideos, error: videosError } = await supabase
        .from('demo_videos')
        .select('title, transcript, storage_url, order_index, duration_seconds')
        .eq('demo_id', demoId)
        .eq('processing_status', 'completed')
        .order('order_index');

      if (videosError) {
        logError(videosError, 'Error fetching demo videos');
        return {
          success: false,
          error: 'Failed to fetch demo videos',
          code: ServiceErrorCode.DATABASE_ERROR
        };
      }

      return {
        success: true,
        data: (demoVideos || []) as DemoVideo[]
      };

    } catch (error) {
      logError(error, 'Error getting demo videos');
      return {
        success: false,
        error: 'Internal error getting demo videos',
        code: ServiceErrorCode.INTERNAL_ERROR
      };
    }
  }

  /**
   * Get default test videos for demo creation
   */
  private getDefaultTestVideos(demoId: string) {
    return [
      {
        demo_id: demoId,
        title: 'First Video',
        storage_url: 'test-videos/first-video.mp4',
        order_index: 1,
        duration_seconds: 120
      },
      {
        demo_id: demoId,
        title: 'Second Video',
        storage_url: 'test-videos/second-video.mp4',
        order_index: 2,
        duration_seconds: 180
      },
      {
        demo_id: demoId,
        title: 'Third Video',
        storage_url: 'test-videos/third-video.mp4',
        order_index: 3,
        duration_seconds: 150
      },
      {
        demo_id: demoId,
        title: 'Fourth Video',
        storage_url: 'test-videos/fourth-video.mp4',
        order_index: 4,
        duration_seconds: 200
      }
    ];
  }

  /**
   * Get current persona status for a demo
   */
  async getCurrentPersonaStatus(demoId: string): Promise<ServiceResult<PersonaStatus>> {
    try {
      const supabase = createServerSupabaseClient();

      // Get demo configuration
      const { data: demo, error: demoError } = await supabase
        .from('demos')
        .select('*')
        .eq('id', demoId)
        .single();

      if (demoError || !demo) {
        return {
          success: false,
          error: 'Demo not found',
          code: ServiceErrorCode.NOT_FOUND
        };
      }

      // Check environment variables
      const envPersonaId = process.env.COMPLETE_PERSONA_ID;
      const envGuardrailsId = process.env.DOMO_AI_GUARDRAILS_ID;
      const envObjectivesId = process.env.DOMO_AI_OBJECTIVES_ID;

      // Get persona details from Tavus if available
      let personaDetails: PersonaDetails | undefined;
      if (demo.tavus_persona_id) {
        try {
          const TAVUS_API_KEY = process.env.TAVUS_API_KEY || '9e3a9a6a54e44edaa2e456191ba0d0f3';
          const personaResponse = await fetch(`https://tavusapi.com/v2/personas/${demo.tavus_persona_id}`, {
            headers: { 'x-api-key': TAVUS_API_KEY }
          });
          
          if (personaResponse.ok) {
            const personaData = await personaResponse.json();
            personaDetails = {
              persona_id: personaData.persona_id,
              persona_name: personaData.persona_name,
              guardrails_id: personaData.guardrails_id,
              objectives_id: personaData.objectives_id,
              created_at: personaData.created_at,
              updated_at: personaData.updated_at,
              perception_model: personaData.perception_model
            };
          }
        } catch (error) {
          logError(error, 'Error fetching persona details from Tavus');
        }
      }

      const personaStatus: PersonaStatus = {
        demo: {
          id: demo.id,
          name: demo.name,
          currentPersonaId: demo.tavus_persona_id,
          agentName: demo.agent_name,
          agentPersonality: demo.agent_personality,
          agentGreeting: demo.agent_greeting
        },
        environment: {
          personaId: envPersonaId,
          guardrailsId: envGuardrailsId,
          objectivesId: envObjectivesId
        },
        persona: personaDetails,
        status: {
          hasPersona: !!demo.tavus_persona_id,
          personaAccessible: !!personaDetails,
          matchesEnvironment: demo.tavus_persona_id === envPersonaId
        }
      };

      return {
        success: true,
        data: personaStatus
      };

    } catch (error: unknown) {
      logError(error, 'Get persona status service error');
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        code: ServiceErrorCode.INTERNAL_ERROR
      };
    }
  }

  /**
   * Get comprehensive persona information for a demo
   */
  async getPersonaInfo(demoId: string, userId: string): Promise<ServiceResult<{
    persona: any;
    demo: any;
    customObjectives: any;
    integration: any;
  }>> {
    try {
      const supabase = createServerSupabaseClient();

      // Get demo info
      const { data: demo, error: demoError } = await supabase
        .from('demos')
        .select('*')
        .eq('id', demoId)
        .eq('user_id', userId)
        .single();

      if (demoError || !demo) {
        return {
          success: false,
          error: 'Demo not found',
          code: ServiceErrorCode.NOT_FOUND
        };
      }

      // Get custom objectives
      const { getActiveCustomObjective } = await import('@/lib/supabase/custom-objectives');
      const activeCustomObjective = await getActiveCustomObjective(demoId);

      // Get Tavus persona info
      let tavusPersona = null;
      if (demo.tavus_persona_id) {
        try {
          const TAVUS_API_KEY = process.env.TAVUS_API_KEY || '9e3a9a6a54e44edaa2e456191ba0d0f3';
          const response = await fetch(`https://tavusapi.com/v2/personas/${demo.tavus_persona_id}`, {
            headers: { 'x-api-key': TAVUS_API_KEY }
          });
          
          if (response.ok) {
            tavusPersona = await response.json();
          }
        } catch (error) {
          console.log('Could not fetch Tavus persona info');
        }
      }

      const result = {
        persona: {
          id: demo.tavus_persona_id,
          name: tavusPersona?.persona_name || `${demo.agent_name} - ${demo.name}`,
          agentName: demo.agent_name,
          agentPersonality: demo.agent_personality,
          agentGreeting: demo.agent_greeting,
          createdAt: demo.metadata?.agentCreatedAt,
          systemPromptLength: tavusPersona?.system_prompt?.length || 0,
          guardrailsId: tavusPersona?.guardrails_id || demo.metadata?.guardrailsId,
          objectivesId: tavusPersona?.objectives_id || demo.metadata?.objectivesId
        },
        demo: {
          id: demo.id,
          name: demo.name,
          hasCustomObjectives: !!activeCustomObjective
        },
        customObjectives: activeCustomObjective ? {
          id: activeCustomObjective.id,
          name: activeCustomObjective.name,
          description: activeCustomObjective.description,
          steps: activeCustomObjective.objectives.length,
          tavusObjectivesId: activeCustomObjective.tavus_objectives_id,
          isActive: activeCustomObjective.is_active
        } : null,
        integration: {
          systemPrompt: !!tavusPersona?.system_prompt,
          guardrails: !!tavusPersona?.guardrails_id,
          objectives: !!tavusPersona?.objectives_id,
          customObjectivesActive: !!activeCustomObjective,
          customObjectivesMatch: activeCustomObjective?.tavus_objectives_id === tavusPersona?.objectives_id
        }
      };

      return {
        success: true,
        data: result
      };

    } catch (error: unknown) {
      logError(error, 'Get persona info service error');
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        code: ServiceErrorCode.INTERNAL_ERROR
      };
    }
  }
}

// Export singleton instance
export const demoService = new DemoService();