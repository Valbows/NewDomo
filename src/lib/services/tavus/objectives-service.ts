/**
 * Tavus Objectives Service
 * Business logic for objectives management
 */

import { TavusClient, createTavusClient } from './tavus-client';
import { 
  ObjectivesTemplate, 
  ObjectivesResponse, 
  ListObjectivesResponse, 
  ServiceResult,
  ObjectiveDefinition 
} from './types';

export class ObjectivesService {
  private client: TavusClient;

  constructor(client?: TavusClient) {
    this.client = client || createTavusClient();
  }

  /**
   * Create new objectives from template
   */
  async createObjectives(template: ObjectivesTemplate): Promise<ServiceResult<ObjectivesResponse>> {
    try {
      const requestBody = {
        data: template.objectives,
      };

      console.log('📤 Creating objectives with payload:', JSON.stringify(requestBody, null, 2));

      const response = await this.client.post<ObjectivesResponse>('/objectives/', requestBody);
      
      if (!response.data) {
        return {
          success: false,
          error: response.error || 'Failed to create objectives',
        };
      }

      // Normalize the ID field
      const result = {
        ...response.data,
        uuid: response.data.objectives_id || response.data.uuid,
      };

      console.log(`✅ Created objectives: ${template.name} (${result.uuid})`);
      return {
        success: true,
        data: result,
      };
    } catch (error) {
      console.error('Error creating objectives:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Get all objectives
   */
  async getAllObjectives(): Promise<ServiceResult<ListObjectivesResponse>> {
    try {
      const response = await this.client.get<ListObjectivesResponse>('/objectives/');
      
      if (!response.data) {
        return {
          success: false,
          error: response.error || 'Failed to get objectives',
        };
      }

      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      console.error('Error getting all objectives:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Get specific objectives by ID
   */
  async getObjectives(objectivesId: string): Promise<ServiceResult<ObjectivesResponse>> {
    try {
      const response = await this.client.get<ObjectivesResponse>(`/objectives/${objectivesId}`);
      
      if (!response.data) {
        return {
          success: false,
          error: response.error || 'Objectives not found',
        };
      }

      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      console.error('Error getting objectives:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Update existing objectives
   */
  async updateObjectives(
    objectivesId: string,
    template: ObjectivesTemplate
  ): Promise<ServiceResult<ObjectivesResponse>> {
    try {
      const requestBody = {
        data: template.objectives,
      };

      const response = await this.client.put<ObjectivesResponse>(
        `/objectives/${objectivesId}`,
        requestBody
      );
      
      if (!response.data) {
        return {
          success: false,
          error: response.error || 'Failed to update objectives',
        };
      }

      console.log(`✅ Updated objectives: ${template.name} (${objectivesId})`);
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      console.error('Error updating objectives:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Delete objectives
   */
  async deleteObjectives(objectivesId: string): Promise<ServiceResult<void>> {
    try {
      const response = await this.client.delete(`/objectives/${objectivesId}`);
      
      if (response.status !== 200 && response.status !== 204) {
        return {
          success: false,
          error: response.error || 'Failed to delete objectives',
        };
      }

      console.log(`✅ Deleted objectives: ${objectivesId}`);
      return {
        success: true,
      };
    } catch (error) {
      console.error('Error deleting objectives:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Find objectives by name
   */
  async findObjectivesByName(name: string): Promise<ServiceResult<ObjectivesResponse | null>> {
    try {
      const allResult = await this.getAllObjectives();
      
      if (!allResult.success) {
        return {
          success: false,
          error: allResult.error
        };
      }

      // Simple heuristic: match by number of objectives and first objective name
      const found = allResult.data!.data.find((obj) => {
        return (obj.data?.length || 0) > 0;
      }) || null;

      return {
        success: true,
        data: found,
      };
    } catch (error) {
      console.error('Error finding objectives by name:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Ensure objectives exist for a template, create if not found
   */
  async ensureObjectives(template: ObjectivesTemplate): Promise<ServiceResult<string>> {
    try {
      // Try to find existing objectives
      const existingResult = await this.findObjectivesByName(template.name);
      
      if (!existingResult.success) {
        return {
          success: false,
          error: existingResult.error
        };
      }

      if (existingResult.data) {
        const objectivesId = existingResult.data.uuid || existingResult.data.objectives_id;
        if (objectivesId) {
          console.log(`📋 Found existing objectives: ${objectivesId}`);
          return {
            success: true,
            data: objectivesId,
          };
        }
      }

      // Create new objectives
      const createResult = await this.createObjectives(template);
      
      if (!createResult.success) {
        return {
          success: false,
          error: createResult.error
        };
      }

      const objectivesId = createResult.data!.uuid || createResult.data!.objectives_id;
      if (!objectivesId) {
        return {
          success: false,
          error: 'Created objectives but no ID returned',
        };
      }

      return {
        success: true,
        data: objectivesId,
      };
    } catch (error) {
      console.error('Error ensuring objectives:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Validate custom objectives structure
   */
  validateObjectives(objectives: ObjectiveDefinition[]): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!Array.isArray(objectives) || objectives.length === 0) {
      errors.push('At least one objective is required');
      return { valid: false, errors };
    }

    objectives.forEach((obj, index) => {
      if (!obj.objective_name || typeof obj.objective_name !== 'string') {
        errors.push(`Objective ${index + 1}: Name is required`);
      }

      if (!obj.objective_prompt || typeof obj.objective_prompt !== 'string') {
        errors.push(`Objective ${index + 1}: Prompt is required`);
      }

      if (!['auto', 'manual'].includes(obj.confirmation_mode)) {
        errors.push(`Objective ${index + 1}: Invalid confirmation mode`);
      }

      if (!['verbal', 'visual'].includes(obj.modality)) {
        errors.push(`Objective ${index + 1}: Invalid modality`);
      }

      if (obj.output_variables && !Array.isArray(obj.output_variables)) {
        errors.push(`Objective ${index + 1}: Output variables must be an array`);
      }
    });

    return { valid: errors.length === 0, errors };
  }

  /**
   * Add webhook URLs to objectives
   */
  addWebhookUrls(objectives: ObjectiveDefinition[], webhookUrl?: string): ObjectiveDefinition[] {
    const baseUrl = webhookUrl || this.getDefaultWebhookUrl();
    
    return objectives.map((obj) => {
      const needsWebhook = obj.objective_name?.toLowerCase().includes('product_interest') ||
                          obj.objective_name?.toLowerCase().includes('contact') ||
                          obj.objective_name?.toLowerCase().includes('qualification') ||
                          obj.objective_name?.toLowerCase().includes('showcase');
      
      if (needsWebhook) {
        return { ...obj, callback_url: baseUrl };
      }
      return obj;
    });
  }

  /**
   * Get default webhook URL
   */
  private getDefaultWebhookUrl(): string {
    const baseUrl = (process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000').replace(/\/$/, '');
    const urlToken = (process.env.TAVUS_WEBHOOK_TOKEN || '').trim();
    return `${baseUrl}/api/tavus/webhook${urlToken ? `?t=${encodeURIComponent(urlToken)}` : ''}`;
  }
}

/**
 * Create a new objectives service instance
 */
export function createObjectivesService(client?: TavusClient): ObjectivesService {
  return new ObjectivesService(client);
}