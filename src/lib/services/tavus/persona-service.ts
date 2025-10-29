/**
 * Tavus Persona Service
 * Business logic for persona management
 */

import { TavusClient, createTavusClient } from './tavus-client';
import { PersonaConfig, PersonaResponse, ServiceResult } from './types';
import * as fs from 'fs';
import * as path from 'path';

export class PersonaService {
  private client: TavusClient;

  constructor(client?: TavusClient) {
    this.client = client || createTavusClient();
  }

  /**
   * Create a new persona
   */
  async createPersona(config: PersonaConfig): Promise<ServiceResult<PersonaResponse>> {
    try {
      const response = await this.client.post<PersonaResponse>('/personas/', config);
      
      if (!response.data) {
        return {
          success: false,
          error: response.error || 'Failed to create persona',
        };
      }

      console.log(`✅ Created persona ${response.data.persona_id}`);
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      console.error('Error creating persona:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Get persona by ID
   */
  async getPersona(personaId: string): Promise<ServiceResult<PersonaResponse>> {
    try {
      const response = await this.client.get<PersonaResponse>(`/personas/${personaId}`);
      
      if (!response.data) {
        return {
          success: false,
          error: response.error || 'Persona not found',
        };
      }

      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      console.error('Error getting persona:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Update persona
   */
  async updatePersona(
    personaId: string, 
    updates: Partial<PersonaConfig>
  ): Promise<ServiceResult<PersonaResponse>> {
    try {
      // Use JSON Patch format for updates
      const patchOperations = Object.entries(updates).map(([key, value]) => ({
        op: 'add',
        path: `/${key}`,
        value,
      }));

      const response = await this.client.patch<PersonaResponse>(
        `/personas/${personaId}`,
        patchOperations
      );
      
      if (!response.data) {
        return {
          success: false,
          error: response.error || 'Failed to update persona',
        };
      }

      console.log(`✅ Updated persona ${personaId}`);
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      console.error('Error updating persona:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Delete persona
   */
  async deletePersona(personaId: string): Promise<ServiceResult<void>> {
    try {
      const response = await this.client.delete(`/personas/${personaId}`);
      
      if (response.status !== 200 && response.status !== 204) {
        return {
          success: false,
          error: response.error || 'Failed to delete persona',
        };
      }

      console.log(`✅ Deleted persona ${personaId}`);
      return {
        success: true,
      };
    } catch (error) {
      console.error('Error deleting persona:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Create persona with Domo AI configuration
   */
  async createDomoAIPersona(
    config: Omit<PersonaConfig, 'guardrails_id'> = {}
  ): Promise<ServiceResult<PersonaResponse>> {
    try {
      // Get or create guardrails
      const { GuardrailsService } = await import('./guardrails-service');
      const guardrailsService = new GuardrailsService(this.client);
      const guardrailsResult = await guardrailsService.ensureDomoAIGuardrails();

      if (!guardrailsResult.success) {
        return {
          success: false,
          error: `Failed to get guardrails: ${guardrailsResult.error}`,
        };
      }

      // Load system prompt if not provided
      let systemPrompt = config.system_prompt;
      if (!systemPrompt) {
        const promptPath = path.join(process.cwd(), 'src', 'lib', 'tavus', 'system_prompt.md');
        systemPrompt = fs.readFileSync(promptPath, 'utf-8');
      }

      // Create persona with guardrails and raven-0 perception analysis
      const personaConfig: PersonaConfig = {
        ...config,
        system_prompt: systemPrompt,
        guardrails_id: guardrailsResult.data,
        perception_model: 'raven-0', // Enable perception analysis by default
      };

      return await this.createPersona(personaConfig);
    } catch (error) {
      console.error('Error creating Domo AI persona:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Add guardrails to existing persona
   */
  async addGuardrailsToPersona(
    personaId: string,
    guardrailsId?: string
  ): Promise<ServiceResult<PersonaResponse>> {
    try {
      // Get guardrails ID if not provided
      if (!guardrailsId) {
        const { GuardrailsService } = await import('./guardrails-service');
        const guardrailsService = new GuardrailsService(this.client);
        const guardrailsResult = await guardrailsService.ensureDomoAIGuardrails();

        if (!guardrailsResult.success) {
          return {
            success: false,
            error: `Failed to get guardrails: ${guardrailsResult.error}`,
          };
        }

        guardrailsId = guardrailsResult.data;
      }

      return await this.updatePersona(personaId, { guardrails_id: guardrailsId });
    } catch (error) {
      console.error('Error adding guardrails to persona:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Validate that persona has guardrails attached
   */
  async validatePersonaGuardrails(personaId: string): Promise<ServiceResult<boolean>> {
    try {
      const result = await this.getPersona(personaId);
      
      if (!result.success) {
        return {
          success: false,
          error: result.error
        };
      }

      const hasGuardrails = !!result.data?.guardrails_id;
      return {
        success: true,
        data: hasGuardrails,
      };
    } catch (error) {
      console.error('Error validating persona guardrails:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}

/**
 * Create a new persona service instance
 */
export function createPersonaService(client?: TavusClient): PersonaService {
  return new PersonaService(client);
}