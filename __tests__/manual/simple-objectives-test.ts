/**
 * Simple objectives template for testing
 * All references are valid within the template
 */

import type { ObjectivesTemplate } from './objectives-templates';

export const SIMPLE_DEMO_OBJECTIVES: ObjectivesTemplate = {
  name: "Simple Demo Flow",
  description: "Basic product demonstration with valid objective references",
  objectives: [
    {
      objective_name: "welcome_user",
      objective_prompt: "Welcome the user warmly and ask what brought them here today. Understand their main challenge or interest.",
      confirmation_mode: "auto",
      output_variables: ["user_interest", "main_challenge"],
      modality: "verbal",
      next_required_objectives: ["show_demo"]
    },
    {
      objective_name: "show_demo",
      objective_prompt: "Show the main product demo video that addresses their interest. After the video, ask if they have any questions.",
      confirmation_mode: "auto",
      output_variables: ["demo_shown", "questions_asked"],
      modality: "verbal",
      next_conditional_objectives: {
        "answer_questions": "If they have questions about the demo",
        "discuss_next_steps": "If they are ready to move forward"
      }
    },
    {
      objective_name: "answer_questions",
      objective_prompt: "Answer their questions about the product using your knowledge base. Be thorough and helpful.",
      confirmation_mode: "auto",
      output_variables: ["questions_answered", "satisfaction_level"],
      modality: "verbal",
      next_required_objectives: ["discuss_next_steps"]
    },
    {
      objective_name: "discuss_next_steps",
      objective_prompt: "Based on their interest level, suggest appropriate next steps like a trial, speaking with sales, or getting more information.",
      confirmation_mode: "auto",
      output_variables: ["next_step_interest", "contact_preference"],
      modality: "verbal",
      next_conditional_objectives: {
        "capture_contact": "If they want to be contacted",
        "provide_resources": "If they want self-service resources"
      }
    },
    {
      objective_name: "capture_contact",
      objective_prompt: "Collect their contact information and preferred way to follow up. Thank them for their interest.",
      confirmation_mode: "manual",
      output_variables: ["email", "phone", "preferred_contact_method"],
      modality: "verbal",
      next_required_objectives: ["complete_session"]
    },
    {
      objective_name: "provide_resources",
      objective_prompt: "Provide helpful resources like documentation, case studies, or trial links. Ensure they have what they need.",
      confirmation_mode: "auto",
      output_variables: ["resources_provided", "self_service_preference"],
      modality: "verbal",
      next_required_objectives: ["complete_session"]
    },
    {
      objective_name: "complete_session",
      objective_prompt: "Summarize the conversation, confirm next steps, and thank them for their time. End on a positive note.",
      confirmation_mode: "auto",
      output_variables: ["session_summary", "user_satisfaction"],
      modality: "verbal"
    }
  ]
};

export const SIMPLE_QUALIFICATION_OBJECTIVES: ObjectivesTemplate = {
  name: "Simple Lead Qualification",
  description: "Basic lead qualification flow with valid references",
  objectives: [
    {
      objective_name: "initial_greeting",
      objective_prompt: "Greet the visitor and understand what brought them to explore your solution today.",
      confirmation_mode: "auto",
      output_variables: ["trigger_event", "initial_interest"],
      modality: "verbal",
      next_required_objectives: ["qualify_fit"]
    },
    {
      objective_name: "qualify_fit",
      objective_prompt: "Ask about their company size, role, and current challenges to determine if they're a good fit for your solution.",
      confirmation_mode: "auto",
      output_variables: ["company_size", "role", "challenges", "fit_score"],
      modality: "verbal",
      next_conditional_objectives: {
        "qualify_budget_timeline": "If they seem like a good fit",
        "provide_alternatives": "If they're not a good fit"
      }
    },
    {
      objective_name: "qualify_budget_timeline",
      objective_prompt: "Understand their budget range and timeline for making a decision. Ask about their decision-making process.",
      confirmation_mode: "auto",
      output_variables: ["budget_range", "timeline", "decision_process"],
      modality: "verbal",
      next_conditional_objectives: {
        "schedule_demo": "If budget and timeline are qualified",
        "nurture_lead": "If they need more time or budget development"
      }
    },
    {
      objective_name: "schedule_demo",
      objective_prompt: "Since they're qualified, offer to schedule a personalized demo with a product expert. Collect scheduling preferences.",
      confirmation_mode: "manual",
      output_variables: ["demo_interest", "preferred_time", "attendees"],
      modality: "verbal",
      next_required_objectives: ["complete_qualification"]
    },
    {
      objective_name: "nurture_lead",
      objective_prompt: "Provide valuable resources and set expectations for future follow-up. Capture contact info for nurturing.",
      confirmation_mode: "auto",
      output_variables: ["nurture_interest", "contact_info", "follow_up_timeline"],
      modality: "verbal",
      next_required_objectives: ["complete_qualification"]
    },
    {
      objective_name: "provide_alternatives",
      objective_prompt: "If they're not a fit, be helpful by suggesting alternative solutions or resources that might better serve their needs.",
      confirmation_mode: "auto",
      output_variables: ["alternatives_provided", "helpful_resources"],
      modality: "verbal",
      next_required_objectives: ["complete_qualification"]
    },
    {
      objective_name: "complete_qualification",
      objective_prompt: "Summarize the conversation outcome, confirm next steps, and thank them for their time.",
      confirmation_mode: "auto",
      output_variables: ["qualification_outcome", "next_steps_confirmed"],
      modality: "verbal"
    }
  ]
};