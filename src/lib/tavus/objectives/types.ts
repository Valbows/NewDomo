/**
 * Tavus Persona Objectives Types
 * Common interfaces and types for objectives templates
 */

export interface ObjectiveDefinition {
  objective_name: string;
  objective_prompt: string;
  confirmation_mode: "auto" | "manual";
  output_variables?: string[];
  modality: "verbal" | "visual";
  next_conditional_objectives?: Record<string, string>;
  next_required_objectives?: string[];
  callback_url?: string;
}

export interface ObjectivesTemplate {
  name: string;
  description: string;
  objectives: ObjectiveDefinition[];
}