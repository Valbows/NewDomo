/**
 * Demo Service Types and Interfaces
 */

import { ServiceResult } from '../types';

/**
 * Persona information from Tavus API
 */
export interface PersonaDetails {
  persona_id: string;
  persona_name: string;
  guardrails_id?: string;
  objectives_id?: string;
  created_at: string;
  updated_at: string;
  perception_model?: string;
}

/**
 * Current persona status for a demo
 */
export interface PersonaStatus {
  demo: {
    id: string;
    name: string;
    currentPersonaId?: string;
    agentName?: string;
    agentPersonality?: string;
    agentGreeting?: string;
  };
  environment: {
    personaId?: string;
    guardrailsId?: string;
    objectivesId?: string;
  };
  persona?: PersonaDetails;
  status: {
    hasPersona: boolean;
    personaAccessible: boolean;
    matchesEnvironment: boolean;
  };
}

/**
 * Demo configuration interface
 */
export interface DemoConfig {
  id: string;
  name: string;
  user_id: string;
  tavus_persona_id?: string | null;
  video_storage_path?: string;
  metadata?: DemoMetadata;
  agent_name?: string;
  agent_personality?: string;
  agent_greeting?: string;
}

/**
 * Demo metadata structure
 */
export interface DemoMetadata {
  uploadId?: string;
  userId?: string;
  fileName?: string;
  fileType?: string;
  fileSize?: string;
  uploadTimestamp?: string;
  agentName?: string;
  agentPersonality?: string;
  agentGreeting?: string;
  objectives?: string[];
  tavusPersonaId?: string;
  agentCreatedAt?: string;
  hasCustomObjectives?: boolean;
  customObjectivesId?: string | null;
  guardrailsId?: string;
  objectivesId?: string;
}

/**
 * Agent configuration interface
 */
export interface AgentConfig {
  demoId: string;
  agentName: string;
  agentPersonality?: string;
  agentGreeting?: string;
}

/**
 * Enhanced agent configuration
 */
export interface EnhancedAgentConfig extends AgentConfig {
  systemPrompt?: string;
  guardrailsId?: string;
  objectivesId?: string;
  customObjectivesId?: string | null;
}

/**
 * Knowledge base content
 */
export interface KnowledgeChunk {
  content: string;
  chunk_type: 'qa' | 'document' | 'transcript';
  source: string;
}

/**
 * Demo video information
 */
export interface DemoVideo {
  title: string;
  transcript?: string;
  storage_url?: string;
  order_index?: number;
  duration_seconds?: number;
}

/**
 * Test demo creation parameters
 */
export interface TestDemoParams {
  demoId?: string;
  userId?: string;
  name?: string;
  videos?: Omit<DemoVideo, 'demo_id'>[];
}

/**
 * Agent creation result
 */
export interface AgentCreationResult {
  personaId: string;
  demoId: string;
  configuration: {
    systemPrompt: boolean;
    guardrails?: string;
    presetObjectives?: string;
    activeObjectives?: string;
    customObjectives?: {
      id: string;
      name: string;
      steps: number;
      tavusId?: string;
    } | null;
    enhancedSystemPrompt?: number;
  };
  message: string;
  personaType: 'new' | 'existing';
}

/**
 * Demo service interface
 */
export interface IDemoService {
  /**
   * Create a test demo with sample data
   */
  createTestDemo(params?: TestDemoParams): Promise<ServiceResult<{ demoId: string; videosCreated: number }>>;

  /**
   * Update demo persona ID
   */
  updateDemoPersona(demoId: string, userId: string, personaId: string): Promise<ServiceResult<DemoConfig>>;

  /**
   * Get demo configuration
   */
  getDemoConfig(demoId: string, userId: string): Promise<ServiceResult<DemoConfig>>;

  /**
   * Get knowledge base content for a demo
   */
  getKnowledgeBase(demoId: string): Promise<ServiceResult<KnowledgeChunk[]>>;

  /**
   * Get demo videos
   */
  getDemoVideos(demoId: string): Promise<ServiceResult<DemoVideo[]>>;

  /**
   * Get current persona status for a demo
   */
  getCurrentPersonaStatus(demoId: string): Promise<ServiceResult<PersonaStatus>>;
}

/**
 * Agent service interface
 */
export interface IAgentService {
  /**
   * Create a basic agent for a demo
   */
  createAgent(config: AgentConfig, userId: string): Promise<ServiceResult<AgentCreationResult>>;

  /**
   * Create an enhanced agent with full configuration
   */
  createEnhancedAgent(config: EnhancedAgentConfig, userId: string): Promise<ServiceResult<AgentCreationResult>>;

  /**
   * Build system prompt for an agent
   */
  buildSystemPrompt(config: AgentConfig, demo: DemoConfig, knowledgeBase: KnowledgeChunk[], videos: DemoVideo[]): Promise<ServiceResult<string>>;
}