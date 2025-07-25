export interface Demo {
  id: string;
  name: string;
  user_id: string;
  created_at: string;
  metadata: {
    agentName?: string;
    agentPersonality?: string;
    agentGreeting?: string;
    tavusAgentId?: string;
    tavusShareableLink?: string;
    tavusPersonaId?: string;
    agentCreatedAt?: string;
    ctaTitle?: string;
    ctaMessage?: string;
    ctaButtonText?: string;
    ctaButtonUrl?: string;
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
