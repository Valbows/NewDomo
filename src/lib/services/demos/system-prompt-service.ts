/**
 * System Prompt Service
 *
 * Handles system prompt generation and template management.
 */

import { ServiceResult, ServiceErrorCode } from "../types";
import { AgentConfig, EnhancedAgentConfig, DemoConfig, KnowledgeChunk, DemoVideo } from "./types";
import { logError } from "@/lib/errors";
import * as fs from "fs";
import * as path from "path";

export class SystemPromptService {
  readonly name = "SystemPromptService";

  /**
   * Build system prompt for an agent
   */
  async buildSystemPrompt(
    config: AgentConfig,
    demo: DemoConfig,
    knowledgeBase: KnowledgeChunk[],
    videos: DemoVideo[]
  ): Promise<ServiceResult<string>> {
    try {
      // Load system prompt template
      const templatePath = path.join(process.cwd(), "src/lib/tavus/system_prompt.md");
      
      if (!fs.existsSync(templatePath)) {
        return {
          success: false,
          error: "System prompt template not found",
          code: ServiceErrorCode.NOT_FOUND,
        };
      }

      let systemPrompt = fs.readFileSync(templatePath, "utf-8");

      // Replace placeholders
      systemPrompt = systemPrompt
        .replace(/\{\{AGENT_NAME\}\}/g, config.agentName)
        .replace(/\{\{AGENT_PERSONALITY\}\}/g, config.agentPersonality || "professional and helpful")
        .replace(/\{\{AGENT_GREETING\}\}/g, config.agentGreeting || `Hello! I'm ${config.agentName}, how can I help you today?`)
        .replace(/\{\{DEMO_NAME\}\}/g, demo.name)
        .replace(/\{\{DEMO_DESCRIPTION\}\}/g, demo.name || "");

      // Add knowledge base context
      if (knowledgeBase.length > 0) {
        const knowledgeContext = this.buildKnowledgeContext(knowledgeBase);
        systemPrompt += `\n\n## Knowledge Base\n${knowledgeContext}`;
      }

      // Add videos context
      if (videos.length > 0) {
        const videosContext = this.buildVideosContext(videos);
        systemPrompt += `\n\n## Available Videos\n${videosContext}`;
      }

      return {
        success: true,
        data: systemPrompt,
      };
    } catch (error) {
      logError(error, "Error building system prompt");
      return {
        success: false,
        error: "Failed to build system prompt",
        code: ServiceErrorCode.INTERNAL_ERROR,
      };
    }
  }

  /**
   * Build enhanced system prompt with full configuration
   */
  async buildEnhancedSystemPrompt(
    config: EnhancedAgentConfig,
    demo: DemoConfig,
    knowledgeBase: KnowledgeChunk[],
    videos: DemoVideo[]
  ): Promise<ServiceResult<string>> {
    try {
      // Start with base system prompt
      const basePromptResult = await this.buildSystemPrompt(config, demo, knowledgeBase, videos);
      if (!basePromptResult.success) {
        return basePromptResult;
      }

      let enhancedPrompt = basePromptResult.data;

      // Add enhanced configuration sections
      if (config.customObjectivesId) {
        enhancedPrompt += `\n\n## Custom Objectives\n`;
        enhancedPrompt += `Custom objectives ID: ${config.customObjectivesId}\n`;
      }

      // Add guardrails if specified
      if (config.guardrailsId) {
        enhancedPrompt += `\n\n## Guardrails\n`;
        enhancedPrompt += `Follow the guardrails configuration (ID: ${config.guardrailsId}) to ensure appropriate conversation boundaries.\n`;
      }

      // Add objectives if specified
      if (config.objectivesId) {
        enhancedPrompt += `\n\n## Objectives\n`;
        enhancedPrompt += `Follow the objectives configuration (ID: ${config.objectivesId}) to guide conversation goals.\n`;
      }

      // CTA configuration not available in this config type

      // Add video selection strategy
      if (videos.length > 0) {
        enhancedPrompt += `\n\n## Video Selection Strategy\n`;
        enhancedPrompt += `When users express interest in specific topics, proactively suggest relevant videos from the available collection. `;
        enhancedPrompt += `Use the fetch_video function to display videos that match their interests or questions.\n`;
      }

      return {
        success: true,
        data: enhancedPrompt,
      };
    } catch (error) {
      logError(error, "Error building enhanced system prompt");
      return {
        success: false,
        error: "Failed to build enhanced system prompt",
        code: ServiceErrorCode.INTERNAL_ERROR,
      };
    }
  }

  /**
   * Build knowledge base context for system prompt
   */
  private buildKnowledgeContext(knowledgeBase: KnowledgeChunk[]): string {
    return knowledgeBase
      .map((chunk, index) => {
        let context = `### Knowledge Item ${index + 1}\n`;
        context += `**Type**: ${chunk.chunk_type}\n`;
        context += `**Source**: ${chunk.source}\n`;
        context += `**Content**: ${chunk.content}\n`;
        return context;
      })
      .join("\n");
  }

  /**
   * Build videos context for system prompt
   */
  private buildVideosContext(videos: DemoVideo[]): string {
    return videos
      .map((video, index) => {
        let context = `### Video ${index + 1}\n`;
        context += `**Title**: ${video.title}\n`;
        if (video.duration_seconds) context += `**Duration**: ${video.duration_seconds} seconds\n`;
        if (video.transcript) context += `**Transcript**: ${video.transcript}\n`;
        return context;
      })
      .join("\n");
  }
}

// Export singleton instance
export const systemPromptService = new SystemPromptService();