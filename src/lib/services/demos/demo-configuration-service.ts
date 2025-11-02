/**
 * Demo Configuration Service
 * 
 * Handles demo configuration, persona status, and metadata management.
 */

import {createServerSupabaseClient} from '@/lib/utils/supabase';
import {ServiceResult, ServiceErrorCode} from '../types';
import {DemoConfig, PersonaStatus, PersonaDetails} from './types';
import {logError} from '@/lib/errors';

export class DemoConfigurationService {
  readonly name = 'DemoConfigurationService';

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
export const demoConfigurationService = new DemoConfigurationService();