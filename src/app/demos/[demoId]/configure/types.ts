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
    objectives?: string[];
    // Optional analytics/reporting fields populated by webhook at end of calls
    analytics?: {
      last_updated?: string;
      conversations?: Record<string, any>; // keyed by conversation_id
      last_perception_event?: any;
    };
  } | null;
}

export interface DemoVideo {
  id: string;
  demo_id: string;
  storage_url: string;
  title: string;
  order_index: number;
  processing_status: 'pending' | 'processing' | 'completed' | 'failed';
  transcript?: string;
  metadata?: any;
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
}

export interface ProcessingStatus {
  stage: 'idle' | 'uploading' | 'embedding' | 'completed' | 'error' | 'processing';
  progress: number;
  message: string;
}
