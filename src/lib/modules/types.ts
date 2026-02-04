/**
 * Module System Types for Domo Sub-Context Architecture
 *
 * Modules are first-class citizens that bind together:
 * - Objectives (what the agent tries to accomplish)
 * - Knowledge (documents, Q&A, transcripts)
 * - Videos (demo content)
 * - Session state (runtime tracking)
 */

/**
 * Standard module IDs for the product demo flow.
 * These represent the logical stages of a demo conversation.
 */
export type ModuleId =
  | 'intro'
  | 'qualification'
  | 'overview'
  | 'feature_deep_dive'
  | 'pricing'
  | 'cta';

/**
 * Static definition of a module template.
 * Used for seeding default modules and defining the standard flow.
 */
export interface ModuleDefinition {
  moduleId: ModuleId;
  name: string;
  description: string;
  orderIndex: number;
  /** Objective names that belong to this module */
  objectiveIds: string[];
  /** Whether this module typically involves video playback */
  requiresVideo: boolean;
  /** Guidance text shown in the configure UI */
  uploadGuidance: string;
}

/**
 * Database representation of a module for a specific demo.
 * Allows per-demo customization of module settings.
 */
export interface DemoModule {
  id: string;
  demo_id: string;
  module_id: ModuleId;
  name: string;
  description: string | null;
  order_index: number;
  requires_video: boolean;
  upload_guidance: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Runtime state tracking for modules during a conversation.
 * Stored in conversation_details.module_state as JSONB.
 */
export interface ModuleState {
  /** Modules that have been fully completed */
  completedModules: ModuleId[];
  /** Individual objectives that have been completed */
  completedObjectives: string[];
  /** When the current module was entered */
  currentModuleStartedAt?: string;
  /** Optional per-module data storage */
  moduleData?: Record<ModuleId, Record<string, unknown>>;
}

/**
 * Aggregated content for a single module.
 * Used when building the system prompt.
 */
export interface ModuleContent {
  moduleId: ModuleId;
  name: string;
  description: string;
  videos: Array<{
    title: string;
    context?: string;
  }>;
  knowledgeChunks: Array<{
    content: string;
    type: string;
    source?: string;
  }>;
  objectives: string[];
}

/**
 * Event payload broadcast when module changes during a conversation.
 */
export interface ModuleChangedEvent {
  previousModule: ModuleId | null;
  currentModule: ModuleId | null;
  completedModules: ModuleId[];
  completedObjectives: string[];
}

/**
 * Event payload broadcast when an objective completes.
 */
export interface ObjectiveCompletedEvent {
  objectiveName: string;
  currentModule: ModuleId | null;
  moduleState: ModuleState;
}
