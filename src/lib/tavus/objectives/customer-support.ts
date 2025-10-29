/**
 * Customer Support Objectives Template
 * For existing customers learning new features and solving problems
 */

import { ObjectivesTemplate } from './types';

export const CUSTOMER_SUPPORT_OBJECTIVES: ObjectivesTemplate = {
  name: "Customer Support & Training",
  description: "Help existing customers learn new features and solve problems",
  objectives: [
    {
      objective_name: "identify_customer",
      objective_prompt:
        "Confirm they're an existing customer and understand what specific feature, problem, or question brought them here today.",
      confirmation_mode: "auto",
      output_variables: ["customer_status", "specific_need", "urgency_level"],
      modality: "verbal",
      next_conditional_objectives: {
        troubleshoot_issue: "If they have a specific problem to solve",
        feature_training: "If they want to learn new features",
        best_practices: "If they want optimization advice",
      },
    },
    {
      objective_name: "troubleshoot_issue",
      objective_prompt:
        "Understand their specific issue in detail. Show relevant troubleshooting videos or walk them through solutions step-by-step. Confirm the issue is resolved.",
      confirmation_mode: "manual",
      output_variables: [
        "issue_description",
        "solution_provided",
        "issue_resolved",
      ],
      modality: "verbal",
      next_conditional_objectives: {
        prevent_future_issues: "If issue is resolved",
        escalate_to_support: "If issue requires human support",
      },
    },
    {
      objective_name: "feature_training",
      objective_prompt:
        "Show them how to use the specific features they're interested in. Provide step-by-step guidance and check their understanding. Offer additional related features that might help.",
      confirmation_mode: "auto",
      output_variables: [
        "features_learned",
        "competency_level",
        "additional_interests",
      ],
      modality: "verbal",
      next_required_objectives: ["provide_resources"],
    },
    {
      objective_name: "best_practices",
      objective_prompt:
        "Share best practices and optimization tips relevant to their use case. Show examples of how other customers achieve success. Identify areas for improvement.",
      confirmation_mode: "auto",
      output_variables: ["best_practices_shared", "optimization_opportunities"],
      modality: "verbal",
      next_required_objectives: ["provide_resources"],
    },
    {
      objective_name: "prevent_future_issues",
      objective_prompt:
        "Provide tips and resources to prevent similar issues in the future. Show them relevant documentation or training materials.",
      confirmation_mode: "auto",
      output_variables: ["prevention_tips_provided", "resources_shared"],
      modality: "verbal",
      next_required_objectives: ["complete_support"],
    },
    {
      objective_name: "escalate_to_support",
      objective_prompt:
        "If the issue requires human support, collect detailed information about the problem and connect them with the appropriate support channel.",
      confirmation_mode: "manual",
      output_variables: ["escalation_details", "support_ticket_created"],
      modality: "verbal",
      next_required_objectives: ["complete_support"],
    },
    {
      objective_name: "provide_resources",
      objective_prompt:
        "Share relevant documentation, video tutorials, or other resources they can reference later. Ensure they know how to access ongoing support.",
      confirmation_mode: "auto",
      output_variables: ["resources_provided", "support_access_confirmed"],
      modality: "verbal",
      next_required_objectives: ["complete_support"],
    },
    {
      objective_name: "complete_support",
      objective_prompt:
        "Summarize what was accomplished, confirm they have what they need, and ask if there's anything else you can help with today.",
      confirmation_mode: "auto",
      output_variables: [
        "session_summary",
        "satisfaction_level",
        "additional_needs",
      ],
      modality: "verbal",
    },
  ],
};