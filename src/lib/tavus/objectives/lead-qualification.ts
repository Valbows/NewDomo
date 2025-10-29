/**
 * Lead Qualification Objectives Template
 * Focused on qualifying prospects before full demo
 */

import { ObjectivesTemplate } from './types';

export const LEAD_QUALIFICATION_OBJECTIVES: ObjectivesTemplate = {
  name: "Lead Qualification Flow",
  description:
    "Qualify leads before investing time in full product demonstration",
  objectives: [
    {
      objective_name: "initial_greeting",
      objective_prompt:
        "Warmly greet the visitor and ask what brought them to learn about the product today. Understand their immediate need or trigger event.",
      confirmation_mode: "auto",
      output_variables: ["trigger_event", "immediate_need"],
      modality: "verbal",
      next_required_objectives: ["qualify_company_fit"],
    },
    {
      objective_name: "qualify_company_fit",
      objective_prompt:
        "Determine if they fit the ideal customer profile by asking about company size, industry, current tools, and team structure. Be conversational but gather key qualifying information.",
      confirmation_mode: "auto",
      output_variables: [
        "company_size",
        "industry",
        "current_tools",
        "team_size",
        "fit_score",
      ],
      modality: "verbal",
      next_conditional_objectives: {
        qualify_budget_authority: "If company fit is good",
        provide_alternative_resources: "If company fit is poor",
      },
    },
    {
      objective_name: "qualify_budget_authority",
      objective_prompt:
        "Understand their budget range, decision-making process, and timeline. Ask about who else would be involved in the decision and what their evaluation process looks like.",
      confirmation_mode: "auto",
      output_variables: [
        "budget_range",
        "decision_makers",
        "evaluation_timeline",
        "authority_level",
      ],
      modality: "verbal",
      next_conditional_objectives: {
        schedule_full_demo: "If budget and authority are qualified",
        nurture_lead: "If not ready to buy but good long-term prospect",
      },
    },
    {
      objective_name: "schedule_full_demo",
      objective_prompt:
        "Since they're qualified, offer to schedule a personalized demo with a product expert who can show them exactly how the solution would work for their specific use case.",
      confirmation_mode: "manual",
      output_variables: [
        "demo_scheduled",
        "preferred_time",
        "attendees",
        "specific_focus_areas",
      ],
      modality: "verbal",
      next_required_objectives: ["capture_scheduling_info"],
    },
    {
      objective_name: "nurture_lead",
      objective_prompt:
        "Provide valuable resources like case studies, ROI calculators, or educational content. Capture their contact info for future nurturing and set expectations for follow-up.",
      confirmation_mode: "auto",
      output_variables: [
        "resources_provided",
        "nurture_timeline",
        "contact_captured",
      ],
      modality: "verbal",
      next_required_objectives: ["complete_qualification"],
    },
    {
      objective_name: "provide_alternative_resources",
      objective_prompt:
        "If they're not a good fit, be helpful by suggesting alternative solutions or resources that might better serve their needs. Maintain a positive relationship.",
      confirmation_mode: "auto",
      output_variables: ["alternatives_suggested", "relationship_maintained"],
      modality: "verbal",
      next_required_objectives: ["complete_qualification"],
    },
    {
      objective_name: "capture_scheduling_info",
      objective_prompt:
        "Collect all necessary information to schedule their demo: contact details, preferred times, attendees, and specific topics they want covered.",
      confirmation_mode: "manual",
      output_variables: [
        "contact_info",
        "scheduling_preferences",
        "demo_requirements",
      ],
      modality: "verbal",
      next_required_objectives: ["complete_qualification"],
    },
    {
      objective_name: "complete_qualification",
      objective_prompt:
        "Summarize the next steps, confirm all collected information, and thank them for their time. Ensure they know what to expect next.",
      confirmation_mode: "auto",
      output_variables: ["next_steps_confirmed", "expectations_set"],
      modality: "verbal",
    },
  ],
};