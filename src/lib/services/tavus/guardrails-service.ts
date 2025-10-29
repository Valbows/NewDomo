/**
 * Tavus Guardrails Service
 * Business logic for guardrails management
 */

import { TavusClient, createTavusClient } from './tavus-client';
import { 
  GuardrailTemplate, 
  GuardrailsResponse, 
  GuardrailsListResponse, 
  ServiceResult 
} from './types';

export class GuardrailsService {
  private client: TavusClient;

  constructor(client?: TavusClient) {
    this.client = client || createTavusClient();
  }

  /**
   * Create guardrails from template
   */
  async createGuardrails(template: GuardrailTemplate): Promise<ServiceResult<GuardrailsResponse>> {
    try {
      const response = await this.client.post<GuardrailsResponse>('/guardrails', template);
      
      if (!response.data) {
        return {
          success: false,
          error: response.error || 'Failed to create guardrails',
        };
      }

      console.log(`✅ Created guardrails: ${response.data.name}`);
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      console.error('Error creating guardrails:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Get all guardrails
   */
  async getAllGuardrails(): Promise<ServiceResult<GuardrailsListResponse>> {
    try {
      const response = await this.client.get<GuardrailsListResponse>('/guardrails');
      
      if (!response.data) {
        return {
          success: false,
          error: response.error || 'Failed to get guardrails',
        };
      }

      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      console.error('Error getting all guardrails:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Get specific guardrails by ID
   */
  async getGuardrails(guardrailsId: string): Promise<ServiceResult<GuardrailsResponse>> {
    try {
      const response = await this.client.get<GuardrailsResponse>(`/guardrails/${guardrailsId}`);
      
      if (!response.data) {
        return {
          success: false,
          error: response.error || 'Guardrails not found',
        };
      }

      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      console.error('Error getting guardrails:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Update guardrails
   */
  async updateGuardrails(
    guardrailsId: string,
    template: GuardrailTemplate
  ): Promise<ServiceResult<GuardrailsResponse>> {
    try {
      const response = await this.client.patch<GuardrailsResponse>(
        `/guardrails/${guardrailsId}`,
        template
      );
      
      if (!response.data) {
        return {
          success: false,
          error: response.error || 'Failed to update guardrails',
        };
      }

      console.log(`✅ Updated guardrails: ${template.name}`);
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      console.error('Error updating guardrails:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Delete guardrails
   */
  async deleteGuardrails(guardrailsId: string): Promise<ServiceResult<void>> {
    try {
      const response = await this.client.delete(`/guardrails/${guardrailsId}`);
      
      if (response.status !== 200 && response.status !== 204) {
        return {
          success: false,
          error: response.error || 'Failed to delete guardrails',
        };
      }

      console.log(`✅ Deleted guardrails: ${guardrailsId}`);
      return {
        success: true,
      };
    } catch (error) {
      console.error('Error deleting guardrails:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Find guardrails by name
   */
  async findGuardrailsByName(name: string): Promise<ServiceResult<GuardrailsResponse | null>> {
    try {
      const allResult = await this.getAllGuardrails();
      
      if (!allResult.success) {
        return {
          success: false,
          error: allResult.error,
        };
      }

      const found = allResult.data!.data.find(g => g.name === name) || null;
      
      return {
        success: true,
        data: found,
      };
    } catch (error) {
      console.error('Error finding guardrails by name:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Create or get existing guardrails for Domo AI
   */
  async ensureDomoAIGuardrails(): Promise<ServiceResult<string>> {
    try {
      // Import the template dynamically to avoid circular dependencies
      const { ALL_GUARDRAIL_TEMPLATES } = await import('../../tavus/guardrails-templates');
      
      // Check if guardrails already exist
      const existingResult = await this.findGuardrailsByName(
        ALL_GUARDRAIL_TEMPLATES.DOMO_AI_GUARDRAILS.name
      );
      
      if (!existingResult.success) {
        return {
          success: false,
          error: existingResult.error,
        };
      }

      if (existingResult.data) {
        console.log(`Found existing guardrails: ${existingResult.data.uuid}`);
        console.log('Deleting old guardrails to create updated version...');
        
        // Delete existing guardrails
        const deleteResult = await this.deleteGuardrails(existingResult.data.uuid!);
        if (!deleteResult.success) {
          console.warn('Failed to delete old guardrails, continuing with creation...');
        } else {
          console.log('Old guardrails deleted successfully');
        }
      }

      // Create new guardrails with latest template
      console.log('Creating new Domo AI guardrails with updated rules...');
      const createResult = await this.createGuardrails(ALL_GUARDRAIL_TEMPLATES.DOMO_AI_GUARDRAILS);
      
      if (!createResult.success) {
        return {
          success: false,
          error: createResult.error
        };
      }

      // The create API returns guardrails_id, not uuid
      const guardrailsId = createResult.data!.guardrails_id || createResult.data!.uuid;
      if (!guardrailsId) {
        return {
          success: false,
          error: 'Created guardrails but no ID returned',
        };
      }

      console.log(`Created guardrails: ${guardrailsId}`);
      return {
        success: true,
        data: guardrailsId,
      };
    } catch (error) {
      console.error('Error ensuring Domo AI guardrails:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}

/**
 * Create a new guardrails service instance
 */
export function createGuardrailsService(client?: TavusClient): GuardrailsService {
  return new GuardrailsService(client);
}