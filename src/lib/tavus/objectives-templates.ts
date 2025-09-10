/**
 * Tavus Persona Objectives Templates for Domo A.I.
 * These define structured conversation workflows for different demo scenarios
 */

export interface ObjectiveDefinition {
  objective_name: string;
  objective_prompt: string;
  confirmation_mode: 'auto' | 'manual';
  output_variables?: string[];
  modality: 'verbal' | 'visual';
  next_conditional_objectives?: Record<string, string>;
  next_required_objectives?: string[];
  callback_url?: string;
}

export interface ObjectivesTemplate {
  name: string;
  description: string;
  objectives: ObjectiveDefinition[];
}

/**
 * Standard Product Demo Objectives
 * Guides users through a complete product demonstration
 */
export const PRODUCT_DEMO_OBJECTIVES: ObjectivesTemplate = {
  name: "Product Demo Flow",
  description: "Complete product demonstration with feature walkthrough and Q&A",
  objectives: [
    {
      objective_name: "welcome_and_qualify",
      objective_prompt: "Welcome the user warmly and understand their role, company size, and primary use case. Ask what specific features or challenges they're most interested in learning about. Collect their name and company for personalization.",
      confirmation_mode: "auto",
      output_variables: ["user_name", "company_name", "role", "company_size", "primary_use_case", "key_interests"],
      modality: "verbal",
      next_conditional_objectives: {
        "show_overview_demo": "If user wants a general overview or is new to the product",
        "show_specific_feature": "If user mentioned specific features they want to see",
        "address_pain_points": "If user described specific challenges or pain points"
      }
    },
    {
      objective_name: "show_overview_demo",
      objective_prompt: "Show the main product overview video that demonstrates the core value proposition and key features. After the video, ask if they have questions about what they saw and what specific area they'd like to explore deeper.",
      confirmation_mode: "auto",
      output_variables: ["overview_completed", "follow_up_interests"],
      modality: "verbal",
      next_required_objectives: ["feature_deep_dive"]
    },
    {
      objective_name: "show_specific_feature",
      objective_prompt: "Show the video that best matches their requested feature or use case. Provide context about how this feature solves their specific challenge. Ask follow-up questions to ensure they understand the value.",
      confirmation_mode: "auto",
      output_variables: ["feature_shown", "user_understanding", "additional_questions"],
      modality: "verbal",
      next_conditional_objectives: {
        "feature_deep_dive": "If user shows interest and wants to see more",
        "handle_objections": "If user has concerns or objections",
        "discuss_next_steps": "If user is satisfied and ready to proceed"
      }
    },
    {
      objective_name: "feature_deep_dive",
      objective_prompt: "Based on their interests, show 2-3 additional feature videos that are most relevant to their use case. Between each video, pause to answer questions and gauge their interest level. Adapt the flow based on their engagement.",
      confirmation_mode: "auto",
      output_variables: ["features_shown", "engagement_level", "key_questions_asked"],
      modality: "verbal",
      next_required_objectives: ["handle_objections"]
    },
    {
      objective_name: "address_pain_points",
      objective_prompt: "Focus on showing videos and features that directly address their mentioned challenges. Explain how each feature solves their specific problems. Get confirmation that they understand the solution.",
      confirmation_mode: "auto",
      output_variables: ["pain_points_addressed", "solution_understanding"],
      modality: "verbal",
      next_required_objectives: ["feature_deep_dive"]
    },
    {
      objective_name: "handle_objections",
      objective_prompt: "Proactively address common concerns like pricing, implementation time, security, or integration challenges. Use your knowledge base to provide detailed, accurate answers. Gauge their comfort level with the solutions.",
      confirmation_mode: "auto",
      output_variables: ["objections_raised", "objections_resolved", "comfort_level"],
      modality: "verbal",
      next_conditional_objectives: {
        "show_social_proof": "If user needs more confidence in the solution",
        "discuss_next_steps": "If objections are resolved and user seems ready"
      }
    },
    {
      objective_name: "show_social_proof",
      objective_prompt: "Share relevant customer success stories, case studies, or testimonials that match their company size and use case. Show any available customer demo videos or results. Build confidence in the solution.",
      confirmation_mode: "auto",
      output_variables: ["social_proof_shared", "confidence_level"],
      modality: "verbal",
      next_required_objectives: ["discuss_next_steps"]
    },
    {
      objective_name: "discuss_next_steps",
      objective_prompt: "Based on their interest level and company fit, suggest appropriate next steps. This could be a trial signup, speaking with sales, getting a custom demo, or accessing additional resources. Gauge their timeline and decision-making process.",
      confirmation_mode: "auto",
      output_variables: ["next_step_preference", "timeline", "decision_makers", "urgency_level"],
      modality: "verbal",
      next_required_objectives: ["capture_contact_info"]
    },
    {
      objective_name: "capture_contact_info",
      objective_prompt: "If they're interested in next steps, collect their contact information and preferred communication method. Confirm their details and set expectations for follow-up. Thank them for their time and interest.",
      confirmation_mode: "manual",
      output_variables: ["email", "phone", "preferred_contact_method", "best_time_to_contact"],
      modality: "verbal",
      next_required_objectives: ["complete_demo"]
    },
    {
      objective_name: "complete_demo",
      objective_prompt: "Summarize what was covered, confirm their next steps, and provide any promised resources or links. End on a positive note and show the call-to-action for their chosen next step.",
      confirmation_mode: "auto",
      output_variables: ["demo_summary", "resources_provided", "satisfaction_level"],
      modality: "verbal"
    }
  ]
};

