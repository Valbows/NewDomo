/**
 * Agent Service Implementation
 *
 * Orchestrates agent creation and management using specialized services.
 */

import { ServiceResult, ServiceErrorCode } from "../types";
import {
  IAgentService,
  AgentConfig,
  EnhancedAgentConfig,
  AgentCreationResult,
} from "./types";
import { DemoService } from "./demo-service";
import { PersonaManagementService } from "./persona-management-service";
import { SystemPromptService } from "./system-prompt-service";
import { AgentConfigurationService } from "./agent-configuration-service";
import { logError } from "@/lib/errors";
import { getWebhookUrl } from "@/lib/tavus/webhook-objectives";

export class AgentService implements IAgentService {
  readonly name = "AgentService";
  
  private demoService = new DemoService();
  private personaService = new PersonaManagementService();
  private promptService = new SystemPromptService();
  private configService = new AgentConfigurationService();

  /**
   * Create a basic agent for a demo
   */
  async createAgent(
    config: AgentConfig,
    userId: string
  ): Promise<ServiceResult<AgentCreationResult>> {
    try {
      // Get demo configuration
      const demoResult = await this.demoService.getDemoConfig(config.demoId, userId);
      if (!demoResult.success) {
        return demoResult;
      }
      const demo = demoResult.data;

      // Get knowledge base and videos
      const [knowledgeResult, videosResult] = await Promise.all([
        this.demoService.getKnowledgeBase(config.demoId),
        this.demoService.getDemoVideos(config.demoId),
      ]);

      const knowledgeBase = knowledgeResult.success ? knowledgeResult.data : [];
      const videos = videosResult.success ? videosResult.data : [];

      // Build system prompt
      const systemPromptResult = await this.promptService.buildSystemPrompt(
        config,
        demo,
        knowledgeBase,
        videos
      );
      if (!systemPromptResult.success) {
        return systemPromptResult;
      }

      // Create Tavus persona
      const personaResult = await this.personaService.createTavusPersona({
        agentName: config.agentName,
        systemPrompt: systemPromptResult.data,
        videos,
        demo,
      });

      if (!personaResult.success) {
        return personaResult;
      }

      // Update demo with persona ID
      const updateResult = await this.demoService.updateDemoPersona(
        config.demoId,
        userId,
        personaResult.data.personaId
      );
      if (!updateResult.success) {
        return {
          success: false,
          error: "Failed to update demo with persona ID",
          code: ServiceErrorCode.DATABASE_ERROR,
        };
      }

      return {
        success: true,
        data: {
          personaId: personaResult.data.personaId,
          demoId: config.demoId,
          configuration: {
            systemPrompt: true,
            enhancedSystemPrompt: systemPromptResult.data.length,
          },
          message: "Persona created successfully.",
          personaType: "new",
        },
      };
    } catch (error) {
      logError(error, "Error creating agent");
      return {
        success: false,
        error: "Failed to create agent",
        code: ServiceErrorCode.INTERNAL_ERROR,
      };
    }
  }

  /**
   * Create an enhanced agent with full configuration
   */
  async createEnhancedAgent(
    config: EnhancedAgentConfig,
    userId: string
  ): Promise<ServiceResult<AgentCreationResult>> {
    try {
      // Validate and sanitize configuration
      const sanitizedConfig = this.configService.sanitizeAgentConfig(config);
      const validationResult = this.configService.validateAgentConfig(sanitizedConfig);
      if (!validationResult.success) {
        return validationResult;
      }

      // Get demo configuration
      const demoResult = await this.demoService.getDemoConfig(sanitizedConfig.demoId, userId);
      if (!demoResult.success) {
        return demoResult;
      }
      const demo = demoResult.data;

      // Get knowledge base and videos
      const [knowledgeResult, videosResult] = await Promise.all([
        this.demoService.getKnowledgeBase(sanitizedConfig.demoId),
        this.demoService.getDemoVideos(sanitizedConfig.demoId),
      ]);

      const knowledgeBase = knowledgeResult.success ? knowledgeResult.data : [];
      const videos = videosResult.success ? videosResult.data : [];

      // Build enhanced system prompt
      const systemPromptResult = await this.promptService.buildEnhancedSystemPrompt(
        sanitizedConfig,
        demo,
        knowledgeBase,
        videos
      );
      if (!systemPromptResult.success) {
        return systemPromptResult;
      }

      // Get webhook URL for objectives
      const webhookUrl = await getWebhookUrl();
      if (!webhookUrl) {
        return {
          success: false,
          error: "Failed to get webhook URL",
          code: ServiceErrorCode.VALIDATION_ERROR,
        };
      }

      // Create enhanced Tavus persona
      const allowedTitles = videos.map(v => v.title);
      const personaResult = await this.personaService.createEnhancedTavusPersona({
        agentName: sanitizedConfig.agentName,
        systemPrompt: systemPromptResult.data,
        videos,
        demo,
        allowedTitles,
        webhookUrl,
      });

      if (!personaResult.success) {
        return personaResult;
      }

      // Update demo with enhanced configuration
      const updateResult = await this.configService.updateDemoWithEnhancedConfig(
        sanitizedConfig,
        demo,
        personaResult.data.personaId,
        personaResult.data.conversationId,
        personaResult.data.shareableLink
      );

      if (!updateResult.success) {
        return updateResult;
      }

      return {
        success: true,
        data: {
          personaId: personaResult.data.personaId,
          demoId: sanitizedConfig.demoId,
          configuration: {
            systemPrompt: true,
            enhancedSystemPrompt: systemPromptResult.data.length,
            customObjectives: sanitizedConfig.customObjectivesId ? { 
              id: sanitizedConfig.customObjectivesId, 
              name: 'Custom Objectives', 
              steps: 1 
            } : null,
            guardrails: sanitizedConfig.guardrailsId || undefined,
            presetObjectives: sanitizedConfig.objectivesId || undefined
          },
          message: "Enhanced agent created successfully with full configuration.",
          personaType: "new",
        },
      };
    } catch (error) {
      logError(error, "Error creating enhanced agent");
      return {
        success: false,
        error: "Failed to create enhanced agent",
        code: ServiceErrorCode.INTERNAL_ERROR,
      };
    }
  }

  /**
   * Build system prompt for an agent (delegated to SystemPromptService)
   */
  async buildSystemPrompt(
    config: AgentConfig,
    demo: any,
    knowledgeBase: any[],
    videos: any[]
  ): Promise<ServiceResult<string>> {
    return this.promptService.buildSystemPrompt(config, demo, knowledgeBase, videos);
  }
}

// Export singleton instance
export const agentService = new AgentService();