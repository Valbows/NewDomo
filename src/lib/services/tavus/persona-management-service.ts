/**
 * Tavus Persona Management Service
 * High-level business logic for persona operations
 */

import { PersonaService, createPersonaService } from './persona-service';
import { GuardrailsService, createGuardrailsService } from './guardrails-service';
import { ObjectivesService, createObjectivesService } from './objectives-service';
import { TavusClient, createTavusClient } from './tavus-client';
import { PersonaConfig, PersonaResponse, ServiceResult } from './types';

export class PersonaManagementService {
  private personaService: PersonaService;
  private guardrailsService: GuardrailsService;
  private objectivesService: ObjectivesService;

  constructor(client?: TavusClient) {
    const tavusClient = client || createTavusClient();
    this.personaService = createPersonaService(tavusClient);
    this.guardrailsService = createGuardrailsService(tavusClient);
    this.objectivesService = createObjectivesService(tavusClient);
  }

  /**
   * Create a complete Domo AI persona with guardrails and objectives
   */
  async createCompleteDomoAIPersona(
    config: Partial<PersonaConfig> = {}
  ): Promise<ServiceResult<PersonaResponse>> {
    try {
      console.log('🎭 Creating complete Domo AI persona...');

      // Step 1: Ensure guardrails exist
      console.log('📋 Setting up guardrails...');
      const guardrailsResult = await this.guardrailsService.ensureDomoAIGuardrails();
      if (!guardrailsResult.success) {
        return {
          success: false,
          error: `Failed to setup guardrails: ${guardrailsResult.error}`,
        };
      }

      // Step 2: Setup objectives if specified
      let objectivesId: string | undefined;
      if (config.objectives_id) {
        console.log('🎯 Validating objectives...');
        const objectivesResult = await this.objectivesService.getObjectives(config.objectives_id);
        if (!objectivesResult.success) {
          console.warn(`Objectives ${config.objectives_id} not found, continuing without...`);
        } else {
          objectivesId = config.objectives_id;
        }
      }

      // Step 3: Create persona with all components
      console.log('👤 Creating persona...');
      const personaConfig: PersonaConfig = {
        ...config,
        guardrails_id: guardrailsResult.data,
        objectives_id: objectivesId,
        perception_model: config.perception_model || 'raven-0',
      };

      const personaResult = await this.personaService.createDomoAIPersona(personaConfig);
      
      if (!personaResult.success) {
        return personaResult;
      }

      console.log(`✅ Created complete Domo AI persona: ${personaResult.data!.persona_id}`);
      console.log(`   - Guardrails: ${guardrailsResult.data}`);
      console.log(`   - Objectives: ${objectivesId || 'None'}`);
      console.log(`   - Perception: ${personaConfig.perception_model}`);

      return personaResult;
    } catch (error) {
      console.error('Error creating complete Domo AI persona:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Update persona with new objectives
   */
  async updatePersonaObjectives(
    personaId: string,
    objectivesId: string
  ): Promise<ServiceResult<PersonaResponse>> {
    try {
      console.log(`🎯 Updating persona ${personaId} with objectives ${objectivesId}`);

      // Validate objectives exist
      const objectivesResult = await this.objectivesService.getObjectives(objectivesId);
      if (!objectivesResult.success) {
        return {
          success: false,
          error: `Objectives ${objectivesId} not found`,
        };
      }

      // Update persona
      const updateResult = await this.personaService.updatePersona(personaId, {
        objectives_id: objectivesId,
      });

      if (updateResult.success) {
        console.log(`✅ Updated persona ${personaId} with objectives ${objectivesId}`);
      }

      return updateResult;
    } catch (error) {
      console.error('Error updating persona objectives:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Validate persona configuration
   */
  async validatePersonaConfiguration(personaId: string): Promise<ServiceResult<{
    hasGuardrails: boolean;
    hasObjectives: boolean;
    hasPerceptionModel: boolean;
    persona: PersonaResponse;
  }>> {
    try {
      console.log(`🔍 Validating persona configuration: ${personaId}`);

      const personaResult = await this.personaService.getPersona(personaId);
      if (!personaResult.success) {
        return {
          success: false,
          error: personaResult.error
        };
      }

      const persona = personaResult.data!;
      const hasGuardrails = !!persona.guardrails_id;
      const hasObjectives = !!persona.objectives_id;
      const hasPerceptionModel = !!(persona as any).perception_model;

      console.log(`📊 Persona ${personaId} configuration:`);
      console.log(`   - Guardrails: ${hasGuardrails ? '✅' : '❌'} ${persona.guardrails_id || 'None'}`);
      console.log(`   - Objectives: ${hasObjectives ? '✅' : '❌'} ${persona.objectives_id || 'None'}`);
      console.log(`   - Perception: ${hasPerceptionModel ? '✅' : '❌'} ${(persona as any).perception_model || 'None'}`);

      return {
        success: true,
        data: {
          hasGuardrails,
          hasObjectives,
          hasPerceptionModel,
          persona,
        },
      };
    } catch (error) {
      console.error('Error validating persona configuration:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Get persona status for demo
   */
  async getPersonaStatusForDemo(demoId: string, supabase: any): Promise<ServiceResult<{
    hasPersona: boolean;
    personaId?: string;
    personaValid: boolean;
    configuration?: any;
  }>> {
    try {
      // Get demo persona ID
      const { data: demo, error: demoError } = await supabase
        .from('demos')
        .select('tavus_persona_id')
        .eq('id', demoId)
        .single();

      if (demoError || !demo) {
        return {
          success: false,
          error: 'Demo not found',
        };
      }

      if (!demo.tavus_persona_id) {
        return {
          success: true,
          data: {
            hasPersona: false,
            personaValid: false,
          },
        };
      }

      // Validate persona configuration
      const configResult = await this.validatePersonaConfiguration(demo.tavus_persona_id);
      
      return {
        success: true,
        data: {
          hasPersona: true,
          personaId: demo.tavus_persona_id,
          personaValid: configResult.success,
          configuration: configResult.data,
        },
      };
    } catch (error) {
      console.error('Error getting persona status for demo:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Ensure persona has required components for production use
   */
  async ensurePersonaProductionReady(personaId: string): Promise<ServiceResult<PersonaResponse>> {
    try {
      console.log(`🔧 Ensuring persona ${personaId} is production ready...`);

      const configResult = await this.validatePersonaConfiguration(personaId);
      if (!configResult.success) {
        return {
          success: false,
          error: configResult.error
        };
      }

      const { hasGuardrails, persona } = configResult.data!;
      let needsUpdate = false;
      const updates: Partial<PersonaConfig> = {};

      // Ensure guardrails are attached
      if (!hasGuardrails) {
        console.log('📋 Adding guardrails to persona...');
        const guardrailsResult = await this.guardrailsService.ensureDomoAIGuardrails();
        if (!guardrailsResult.success) {
          return {
            success: false,
            error: `Failed to setup guardrails: ${guardrailsResult.error}`,
          };
        }
        updates.guardrails_id = guardrailsResult.data;
        needsUpdate = true;
      }

      // Ensure perception model is enabled
      if (!(persona as any).perception_model) {
        console.log('👁️ Enabling perception model...');
        updates.perception_model = 'raven-0';
        needsUpdate = true;
      }

      // Apply updates if needed
      if (needsUpdate) {
        const updateResult = await this.personaService.updatePersona(personaId, updates);
        if (!updateResult.success) {
          return updateResult;
        }
        console.log(`✅ Persona ${personaId} is now production ready`);
        return updateResult;
      }

      console.log(`✅ Persona ${personaId} is already production ready`);
      return {
        success: true,
        data: persona,
      };
    } catch (error) {
      console.error('Error ensuring persona is production ready:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}

/**
 * Create a new persona management service instance
 */
export function createPersonaManagementService(client?: TavusClient): PersonaManagementService {
  return new PersonaManagementService(client);
}