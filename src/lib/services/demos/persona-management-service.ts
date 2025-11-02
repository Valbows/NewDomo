/**
 * Persona Management Service
 *
 * Handles Tavus persona creation and configuration.
 */

import { ServiceResult, ServiceErrorCode } from "../types";
import { DemoConfig, DemoVideo } from "./types";
import { logError } from "@/lib/errors";
import { getWebhookUrl } from "@/lib/tavus/webhook-objectives";

export interface PersonaCreationParams {
  agentName: string;
  systemPrompt: string;
  videos: DemoVideo[];
  demo: DemoConfig;
}

export interface EnhancedPersonaCreationParams extends PersonaCreationParams {
  allowedTitles: string[];
  webhookUrl?: string;
}

export interface PersonaCreationResult {
  personaId: string;
  conversationId?: string;
  shareableLink?: string;
}

export class PersonaManagementService {
  readonly name = "PersonaManagementService";

  /**
   * Create basic Tavus persona
   */
  async createTavusPersona(params: PersonaCreationParams): Promise<ServiceResult<PersonaCreationResult>> {
    try {
      const { agentName, systemPrompt, videos, demo } = params;

      // Get webhook URL for objectives
      const webhookUrl = await getWebhookUrl();
      if (!webhookUrl) {
        return {
          success: false,
          error: "Failed to get webhook URL",
          code: ServiceErrorCode.VALIDATION_ERROR,
        };
      }

      // Build tools for video fetching
      const allowedTitles = videos.map(v => v.title);
      const tools = this.buildTavusTools(allowedTitles);

      // Create persona via Tavus API
      const personaResponse = await fetch("/api/tavus/create-persona", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          persona_name: agentName,
          system_prompt: systemPrompt,
          tools,
          webhook_url: webhookUrl,
        }),
      });

      if (!personaResponse.ok) {
        const errorText = await personaResponse.text();
        logError(new Error(errorText), "Tavus persona creation failed");
        return {
          success: false,
          error: "Failed to create Tavus persona",
          code: ServiceErrorCode.EXTERNAL_API_ERROR,
        };
      }

      const personaData = await personaResponse.json();
      return {
        success: true,
        data: {
          personaId: personaData.persona_id,
        },
      };
    } catch (error) {
      logError(error, "Error creating Tavus persona");
      return {
        success: false,
        error: "Failed to create persona",
        code: ServiceErrorCode.INTERNAL_ERROR,
      };
    }
  }

  /**
   * Create enhanced Tavus persona with full configuration
   */
  async createEnhancedTavusPersona(params: EnhancedPersonaCreationParams): Promise<ServiceResult<PersonaCreationResult>> {
    try {
      const { agentName, systemPrompt, videos, demo, allowedTitles, webhookUrl } = params;

      // Build tools for video fetching
      const tools = this.buildTavusTools(allowedTitles);

      // Create persona via Tavus API
      const personaResponse = await fetch("/api/tavus/create-persona", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          persona_name: agentName,
          system_prompt: systemPrompt,
          tools,
          webhook_url: webhookUrl,
        }),
      });

      if (!personaResponse.ok) {
        const errorText = await personaResponse.text();
        logError(new Error(errorText), "Enhanced Tavus persona creation failed");
        return {
          success: false,
          error: "Failed to create enhanced Tavus persona",
          code: ServiceErrorCode.EXTERNAL_API_ERROR,
        };
      }

      const personaData = await personaResponse.json();

      // Create conversation
      const conversationResponse = await fetch("/api/tavus/create-conversation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          persona_id: personaData.persona_id,
          conversation_name: `${demo.name} - Enhanced Agent`,
        }),
      });

      if (!conversationResponse.ok) {
        const errorText = await conversationResponse.text();
        logError(new Error(errorText), "Tavus conversation creation failed");
        return {
          success: false,
          error: "Failed to create Tavus conversation",
          code: ServiceErrorCode.EXTERNAL_API_ERROR,
        };
      }

      const conversationData = await conversationResponse.json();

      return {
        success: true,
        data: {
          personaId: personaData.persona_id,
          conversationId: conversationData.conversation_id,
          shareableLink: conversationData.conversation_url,
        },
      };
    } catch (error) {
      logError(error, "Error creating enhanced Tavus persona");
      return {
        success: false,
        error: "Failed to create enhanced persona",
        code: ServiceErrorCode.INTERNAL_ERROR,
      };
    }
  }

  /**
   * Build Tavus tools configuration for video fetching
   */
  private buildTavusTools(allowedTitles: string[]): any[] {
    return [
      {
        type: "function",
        function: {
          name: "fetch_video",
          description: "Fetch and display a specific video to the user based on their request or interest",
          parameters: {
            type: "object",
            properties: {
              title: {
                type: "string",
                description: "The exact title of the video to fetch and display",
                enum: allowedTitles,
              },
            },
            required: ["title"],
          },
        },
      },
    ];
  }
}

// Export singleton instance
export const personaManagementService = new PersonaManagementService();