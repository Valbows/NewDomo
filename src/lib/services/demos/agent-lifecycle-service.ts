/**
 * Agent Lifecycle Service
 * 
 * Handles agent creation workflows, demo updates, and lifecycle management.
 */

import {ServiceResult, ServiceErrorCode} from "../types";
import {EnhancedAgentConfig, DemoConfig} from "./types";
import {logError} from "@/lib/errors";

export class AgentLifecycleService {
  readonly name = "AgentLifecycleService";

  /**
   * Update demo with enhanced configuration
   */
  async updateDemoWithEnhancedConfig(
    config: EnhancedAgentConfig,
    demo: DemoConfig,
    personaId: string,
    activeCustomObjective: any
  ): Promise<ServiceResult<void>> {
    try {
      const { createClient } = await import("@/lib/utils/supabase");
      const supabase = createClient();

      const { error: updateError } = await supabase
        .from("demos")
        .update({
          tavus_persona_id: personaId,
          agent_name: config.agentName,
          agent_personality: config.agentPersonality,
          agent_greeting: config.agentGreeting,
          metadata: {
            ...demo.metadata,
            agentName: config.agentName,
            agentPersonality: config.agentPersonality,
            agentGreeting: config.agentGreeting,
            tavusPersonaId: personaId,
            agentCreatedAt: new Date().toISOString(),
            hasCustomObjectives: !!activeCustomObjective,
            customObjectivesId: activeCustomObjective?.id || null,
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
   * Determine objectives ID for enhanced agent creation
   */
  async determineObjectivesId(demoId: string, activeCustomObjective: any): Promise<string> {

    const DEFAULT_OBJECTIVES_ID = process.env.DOMO_AI_OBJECTIVES_ID || "o4f2d4eb9b217";

    let objectivesId = DEFAULT_OBJECTIVES_ID;

    if (activeCustomObjective && activeCustomObjective.tavus_objectives_id) {
      objectivesId = activeCustomObjective.tavus_objectives_id;
    } else if (activeCustomObjective && !activeCustomObjective.tavus_objectives_id) {
      // Create new objectives in Tavus
      try {
        const { syncCustomObjectiveWithTavus } = await import(
          "@/lib/tavus/custom-objectives-integration"
        );
        const newObjectivesId = await syncCustomObjectiveWithTavus(
          activeCustomObjective.id
        );
        if (newObjectivesId) {
          objectivesId = newObjectivesId;
        }
      } catch (error) {

      }
    }

    return objectivesId;
  }

  /**
   * Get active custom objective for a demo
   */
  async getActiveCustomObjective(demoId: string): Promise<any> {
    try {
      const { getActiveCustomObjective } = await import(
        "@/lib/supabase/custom-objectives"
      );
      return await getActiveCustomObjective(demoId);
    } catch (error) {

      return null;
    }
  }

  /**
   * Build agent creation result
   */
  buildAgentCreationResult(
    personaId: string,
    demoId: string,
    systemPromptLength: number,
    activeCustomObjective: any,
    guardrailsId?: string,
    objectivesId?: string
  ) {
    const baseResult = {
      personaId,
      demoId,
      configuration: {
        systemPrompt: true,
        enhancedSystemPrompt: systemPromptLength,
      },
      personaType: "new" as const,
    };

    if (guardrailsId && objectivesId) {
      // Enhanced agent result
      return {
        ...baseResult,
        configuration: {
          ...baseResult.configuration,
          guardrails: guardrailsId,
          presetObjectives: process.env.DOMO_AI_OBJECTIVES_ID || "o4f2d4eb9b217",
          activeObjectives: objectivesId,
          customObjectives: activeCustomObjective
            ? {
                id: activeCustomObjective.id,
                name: activeCustomObjective.name,
                steps: activeCustomObjective.objectives.length,
                tavusId: activeCustomObjective.tavus_objectives_id,
              }
            : null,
        },
        message: activeCustomObjective
          ? `New persona created with custom objectives: ${activeCustomObjective.name}`
          : "New persona created with default objectives",
      };
    }

    // Basic agent result
    return {
      ...baseResult,
      message: "Persona created successfully.",
    };
  }
}

// Export singleton instance
export const agentLifecycleService = new AgentLifecycleService();