/**
 * Tavus Guardrails Manager
 * Handles creation, management, and reuse of guardrails
 */

import { GuardrailTemplate, ALL_GUARDRAIL_TEMPLATES } from './guardrails-templates';

export interface GuardrailsResponse {
  uuid: string;
  owner_id: number;
  name: string;
  data: Array<{
    guardrail_name: string;
    guardrail_prompt: string;
    modality: string;
    callback_url: string;
  }>;
  created_at: string;
  updated_at: string;
  is_deleted: boolean;
}

export interface GuardrailsListResponse {
  data: GuardrailsResponse[];
  total_count: number;
}

export class GuardrailsManager {
  private apiKey: string;
  private baseUrl = 'https://tavusapi.com/v2';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  /**
   * Create guardrails from a template
   */
  async createGuardrails(template: GuardrailTemplate): Promise<GuardrailsResponse> {
    const response = await fetch(`${this.baseUrl}/guardrails`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.apiKey
      },
      body: JSON.stringify(template)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('API Error Response:', errorText);
      throw new Error(`Failed to create guardrails: ${response.statusText} - ${errorText}`);
    }

    const result = await response.json();
    // The create response returns the created guardrail directly, not in a data array
    return result;
  }

  /**
   * Get all guardrails
   */
  async getAllGuardrails(): Promise<GuardrailsListResponse> {
    const response = await fetch(`${this.baseUrl}/guardrails`, {
      method: 'GET',
      headers: {
        'x-api-key': this.apiKey
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('API Error Response:', errorText);
      throw new Error(`Failed to get guardrails: ${response.statusText} - ${errorText}`);
    }

    return response.json();
  }

  /**
   * Get specific guardrails by ID
   */
  async getGuardrails(guardrailsId: string): Promise<GuardrailsResponse> {
    const response = await fetch(`${this.baseUrl}/guardrails/${guardrailsId}`, {
      method: 'GET',
      headers: {
        'x-api-key': this.apiKey
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to get guardrails: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Update guardrails
   */
  async updateGuardrails(guardrailsId: string, template: GuardrailTemplate): Promise<GuardrailsResponse> {
    const response = await fetch(`${this.baseUrl}/guardrails/${guardrailsId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.apiKey
      },
      body: JSON.stringify(template)
    });

    if (!response.ok) {
      throw new Error(`Failed to update guardrails: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Delete guardrails
   */
  async deleteGuardrails(guardrailsId: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/guardrails/${guardrailsId}`, {
      method: 'DELETE',
      headers: {
        'x-api-key': this.apiKey
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to delete guardrails: ${response.statusText}`);
    }
  }

  /**
   * Find guardrails by name
   */
  async findGuardrailsByName(name: string): Promise<GuardrailsResponse | null> {
    const allGuardrails = await this.getAllGuardrails();
    return allGuardrails.data.find(g => g.name === name) || null;
  }

  /**
   * Create or get existing guardrails for Domo AI
   */
  async ensureDomoAIGuardrails(): Promise<string> {
    // Check if guardrails already exist
    const existing = await this.findGuardrailsByName(ALL_GUARDRAIL_TEMPLATES.DOMO_AI_GUARDRAILS.name);
    
    if (existing) {
      console.log(`Using existing guardrails: ${existing.uuid}`);
      return existing.uuid;
    }

    // Create new guardrails
    console.log('Creating new Domo AI guardrails...');
    const created = await this.createGuardrails(ALL_GUARDRAIL_TEMPLATES.DOMO_AI_GUARDRAILS);
    console.log(`Created guardrails: ${created.uuid}`);
    
    return created.uuid;
  }
}

// Utility function to create manager instance
export function createGuardrailsManager(): GuardrailsManager {
  const apiKey = process.env.TAVUS_API_KEY;
  if (!apiKey) {
    throw new Error('TAVUS_API_KEY environment variable is required');
  }
  return new GuardrailsManager(apiKey);
}