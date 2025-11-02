/**
 * Agent Configuration Service
 *
 * Handles agent configuration updates and management.
 */

import { ServiceResult, ServiceErrorCode } from "../types";
import { EnhancedAgentConfig, DemoConfig } from "./types";
import { supabase } from "@/lib/supabase";
import { logError } from "@/lib/errors";

export class AgentConfigurationService {
  readonly name = "AgentConfigurationService";

  /**
   * Update demo with enhanced configuration
   */
  async updateDemoWithEnhancedConfig(
    config: EnhancedAgentConfig,
    demo: DemoConfig,
    personaId: string,
    conversationId?: string,
    shareableLink?: string
  ): Promise<ServiceResult<void>> {
    try {
      // Find active custom objective if specified
      let activeCustomObjective = null;
      if (config.customObjectivesId) {
        // Use the custom objectives ID if specified
        activeCustomObjective = config.customObjectivesId;
      }

      // Update demo metadata
      const metadata = {
        ...demo.metadata,
        agentName: config.agentName,
        agentPersonality: config.agentPersonality,
        agentGreeting: config.agentGreeting,
        tavusAgentId: personaId,
        tavusPersonaId: personaId,
        tavusShareableLink: shareableLink,
        agentCreatedAt: new Date().toISOString(),
      };

      // Update demo in database
      const { error: updateError } = await supabase
        .from("demos")
        .update({
          metadata,
          tavus_conversation_id: conversationId || null,
          enhanced_config: {
            customObjectivesId: activeCustomObjective || null,
            guardrailsId: config.guardrailsId,
            objectivesId: config.objectivesId,
          },
        })
        .eq("id", config.demoId);

      if (updateError) {
        logError(updateError, "Demo update failed");
        return {
          success: false,
          error: "Failed to update demo configuration",
          code: ServiceErrorCode.DATABASE_ERROR,
        };
      }

      return { success: true, data: undefined };
    } catch (error) {
      logError(error, "Error updating demo with enhanced config");
      return {
        success: false,
        error: "Failed to update demo configuration",
        code: ServiceErrorCode.INTERNAL_ERROR,
      };
    }
  }

  /**
   * Validate agent configuration
   */
  validateAgentConfig(config: EnhancedAgentConfig): ServiceResult<void> {
    try {
      // Basic validation
      if (!config.agentName?.trim()) {
        return {
          success: false,
          error: "Agent name is required",
          code: ServiceErrorCode.VALIDATION_ERROR,
        };
      }

      if (!config.demoId?.trim()) {
        return {
          success: false,
          error: "Demo ID is required",
          code: ServiceErrorCode.VALIDATION_ERROR,
        };
      }

      // Validate custom objectives ID if provided
      if (config.customObjectivesId && typeof config.customObjectivesId !== 'string') {
        return {
          success: false,
          error: "Invalid custom objectives ID",
          code: ServiceErrorCode.VALIDATION_ERROR,
        };
      }

      return { success: true, data: undefined };
    } catch (error) {
      logError(error, "Error validating agent config");
      return {
        success: false,
        error: "Configuration validation failed",
        code: ServiceErrorCode.INTERNAL_ERROR,
      };
    }
  }

  /**
   * Validate URL format
   */
  private isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Sanitize agent configuration
   */
  sanitizeAgentConfig(config: EnhancedAgentConfig): EnhancedAgentConfig {
    return {
      ...config,
      agentName: config.agentName?.trim() || '',
      agentPersonality: config.agentPersonality?.trim() || '',
      agentGreeting: config.agentGreeting?.trim() || '',
    };
  }
}

// Export singleton instance
export const agentConfigurationService = new AgentConfigurationService();