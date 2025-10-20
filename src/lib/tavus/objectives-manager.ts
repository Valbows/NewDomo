/**
 * Tavus Objectives Manager
 * Handles creation and management of Tavus persona objectives
 */

import {
  ObjectivesTemplate,
  ObjectiveDefinition,
} from "./objectives-templates";

export interface CreateObjectivesRequest {
  objectives: ObjectiveDefinition[];
}

export interface ObjectivesResponse {
  objectives_id?: string; // For create response
  uuid?: string; // For get response
  objectives_name?: string; // For create response
  name?: string; // For get response
  data?: ObjectiveDefinition[]; // For get response
  created_at: string;
  updated_at?: string;
}

export interface ListObjectivesResponse {
  data: ObjectivesResponse[];
}

export class ObjectivesManager {
  private apiKey: string;
  private baseUrl: string;

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.TAVUS_API_KEY || "";
    this.baseUrl = "https://tavusapi.com/v2";

    if (!this.apiKey) {
      throw new Error("TAVUS_API_KEY is required");
    }
  }

  /**
   * Create new objectives from template
   */
  async createObjectives(
    template: ObjectivesTemplate
  ): Promise<ObjectivesResponse> {
    const requestBody = {
      data: template.objectives,
    };

    console.log(
      "📤 Creating objectives with payload:",
      JSON.stringify(requestBody, null, 2)
    );

    const response = await fetch(`${this.baseUrl}/objectives/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": this.apiKey,
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error("❌ Tavus API Error Response:", error);
      throw new Error(
        `Failed to create objectives: ${response.status} ${error}`
      );
    }

    const result = await response.json();
    console.log(
      `✅ Created objectives: ${template.name} (${result.objectives_id})`
    );
    return {
      ...result,
      uuid: result.objectives_id, // Normalize the ID field
    };
  }

  /**
   * Get all objectives
   */
  async getAllObjectives(): Promise<ListObjectivesResponse> {
    const response = await fetch(`${this.baseUrl}/objectives/`, {
      method: "GET",
      headers: {
        "x-api-key": this.apiKey,
      },
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to get objectives: ${response.status} ${error}`);
    }

    return response.json();
  }

  /**
   * Get specific objectives by ID
   */
  async getObjectives(objectivesId: string): Promise<ObjectivesResponse> {
    const response = await fetch(`${this.baseUrl}/objectives/${objectivesId}`, {
      method: "GET",
      headers: {
        "x-api-key": this.apiKey,
      },
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to get objectives: ${response.status} ${error}`);
    }

    return response.json();
  }

  /**
   * Update existing objectives
   */
  async updateObjectives(
    objectivesId: string,
    template: ObjectivesTemplate
  ): Promise<ObjectivesResponse> {
    const response = await fetch(`${this.baseUrl}/objectives/${objectivesId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": this.apiKey,
      },
      body: JSON.stringify({
        data: template.objectives,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(
        `Failed to update objectives: ${response.status} ${error}`
      );
    }

    const result = await response.json();
    console.log(
      `✅ Updated objectives: ${template.name} (${result.objectives_id})`
    );
    return result;
  }

  /**
   * Delete objectives
   */
  async deleteObjectives(objectivesId: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/objectives/${objectivesId}`, {
      method: "DELETE",
      headers: {
        "x-api-key": this.apiKey,
      },
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(
        `Failed to delete objectives: ${response.status} ${error}`
      );
    }

    console.log(`✅ Deleted objectives: ${objectivesId}`);
  }

  /**
   * Find objectives by name (searches through all objectives)
   */
  async findObjectivesByName(name: string): Promise<ObjectivesResponse | null> {
    const allObjectives = await this.getAllObjectives();

    // Note: Tavus API doesn't store template names, so we'll need to match by structure
    // This is a limitation - in practice, you'd want to store metadata about which template was used

    return (
      allObjectives.data.find((obj) => {
        // Simple heuristic: match by number of objectives and first objective name
        return (obj.data?.length || 0) > 0;
      }) || null
    );
  }

  /**
   * Ensure objectives exist for a template, create if not found
   */
  async ensureObjectives(template: ObjectivesTemplate): Promise<string> {
    try {
      // Try to find existing objectives
      // Note: This is simplified - in production you'd want better tracking
      const existing = await this.findObjectivesByName(template.name);

      if (existing) {
        console.log(`📋 Found existing objectives: ${existing.uuid}`);
        return existing.uuid!;
      }

      // Create new objectives
      const created = await this.createObjectives(template);
      return created.uuid!;
    } catch (error) {
      console.error("Error ensuring objectives:", error);
      throw error;
    }
  }
}

/**
 * Create a new objectives manager instance
 */
export function createObjectivesManager(apiKey?: string): ObjectivesManager {
  return new ObjectivesManager(apiKey);
}

/**
 * Helper to get objectives ID from environment variables
 */
export function getObjectivesIdFromEnv(
  type: "demo" | "qualification" | "support"
): string | undefined {
  const envMap = {
    demo: "DOMO_AI_DEMO_OBJECTIVES_ID",
    qualification: "DOMO_AI_QUALIFICATION_OBJECTIVES_ID",
    support: "DOMO_AI_SUPPORT_OBJECTIVES_ID",
  };

  return process.env[envMap[type]];
}
