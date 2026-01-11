/**
 * Predefined Demo Objective Templates
 *
 * These are ready-to-use conversation flows that define what the AI agent
 * should accomplish during a demo. Each template has a specific use case.
 */

export interface DemoObjectiveTemplate {
  id: string;
  title: string;
  description: string;
  icon: string;
  objectives: {
    objective_name: string;
    objective_prompt: string;
    confirmation_mode: 'auto' | 'manual';
    output_variables: string[];
    modality: 'verbal' | 'visual';
  }[];
}

/**
 * Domo Sales Engineer
 * The default conversation flow for interactive product demos.
 * Guides visitors through discovery, demonstration, Q&A, and next steps.
 */
const DOMO_SALES_ENGINEER: DemoObjectiveTemplate = {
  id: 'domo-sales-engineer',
  title: 'Domo Sales Engineer',
  description: 'Your AI sales engineer that guides visitors through personalized product demos, answers questions, and helps them take the next step.',
  icon: '🤖',
  objectives: [
    {
      objective_name: 'welcome_and_discover',
      objective_prompt: 'Welcome the visitor warmly and ask what brought them here today. Understand their role, company, and what specific problem they are trying to solve.',
      confirmation_mode: 'auto',
      output_variables: ['user_name', 'company_name', 'role', 'main_challenge'],
      modality: 'verbal',
    },
    {
      objective_name: 'show_relevant_features',
      objective_prompt: 'Based on their needs, show the most relevant product videos. Explain what they are about to see before playing each video, and connect the features to their specific challenges.',
      confirmation_mode: 'auto',
      output_variables: ['features_shown', 'interest_level'],
      modality: 'verbal',
    },
    {
      objective_name: 'answer_questions',
      objective_prompt: 'Answer any questions they have about the product. Use the knowledge base to provide detailed, accurate responses. Address any concerns proactively.',
      confirmation_mode: 'auto',
      output_variables: ['questions_answered', 'concerns_addressed'],
      modality: 'verbal',
    },
    {
      objective_name: 'next_steps',
      objective_prompt: 'Based on their interest level, suggest appropriate next steps such as starting a trial, scheduling a call with sales, or exploring more features. Show the call-to-action when ready.',
      confirmation_mode: 'auto',
      output_variables: ['next_step_chosen', 'interest_confirmed'],
      modality: 'verbal',
    },
  ],
};

/**
 * All available demo objective templates
 */
export const DEMO_OBJECTIVE_TEMPLATES: DemoObjectiveTemplate[] = [
  DOMO_SALES_ENGINEER,
];

/**
 * Get a template by ID
 */
export function getTemplateById(id: string): DemoObjectiveTemplate | undefined {
  return DEMO_OBJECTIVE_TEMPLATES.find(t => t.id === id);
}

/**
 * Default template to use when none is selected
 */
export const DEFAULT_TEMPLATE_ID = 'domo-sales-engineer';
