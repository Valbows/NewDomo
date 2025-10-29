/**
 * Agent Service Implementation
 *
 * Handles agent creation, configuration, and system prompt generation.
 */

import { ServiceResult, ServiceErrorCode } from "../types";
import {
  IAgentService,
  AgentConfig,
  EnhancedAgentConfig,
  AgentCreationResult,
  DemoConfig,
  KnowledgeChunk,
  DemoVideo,
} from "./types";
import { DemoService } from "./demo-service";
import { logError } from "@/lib/errors";
import { getWebhookUrl } from "@/lib/tavus/webhook-objectives";
import * as fs from "fs";
import * as path from "path";

export class AgentService implements IAgentService {
  readonly name = "AgentService";
  private demoService = new DemoService();

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
      const systemPromptResult = await this.buildSystemPrompt(
        config,
        demo,
        knowledgeBase,
        videos
      );
      if (!systemPromptResult.success) {
        return systemPromptResult;
      }

      // Create Tavus persona
      const personaResult = await this.createTavusPersona({
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
      logError(error, "Agent Creation Error");
      return {
        success: false,
        error: "Internal error creating agent",
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
      // Get demo configuration
      const demoResult = await this.demoService.getDemoConfig(config.demoId, userId);
      if (!demoResult.success) {
        return demoResult;
      }
      const demo = demoResult.data;

      // Check for active custom objectives
      let activeCustomObjective = null;
      try {
        const { getActiveCustomObjective } = await import(
          "@/lib/supabase/custom-objectives"
        );
        activeCustomObjective = await getActiveCustomObjective(config.demoId);
      } catch (error) {
        console.log("⚠️  Error checking custom objectives:", error);
      }

      // Build enhanced system prompt
      const enhancedPromptResult = await this.buildEnhancedSystemPrompt(
        config,
        demo,
        activeCustomObjective
      );
      if (!enhancedPromptResult.success) {
        return enhancedPromptResult;
      }

      // Determine objectives ID
      const GUARDRAILS_ID =
        process.env.DOMO_AI_GUARDRAILS_ID || "g178c7c5e032b";
      const DEFAULT_OBJECTIVES_ID =
        process.env.DOMO_AI_OBJECTIVES_ID || "o4f2d4eb9b217";

      let objectivesId = DEFAULT_OBJECTIVES_ID;

      if (activeCustomObjective && activeCustomObjective.tavus_objectives_id) {
        objectivesId = activeCustomObjective.tavus_objectives_id;
      } else if (
        activeCustomObjective &&
        !activeCustomObjective.tavus_objectives_id
      ) {
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
          console.log(`❌ Error creating new objectives: ${error}`);
        }
      }

      // Create enhanced Tavus persona
      const personaResult = await this.createEnhancedTavusPersona({
        agentName: config.agentName,
        systemPrompt: enhancedPromptResult.data,
        guardrailsId: GUARDRAILS_ID,
        objectivesId,
        demo,
      });

      if (!personaResult.success) {
        return personaResult;
      }

      // Update demo with enhanced configuration
      const updateResult = await this.updateDemoWithEnhancedConfig(
        config,
        demo,
        personaResult.data.personaId,
        activeCustomObjective
      );
      if (!updateResult.success) {
        return updateResult;
      }

      return {
        success: true,
        data: {
          personaId: personaResult.data.personaId,
          demoId: config.demoId,
          configuration: {
            systemPrompt: true,
            guardrails: GUARDRAILS_ID,
            presetObjectives: DEFAULT_OBJECTIVES_ID,
            activeObjectives: objectivesId,
            customObjectives: activeCustomObjective
              ? {
                  id: activeCustomObjective.id,
                  name: activeCustomObjective.name,
                  steps: activeCustomObjective.objectives.length,
                  tavusId: activeCustomObjective.tavus_objectives_id,
                }
              : null,
            enhancedSystemPrompt: enhancedPromptResult.data.length,
          },
          message: activeCustomObjective
            ? `New persona created with custom objectives: ${activeCustomObjective.name}`
            : "New persona created with default objectives",
          personaType: "new",
        },
      };
    } catch (error) {
      logError(error, "Enhanced Agent Creation Error");
      return {
        success: false,
        error: "Internal error creating enhanced agent",
        code: ServiceErrorCode.INTERNAL_ERROR,
      };
    }
  }

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
      // Read base system prompt
      const promptPath = path.join(
        process.cwd(),
        "src",
        "lib",
        "tavus",
        "system_prompt.md"
      );
      const baseSystemPrompt = fs.readFileSync(promptPath, "utf-8");

