export interface Demo {
  id: string;
  name: string;
  user_id: string;
  tavus_conversation_id: string | null;
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
  // Admin-level CTA fields (new)
  cta_title?: string;
  cta_message?: string;
  cta_button_text?: string;
  cta_button_url?: string;
  // Legacy CTA fields
  cta_text?: string;
  cta_link?: string;
  // Embed settings for public iFrame embedding
  is_embeddable?: boolean;
  embed_token?: string | null;
  allowed_domains?: string[] | null;
}

// CTA override payload shape from Realtime broadcasts
export type CtaOverrides = {
  cta_title?: string | null;
  cta_message?: string | null;
  cta_button_text?: string | null;
  cta_button_url?: string | null;
};