/**
 * Lead Qualification Objectives
 * Focused on qualifying prospects before full demo
 */
export const LEAD_QUALIFICATION_OBJECTIVES: ObjectivesTemplate = {
  name: "Lead Qualification Flow",
  description: "Qualify leads before investing time in full product demonstration",
  objectives: [
    {
      objective_name: "initial_greeting",
      objective_prompt: "Warmly greet the visitor and ask what brought them to learn about the product today. Understand their immediate need or trigger event.",
      confirmation_mode: "auto",
      output_variables: ["trigger_event", "immediate_need"],
      modality: "verbal",
      next_required_objectives: ["qualify_company_fit"]
    },
    {
      objective_name: "qualify_company_fit",
      objective_prompt: "Determine if they fit the ideal customer profile by asking about company size, industry, current tools, and team structure. Be conversational but gather key qualifying information.",
      confirmation_mode: "auto",
      output_variables: ["company_size", "industry", "current_tools", "team_size", "fit_score"],
      modality: "verbal",
      next_conditional_objectives: {
        "qualify_budget_authority": "If company fit is good",
        "provide_alternative_resources": "If company fit is poor"
      }
    },
    {
      objective_name: "qualify_budget_authority",
      objective_prompt: "Understand their budget range, decision-making process, and timeline. Ask about who else would be involved in the decision and what their evaluation process looks like.",
      confirmation_mode: "auto",
      output_variables: ["budget_range", "decision_makers", "evaluation_timeline", "authority_level"],
      modality: "verbal",
      next_conditional_objectives: {
        "schedule_full_demo": "If budget and authority are qualified",
        "nurture_lead": "If not ready to buy but good long-term prospect"
      }
    },
    {
      objective_name: "schedule_full_demo",
      objective_prompt: "Since they're qualified, offer to schedule a personalized demo with a product expert who can show them exactly how the solution would work for their specific use case.",
      confirmation_mode: "manual",
      output_variables: ["demo_scheduled", "preferred_time", "attendees", "specific_focus_areas"],
      modality: "verbal",
      next_required_objectives: ["capture_scheduling_info"]
    },
    {
      objective_name: "nurture_lead",
      objective_prompt: "Provide valuable resources like case studies, ROI calculators, or educational content. Capture their contact info for future nurturing and set expectations for follow-up.",
      confirmation_mode: "auto",
      output_variables: ["resources_provided", "nurture_timeline", "contact_captured"],
      modality: "verbal",
      next_required_objectives: ["complete_qualification"]
    },
    {
      objective_name: "provide_alternative_resources",
      objective_prompt: "If they're not a good fit, be helpful by suggesting alternative solutions or resources that might better serve their needs. Maintain a positive relationship.",
      confirmation_mode: "auto",
      output_variables: ["alternatives_suggested", "relationship_maintained"],
      modality: "verbal",
      next_required_objectives: ["complete_qualification"]
    },
    {
      objective_name: "capture_scheduling_info",
      objective_prompt: "Collect all necessary information to schedule their demo: contact details, preferred times, attendees, and specific topics they want covered.",
      confirmation_mode: "manual",
      output_variables: ["contact_info", "scheduling_preferences", "demo_requirements"],
      modality: "verbal",
      next_required_objectives: ["complete_qualification"]
    },
    {
      objective_name: "complete_qualification",
      objective_prompt: "Summarize the next steps, confirm all collected information, and thank them for their time. Ensure they know what to expect next.",
      confirmation_mode: "auto",
      output_variables: ["next_steps_confirmed", "expectations_set"],
      modality: "verbal"
    }
  ]
};