      // Build identity section
      const identitySection = `\n\n## AGENT PROFILE\n- Name: ${
        config.agentName
      }\n- Personality: ${
        config.agentPersonality || "Friendly and helpful assistant."
      }\n- Initial Greeting (use at start of conversation): ${
        config.agentGreeting || "Hello! How can I help you with the demo today?"
      }\n`;

      // Build objectives section
      let objectivesSection = "";
      try {
        const { getActiveCustomObjective } = await import(
          "@/lib/supabase/custom-objectives"
        );
        const activeCustomObjective = await getActiveCustomObjective(
          config.demoId
        );

        if (
          activeCustomObjective &&
          activeCustomObjective.objectives.length > 0
        ) {
          objectivesSection = `\n\n## DEMO OBJECTIVES (${activeCustomObjective.name})\n`;
          objectivesSection += `${
            activeCustomObjective.description
              ? activeCustomObjective.description + "\n\n"
              : ""
          }`;
          objectivesSection +=
            "Follow these structured objectives throughout the conversation:\n\n";

          activeCustomObjective.objectives.forEach((obj, i) => {
            objectivesSection += `### ${i + 1}. ${obj.objective_name}\n`;
            objectivesSection += `**Objective:** ${obj.objective_prompt}\n`;
            objectivesSection += `**Mode:** ${obj.confirmation_mode} confirmation, ${obj.modality} modality\n`;
            if (obj.output_variables && obj.output_variables.length > 0) {
              objectivesSection += `**Capture:** ${obj.output_variables.join(
                ", "
              )}\n`;
            }
            objectivesSection += "\n";
          });
        } else {
          // Fall back to simple objectives from demo metadata
          const objectivesList: string[] = Array.isArray(
            demo.metadata?.objectives
          )
            ? (demo.metadata!.objectives as string[])
                .filter((s) => typeof s === "string" && s.trim())
                .slice(0, 5)
            : [];

          if (objectivesList.length > 0) {
            objectivesSection = `\n\n## DEMO OBJECTIVES\nFollow these objectives throughout the conversation. Weave them naturally into dialog and video choices.\n${objectivesList
              .map((o, i) => `- (${i + 1}) ${o.trim()}`)
              .join("\n")}\n`;
          }
        }
      } catch (error) {
        console.error(
          "Error loading custom objectives, falling back to demo metadata:",
          error
        );
        const objectivesList: string[] = Array.isArray(
          demo.metadata?.objectives
        )
          ? (demo.metadata!.objectives as string[])
              .filter((s) => typeof s === "string" && s.trim())
              .slice(0, 5)
          : [];

        if (objectivesList.length > 0) {
          objectivesSection = `\n\n## DEMO OBJECTIVES\nFollow these objectives throughout the conversation. Weave them naturally into dialog and video choices.\n${objectivesList
            .map((o, i) => `- (${i + 1}) ${o.trim()}`)
            .join("\n")}\n`;
        }
      }

      // Build knowledge context
      const knowledgeContext = this.buildKnowledgeContext(knowledgeBase);

      // Build videos context
      const videosContext = this.buildVideosContext(videos);

