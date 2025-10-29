/**
 * Tavus Service Types
 * Shared types and interfaces for Tavus integration
 */

// Base Tavus API types
export interface TavusApiConfig {
  apiKey: string;
  baseUrl?: string;
}

export interface TavusApiResponse<T = any> {
  data?: T;
  error?: string;
  status: number;
}

// Persona types
export interface PersonaConfig {
  system_prompt?: string;
  guardrails_id?: string;
  objectives_id?: string;
  perception_model?: string;
  default_replica_id?: string;
  [key: string]: any;
}

export interface PersonaResponse {
  persona_id: string;
  system_prompt: string;
  guardrails_id?: string;
  objectives_id?: string;
  default_replica_id?: string;
  created_at: string;
  updated_at: string;
}

// Conversation types
export interface ConversationConfig {
  persona_id: string;
  replica_id?: string;
  callback_url?: string;
  objectives_id?: string;
}

export interface ConversationResponse {
  conversation_id: string;
  conversation_url: string;
  status: 'active' | 'ended' | 'completed';
  created_at: string;
  updated_at?: string;
}

// Objectives types
export interface ObjectiveDefinition {
  objective_name: string;
  objective_prompt: string;
  confirmation_mode: 'auto' | 'manual';
  modality: 'verbal' | 'visual';
  output_variables?: string[];
  callback_url?: string;
}

export interface ObjectivesTemplate {
  name: string;
  description: string;
  objectives: ObjectiveDefinition[];
}

export interface ObjectivesResponse {
  objectives_id?: string;
  uuid?: string;
  objectives_name?: string;
  name?: string;
  data?: ObjectiveDefinition[];
  created_at: string;
  updated_at?: string;
}

export interface ListObjectivesResponse {
  data: ObjectivesResponse[];
}

// Guardrails types
export interface GuardrailDefinition {
  guardrail_name: string;
  guardrail_prompt: string;
  modality: string;
  callback_url?: string;
}

export interface GuardrailTemplate {
  name: string;
  data: GuardrailDefinition[];
}

export interface GuardrailsResponse {
  uuid?: string;
  guardrails_id?: string;
  owner_id?: number;
  name: string;
  data: GuardrailDefinition[];
  created_at: string;
  updated_at: string;
  is_deleted?: boolean;
}

export interface GuardrailsListResponse {
  data: GuardrailsResponse[];
  total_count: number;
}

// Webhook types
export interface WebhookEvent {
  event_type?: string;
  type?: string;
  conversation_id?: string;
  properties?: Record<string, any>;
  data?: Record<string, any>;
  id?: string;
  event_id?: string;
  transcript?: any;
  messages?: any;
  perception?: any;
  analysis?: any;
  analytics?: any;
  [key: string]: any; // Allow additional properties
}

export interface ToolCallEvent extends WebhookEvent {
  tool_name: string;
  tool_args: Record<string, any>;
}

export interface ObjectiveCompletionEvent extends WebhookEvent {
  objective_name: string;
  output_variables: Record<string, any>;
}

// Analytics types
export interface AnalyticsEvent {
  conversation_id: string;
  event_type: string;
  timestamp: string;
  data: Record<string, any>;
}

export interface ConversationAnalytics {
  conversation_id: string;
  transcript?: any[];
  perception_analysis?: any;
  events: AnalyticsEvent[];
  status: 'active' | 'completed';
  completed_at?: string;
}

// Service result types
export interface ServiceResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

// Video and media types
export interface VideoRequest {
  video_title: string;
  demo_id: string;
  conversation_id: string;
}

export interface VideoResponse {
  signed_url: string;
  expires_at: string;
}

// CTA types
export interface CTAConfig {
  title?: string;
  message?: string;
  button_text?: string;
  button_url?: string;
}

export interface CTAEvent {
  conversation_id: string;
  demo_id: string;
  cta_config: CTAConfig;
  shown_at: string;
}

// Webhook URL management types
export interface WebhookUrlStatus {
  webhookUrl: string;
  isNgrok: boolean;
  isLocalhost: boolean;
  isProduction: boolean;
  warning?: string;
}