/**
 * Customer Support Demo Objectives
 * For existing customers learning new features
 */
export const CUSTOMER_SUPPORT_OBJECTIVES: ObjectivesTemplate = {
  name: "Customer Support & Training",
  description: "Help existing customers learn new features and solve problems",
  objectives: [
    {
      objective_name: "identify_customer",
      objective_prompt: "Confirm they're an existing customer and understand what specific feature, problem, or question brought them here today.",
      confirmation_mode: "auto",
      output_variables: ["customer_status", "specific_need", "urgency_level"],
      modality: "verbal",
      next_conditional_objectives: {
        "troubleshoot_issue": "If they have a specific problem to solve",
        "feature_training": "If they want to learn new features",
        "best_practices": "If they want optimization advice"
      }
    },
    {
      objective_name: "troubleshoot_issue",
      objective_prompt: "Understand their specific issue in detail. Show relevant troubleshooting videos or walk them through solutions step-by-step. Confirm the issue is resolved.",
      confirmation_mode: "manual",
      output_variables: ["issue_description", "solution_provided", "issue_resolved"],
      modality: "verbal",
      next_conditional_objectives: {
        "prevent_future_issues": "If issue is resolved",
        "escalate_to_support": "If issue requires human support"
      }
    },
    {
      objective_name: "feature_training",
      objective_prompt: "Show them how to use the specific features they're interested in. Provide step-by-step guidance and check their understanding. Offer additional related features that might help.",
      confirmation_mode: "auto",
      output_variables: ["features_learned", "competency_level", "additional_interests"],
      modality: "verbal",
      next_required_objectives: ["provide_resources"]
    },
    {
      objective_name: "best_practices",
      objective_prompt: "Share best practices and optimization tips relevant to their use case. Show examples of how other customers achieve success. Identify areas for improvement.",
      confirmation_mode: "auto",
      output_variables: ["best_practices_shared", "optimization_opportunities"],
      modality: "verbal",
      next_required_objectives: ["provide_resources"]
    },
    {
      objective_name: "prevent_future_issues",
      objective_prompt: "Provide tips and resources to prevent similar issues in the future. Show them relevant documentation or training materials.",
      confirmation_mode: "auto",
      output_variables: ["prevention_tips_provided", "resources_shared"],
      modality: "verbal",
      next_required_objectives: ["complete_support"]
    },
    {
      objective_name: "escalate_to_support",
      objective_prompt: "If the issue requires human support, collect detailed information about the problem and connect them with the appropriate support channel.",
      confirmation_mode: "manual",
      output_variables: ["escalation_details", "support_ticket_created"],
      modality: "verbal",
      next_required_objectives: ["complete_support"]
    },
    {
      objective_name: "provide_resources",
      objective_prompt: "Share relevant documentation, video tutorials, or other resources they can reference later. Ensure they know how to access ongoing support.",
      confirmation_mode: "auto",
      output_variables: ["resources_provided", "support_access_confirmed"],
      modality: "verbal",
      next_required_objectives: ["complete_support"]
    },
    {
      objective_name: "complete_support",
      objective_prompt: "Summarize what was accomplished, confirm they have what they need, and ask if there's anything else you can help with today.",
      confirmation_mode: "auto",
      output_variables: ["session_summary", "satisfaction_level", "additional_needs"],
      modality: "verbal"
    }
  ]
};

/**
 * All available objectives templates
 */
export const OBJECTIVES_TEMPLATES = {
  PRODUCT_DEMO: PRODUCT_DEMO_OBJECTIVES,
  LEAD_QUALIFICATION: LEAD_QUALIFICATION_OBJECTIVES,
  CUSTOMER_SUPPORT: CUSTOMER_SUPPORT_OBJECTIVES,
} as const;

export type ObjectivesTemplateKey = keyof typeof OBJECTIVES_TEMPLATES;