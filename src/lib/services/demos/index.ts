/**
 * Demo Management Services
 *
 * This module provides demo-related business logic services.
 * Services in this module handle demo creation, configuration,
 * agent management, and demo lifecycle operations.
 */

// Export types
export type {
  PersonaDetails,
  PersonaStatus,
  DemoConfig,
  DemoMetadata,
  AgentConfig,
  EnhancedAgentConfig,
  KnowledgeChunk,
  DemoVideo,
  TestDemoParams,
  AgentCreationResult,
  IDemoService,
  IAgentService,
} from "./types";

// Export video service types
export type {
  VideoProcessingResult,
  VideoUrlResult,
  VideoUploadResult,
  IVideoService,
} from "./video-service";

// Export demo service
export { DemoService, demoService } from "./demo-service";

// Export agent service
export { AgentService, agentService } from "./agent-service";

// Export video service
export { VideoService, videoService } from "./video-service";