      // Language handling guidance
      const languageSection = `\n\n## LANGUAGE HANDLING\n- Automatically detect the user's language from their utterances and respond in that language.\n- Keep all tool calls and their arguments (function names, video titles) EXACT and un-translated.\n- Do not ask the user to choose a language; infer it from context and switch seamlessly while honoring all guardrails.\n`;

      const enhancedSystemPrompt =
        baseSystemPrompt +
        identitySection +
        objectivesSection +
        languageSection +
        knowledgeContext +
        videosContext;

      return {
        success: true,
        data: enhancedSystemPrompt,
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
  private async buildEnhancedSystemPrompt(
    config: EnhancedAgentConfig,
    demo: DemoConfig,
    activeCustomObjective: any
  ): Promise<ServiceResult<string>> {
    try {
      // Read base system prompt
      const promptPath = path.join(
        process.cwd(),
        "src",
        "lib",
        "tavus",
        "system_prompt.md"
      );
      const baseSystemPrompt = fs.readFileSync(promptPath, "utf-8");

      // Enhanced identity section
      const identitySection = `\n\n## AGENT IDENTITY\nYou are ${
        config.agentName
      }, ${
        config.agentPersonality || "a friendly and knowledgeable assistant"
      }.\nGreeting: "${
        config.agentGreeting || "Hello! How can I help you with the demo today?"
      }"\n`;

      // Enhanced objectives section
      let objectivesSection = "";

      if (
        activeCustomObjective &&
        activeCustomObjective.objectives.length > 0
      ) {
        objectivesSection = `\n\n## DEMO OBJECTIVES\n### ${activeCustomObjective.name}\n`;
        objectivesSection += `Follow this structured flow:\n`;

        activeCustomObjective.objectives.forEach((obj: any, i: number) => {
          objectivesSection += `${i + 1}. **${
            obj.objective_name
          }**: ${obj.objective_prompt.substring(0, 100)}...\n`;
        });

        objectivesSection += `\nCapture key data points and guide users through each step naturally.\n`;
      } else {
        objectivesSection = `\n\n## DEMO OBJECTIVES\n1. Welcome users and understand their specific needs\n2. Show relevant product videos based on their interests\n3. Answer detailed questions using your knowledge base\n4. Guide qualified prospects toward trial signup\n`;
      }

      // Language handling section
      const languageSection = `\n\n## LANGUAGE SUPPORT\nAutomatically detect and respond in the user's language while keeping all tool calls (fetch_video, show_trial_cta) in English with exact titles.\n`;

      // Build enhanced system prompt
      const enhancedSystemPrompt =
        baseSystemPrompt +
        identitySection +
        objectivesSection +
        languageSection;

      // Check if system prompt is too long and truncate if necessary
      const MAX_PROMPT_LENGTH = 8000;
      const TRUNCATION_SUFFIX = "\n\n[Truncated for length]";

      if (enhancedSystemPrompt.length > MAX_PROMPT_LENGTH) {
        console.warn(
          `⚠️ System prompt is too long (${enhancedSystemPrompt.length} chars). Truncating to ${MAX_PROMPT_LENGTH} chars.`
        );
        const truncatedPrompt =
          enhancedSystemPrompt.substring(
            0,
            MAX_PROMPT_LENGTH - TRUNCATION_SUFFIX.length
          ) + TRUNCATION_SUFFIX;
        return {
          success: true,
          data: truncatedPrompt,
        };
      }

      return {
        success: true,
        data: enhancedSystemPrompt,
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
   * Build knowledge context section
   */
  private buildKnowledgeContext(knowledgeBase: KnowledgeChunk[]): string {
    if (!knowledgeBase || knowledgeBase.length === 0) {
      return "";
    }

    let knowledgeContext = "\n\n## KNOWLEDGE BASE CONTENT\n";

    // Add Q&A pairs
    const qaPairs = knowledgeBase.filter((chunk) => chunk.chunk_type === "qa");
    if (qaPairs.length > 0) {
      knowledgeContext += "\n### Q&A Pairs:\n";
      qaPairs.forEach((chunk) => {
        knowledgeContext += `${chunk.content}\n\n`;
      });
    }

    // Add documents
    const documents = knowledgeBase.filter(
      (chunk) => chunk.chunk_type === "document"
    );
    if (documents.length > 0) {
      knowledgeContext += "\n### Product Documentation:\n";
      documents.forEach((chunk) => {
        knowledgeContext += `**Source: ${chunk.source}**\n${chunk.content}\n\n`;
      });
    }

    // Add transcripts
    const transcripts = knowledgeBase.filter(
      (chunk) => chunk.chunk_type === "transcript"
    );
    if (transcripts.length > 0) {
      knowledgeContext += "\n### Video Transcripts:\n";
      transcripts.forEach((chunk) => {
        knowledgeContext += `**Source: ${chunk.source}**\n${chunk.content}\n\n`;
      });
    }

    return knowledgeContext;
  }

  /**
   * Build videos context section
   */
  private buildVideosContext(videos: DemoVideo[]): string {
    if (!videos || videos.length === 0) {
      return "";
    }

    let videosContext = "\n\n## AVAILABLE VIDEOS\n";
    videosContext +=
      'You can show these videos using fetch_video("exact_title"):\n';
    videos.forEach((video) => {
      videosContext += `- "${video.title}"\n`;
      if (video.transcript) {
        videosContext += `  Transcript: ${video.transcript.substring(
          0,
          200
        )}...\n`;
      }
    });

    return videosContext;
  }

  /**
   * Create basic Tavus persona
   */
  private async createTavusPersona(params: {
    agentName: string;
    systemPrompt: string;
    videos: DemoVideo[];
    demo: DemoConfig;
  }): Promise<ServiceResult<{ personaId: string }>> {
    try {
      const tavusApiKey = process.env.TAVUS_API_KEY;
      if (!tavusApiKey) {
        return {
          success: false,
          error: "Tavus API key is not configured",
          code: ServiceErrorCode.EXTERNAL_API_ERROR,
        };
      }

      // Build tools configuration
      const allowedTitles = params.videos.map((v) => v.title).filter(Boolean);
      const tools = this.buildTavusTools(allowedTitles);

      // Configure LLM model
      const tavusLlmModel = process.env.TAVUS_LLM_MODEL || "tavus-llama-4";

      const personaResponse = await fetch("https://tavusapi.com/v2/personas", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": tavusApiKey,
        },
        body: JSON.stringify({
          pipeline_mode: "full",
          system_prompt: params.systemPrompt,
          persona_name: params.agentName,
          perception_model: "raven-0",
          layers: {
            llm: {
              model: tavusLlmModel,
              tools: tools,
            },
          },
        }),
      });

      if (!personaResponse.ok) {
        const errorBody = await personaResponse.text();
        logError(errorBody, "Tavus Persona API Error");
        return {
          success: false,
          error: `Failed to create Tavus persona: ${personaResponse.statusText}`,
          code: ServiceErrorCode.EXTERNAL_API_ERROR,
        };
      }

      const personaData = await personaResponse.json();
      return {
        success: true,
        data: { personaId: personaData.persona_id },
      };
    } catch (error) {
      logError(error, "Error creating Tavus persona");
      return {
        success: false,
        error: "Failed to create Tavus persona",
        code: ServiceErrorCode.EXTERNAL_API_ERROR,
      };
    }
  }

  /**
   * Create enhanced Tavus persona with full configuration
   */
  private async createEnhancedTavusPersona(params: {
    agentName: string;
    systemPrompt: string;
    guardrailsId: string;
    objectivesId: string;
    demo: DemoConfig;
  }): Promise<ServiceResult<{ personaId: string }>> {
    try {
      const apiUrl = `${process.env.TAVUS_BASE_URL}/personas`;

      // Create persona payload
      const personaPayload: any = {
        persona_name: `${params.agentName} - ${params.demo.name} (${
          new Date().toISOString().split("T")[0]
        })`,
        system_prompt: params.systemPrompt,
        objectives_id: params.objectivesId,
        guardrails_id: params.guardrailsId,
      };

      // Add optional fields only if they exist
      if (process.env.TAVUS_REPLICA_ID) {
        personaPayload.default_replica_id = process.env.TAVUS_REPLICA_ID;
      }

      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "x-api-key": process.env.TAVUS_API_KEY!,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(personaPayload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("❌ Failed to create enhanced persona:", errorText);

        return {
          success: false,
          error: "Failed to create enhanced Tavus persona",
          code: ServiceErrorCode.EXTERNAL_API_ERROR,
        };
      }

      const personaData = await response.json();
      return {
        success: true,
        data: { personaId: personaData.persona_id },
      };
    } catch (error) {
      logError(error, "Error creating enhanced Tavus persona");
      return {
        success: false,
        error: "Failed to create enhanced Tavus persona",
        code: ServiceErrorCode.EXTERNAL_API_ERROR,
      };
    }
  }

  /**
   * Build Tavus tools configuration
   */
  private buildTavusTools(allowedTitles: string[]): any[] {
    // Check if tools should be enabled
    const tavusToolsEnabled = process.env.TAVUS_TOOLS_ENABLED === "true";
    if (!tavusToolsEnabled) {
      return [];
    }

    const tavusMinimalTools = process.env.TAVUS_MINIMAL_TOOLS === "true";

    // Build the title property with an enum of allowed titles when available
    const titleProperty: any = {
      type: "string",
      description:
        "Exact title of the video to fetch. Must match one of the listed video titles.",
    };
    if (Array.isArray(allowedTitles) && allowedTitles.length > 0) {
      titleProperty.enum = allowedTitles;
    }

    const fetchVideoTool = {
      type: "function",
      function: {
        name: "fetch_video",
        description:
          "Fetch and display a demo video by exact title. Use when the user asks to see a specific video or feature demo.",
        parameters: {
          type: "object",
          properties: {
            title: titleProperty,
          },
          required: ["title"],
        },
      },
    };

    const tools: any[] = [fetchVideoTool];

    if (!tavusMinimalTools) {
      tools.push(
        {
          type: "function",
          function: {
            name: "pause_video",
            description: "Pause the currently playing demo video.",
            parameters: {
              type: "object",
              properties: {},
              required: [],
            },
          },
        },
        {
          type: "function",
          function: {
            name: "play_video",
            description: "Resume playing the currently paused demo video.",
            parameters: {
              type: "object",
              properties: {},
              required: [],
            },
          },
        },
        {
          type: "function",
          function: {
            name: "next_video",
            description:
              "Stop current video and play the next available demo video in sequence.",
            parameters: {
              type: "object",
              properties: {},
              required: [],
            },
          },
        },
        {
          type: "function",
          function: {
            name: "close_video",
            description:
              "Close the video player and return to full-screen conversation.",
            parameters: {
              type: "object",
              properties: {},
              required: [],
            },
          },
        },
        {
          type: "function",
          function: {
            name: "show_trial_cta",
            description:
              "Show call-to-action for starting a trial when user expresses interest.",
            parameters: {
              type: "object",
              properties: {},
              required: [],
            },
          },
        }
      );
    }

    return tools;
  }

  /**
   * Update demo with enhanced configuration
   */
  private async updateDemoWithEnhancedConfig(
    config: EnhancedAgentConfig,
    demo: DemoConfig,
    personaId: string,
    activeCustomObjective: any
  ): Promise<ServiceResult<void>> {
    try {
      const { createClient } = await import("@/utils/supabase/server");
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
}

// Export singleton instance
export const agentService = new AgentService();
