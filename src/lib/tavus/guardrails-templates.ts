/**
 * Tavus Guardrails Templates
 * Store guardrails definitions locally for reuse across personas
 */

export interface GuardrailTemplate {
  name: string;
  data: Array<{
    guardrail_name: string;
    guardrail_prompt: string;
    modality: "verbal" | "visual" | "both";
    callback_url?: string;
  }>;
}

// Core behavioral guardrails for Domo A.I.
export const DOMO_AI_GUARDRAILS: GuardrailTemplate = {
  name: "Domo AI Core Guardrails",
  data: [
    {
      guardrail_name: "Tool_Call_Silence",
      guardrail_prompt:
        "Never verbalize tool calls or describe internal tools. Execute them silently without including tool call text in spoken responses. Do not say phrases like 'fetch video', 'calling fetch_video', or describe internal operations.",
      modality: "verbal",
    },
    {
      guardrail_name: "Exact_Title_Requirement",
      guardrail_prompt:
        "Only call fetch_video when you have an exact, unambiguous match to an available video title. Never guess or use fallback defaults. If unsure about a title, ask the user to specify the exact title instead of making tool calls.",
      modality: "verbal",
    },
    {
      guardrail_name: "No_Content_Hallucination",
      guardrail_prompt:
        "Do not invent video titles, CTAs, or any content not provided in context. Use only the exact titles and resources available. If content doesn't exist, acknowledge this honestly.",
      modality: "verbal",
    },
    {
      guardrail_name: "Sensitive_Topics_Refusal",
      guardrail_prompt:
        "Politely refuse to discuss topics related to race, gender, politics, or religion. Provide a brief, neutral refusal (e.g., 'I can't discuss that topic.') and redirect back to the product demo.",
      modality: "verbal",
    },
    {
      guardrail_name: "No_Parroting_Echoing",
      guardrail_prompt:
        "Do not repeat the user's utterances verbatim or in a call-and-response format. Do not echo their exact wording. Provide substantive answers or concise paraphrases that add value instead of mirroring.",
      modality: "verbal",
    },
    {
      guardrail_name: "Repeat_After_Me_Refusal",
      guardrail_prompt:
        "Politely refuse requests to repeat the user's words verbatim. Explain you cannot echo their exact wording and offer help related to the demo instead.",
      modality: "verbal",
    },
  ],
};

// Additional guardrails for specific use cases
export const DEMO_FLOW_GUARDRAILS: GuardrailTemplate = {
  name: "Demo Flow Control",
  data: [
    {
      guardrail_name: "Progressive_Demo_Flow",
      guardrail_prompt:
        "Guide users through a logical sequence of features. Remember what videos you've shown and questions answered to avoid repetition.",
      modality: "verbal",
    },
    {
      guardrail_name: "Knowledge_Base_First",
      guardrail_prompt:
        "Always check your knowledge base before answering questions. Be specific and detailed using the provided documentation and Q&A pairs.",
      modality: "verbal",
    },
  ],
};

// Export all templates for easy access
export const ALL_GUARDRAIL_TEMPLATES = {
  DOMO_AI_GUARDRAILS,
  DEMO_FLOW_GUARDRAILS,
} as const;
