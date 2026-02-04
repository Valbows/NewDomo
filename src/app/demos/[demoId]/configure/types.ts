import type { ModuleId, ModuleState } from '@/lib/modules/types';

export interface Demo {
  id: string;
  name: string;
  user_id: string;
  created_at: string;
  // Tavus identifiers stored as columns (source of truth)
  tavus_persona_id?: string | null;
  tavus_conversation_id?: string | null;
  // Admin-level CTA fields (stored as columns on demos)
  cta_title?: string | null;
  cta_message?: string | null;
  cta_button_text?: string | null;
  cta_button_url?: string | null;
  cta_return_url?: string | null;
  // Embed settings for public iFrame embedding
  is_embeddable?: boolean;
  embed_token?: string | null;
  allowed_domains?: string[] | null;
  metadata: {
    agentName?: string;
    agentPersonality?: string;
    agentGreeting?: string;
    /** @deprecated Stored in column `tavus_persona_id` on `demos` */
    tavusAgentId?: string;
    /** Shareable URL of the active conversation.
     *  @deprecated Source of truth is column `tavus_conversation_id`; URL can be derived from Tavus API.
     */
    tavusShareableLink?: string;
    /** @deprecated Stored in column `tavus_persona_id` on `demos` */
    tavusPersonaId?: string;
    agentCreatedAt?: string;
    ctaTitle?: string;
    ctaMessage?: string;
    ctaButtonText?: string;
    ctaButtonUrl?: string;
    /** @deprecated Use selectedObjectiveTemplate instead */
    objectives?: string[];
    selectedObjectiveTemplate?: string;
    // Optional analytics/reporting fields populated by webhook at end of calls
    analytics?: {
      last_updated?: string;
      conversations?: Record<string, any>; // keyed by conversation_id
      last_perception_event?: any;
    };
  } | null;
}

/**
 * Module definition for a specific demo.
 * Seeded from defaults but can be customized per-demo.
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

export interface DemoVideo {
  id: string;
  demo_id: string;
  storage_url: string;
  title: string;
  order_index: number;
  processing_status: 'pending' | 'processing' | 'completed' | 'failed';
  processing_error?: string | null;
  transcript?: string;
  metadata?: any;
  /** Module this video belongs to (intro, qualification, overview, etc.) */
  module_id?: ModuleId | null;
}

export interface KnowledgeChunk {
  id: string;
  demo_id: string;
  content: string;
  chunk_type: 'transcript' | 'qa' | 'document';
  question?: string;
  answer?: string;
  source?: string;
  created_at?: string;
  updated_at?: string;
  vector_embedding?: number[];
  /** Module this knowledge chunk belongs to. NULL means global/all modules. */
  module_id?: ModuleId | null;
}

/**
 * Knowledge source tracking (PDF, URL, etc.)
 */
export interface KnowledgeSource {
  id: string;
  demo_id: string;
  source_type: 'pdf' | 'csv' | 'url' | 'text';
  location: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  created_at: string;
  /** Module this source belongs to */
  module_id?: ModuleId | null;
}

export interface ProcessingStatus {
  stage: 'idle' | 'uploading' | 'embedding' | 'completed' | 'error' | 'processing';
  progress: number;
  message: string;
}

/**
 * Conversation details with module tracking
 */
export interface ConversationDetails {
  id: string;
  demo_id: string;
  tavus_conversation_id: string;
  conversation_name?: string | null;
  transcript?: any;
  perception_analysis?: any;
  started_at?: string | null;
  completed_at?: string | null;
  duration_seconds?: number | null;
  status: 'active' | 'starting' | 'waiting' | 'completed' | 'failed';
  created_at: string;
  updated_at: string;
  /** Current module the conversation is in */
  current_module_id?: ModuleId | null;
  /** JSON tracking completed modules, objectives, and module-specific data */
  module_state?: ModuleState | null;
}
