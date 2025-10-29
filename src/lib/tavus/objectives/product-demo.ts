/**
 * Product Demo Objectives Template
 * Guides users through a complete product demonstration
 */

import { ObjectivesTemplate } from './types';

export const PRODUCT_DEMO_OBJECTIVES: ObjectivesTemplate = {
  name: "Product Demo Flow",
  description:
    "Complete product demonstration with feature walkthrough and Q&A",
  objectives: [
    {
      objective_name: "introduce_domo_agent",
      objective_prompt:
        "Introduce yourself as Domo A.I., an intelligent demo assistant with comprehensive knowledge about the product. Explain that you can show relevant videos, answer detailed questions, and guide them through features that matter most to their specific needs. Set expectations for an interactive, personalized demo experience.",
      confirmation_mode: "auto",
      output_variables: ["introduction_completed", "user_acknowledgment"],
      modality: "verbal",
      next_required_objectives: ["needs_discovery"],
    },
    {
      objective_name: "needs_discovery",
      objective_prompt:
        "Conduct thorough needs discovery by understanding their current challenges, goals, and what success looks like for them. Ask about their role, company size, current tools they use, and specific pain points they're trying to solve. Focus on understanding their 'why' before showing any features.",
      confirmation_mode: "auto",
      output_variables: [
        "user_name",
        "company_name",
        "role",
        "company_size",
        "current_challenges",
        "success_criteria",
        "current_tools",
        "pain_points",
      ],
      modality: "verbal",
      next_conditional_objectives: {
        explain_and_show_overview:
          "If user wants a general overview or is new to the product",
        explain_and_show_specific_feature:
          "If user mentioned specific features they want to see",
        address_pain_points:
          "If user described specific challenges or pain points",
      },
    },
    {
      objective_name: "explain_and_show_overview",
      objective_prompt:
        "Before showing any video, explain what they're about to see and why it's relevant to their specific needs. Say something like 'Based on what you've told me about [their challenge], I'm going to show you our main overview that demonstrates how we solve exactly that problem. This video will show you [specific benefits relevant to them].' Then show the overview video. After the video, connect what they saw back to their specific situation and ask what resonated most.",
      confirmation_mode: "auto",
      output_variables: [
        "explanation_given",
        "video_shown",
        "user_connection",
        "key_resonance",
      ],
      modality: "verbal",
      next_required_objectives: ["feature_deep_dive"],
    },
    {
      objective_name: "explain_and_show_specific_feature",
      objective_prompt:
        "Before showing the feature video, explain exactly what they're about to see and how it addresses their specific challenge. Say 'I'm going to show you [feature name] which directly solves your [specific pain point]. In this video, you'll see how [specific benefit for their use case].' Then show the video. After, ask specific questions about how this would work in their environment.",
      confirmation_mode: "auto",
      output_variables: [
        "feature_explanation_given",
        "feature_shown",
        "user_understanding",
        "implementation_questions",
      ],
      modality: "verbal",
      next_conditional_objectives: {
        feature_deep_dive: "If user shows interest and wants to see more",
        handle_objections: "If user has concerns or objections",
        discuss_next_steps: "If user is satisfied and ready to proceed",
      },
    },
    {
      objective_name: "feature_deep_dive",
      objective_prompt:
        "For each additional feature video, first explain what they're about to see and why it's relevant: 'Now I want to show you [feature] because you mentioned [their specific need]. This will demonstrate how you can [specific outcome they want].' Show the video, then pause to discuss how it applies to their situation. Repeat this explain-show-discuss pattern for 2-3 features most relevant to their use case.",
      confirmation_mode: "auto",
      output_variables: [
        "features_explained_and_shown",
        "engagement_level",
        "application_discussions",
        "relevance_confirmed",
      ],
      modality: "verbal",
      next_required_objectives: ["handle_objections"],
    },
    {
      objective_name: "address_pain_points",
      objective_prompt:
        "Before showing any videos, explain how each feature directly addresses their specific pain points. Say 'You mentioned [their challenge], so I want to show you exactly how we solve that. This video will demonstrate [specific solution].' Show the relevant videos with context. After each video, confirm they understand how it solves their specific problem.",
      confirmation_mode: "auto",
      output_variables: [
        "pain_points_explained",
        "solutions_demonstrated",
        "understanding_confirmed",
      ],
      modality: "verbal",
      next_required_objectives: ["feature_deep_dive"],
    },
    {
      objective_name: "handle_objections",
      objective_prompt:
        "Proactively address common concerns like pricing, implementation time, security, or integration challenges. Use your knowledge base to provide detailed, accurate answers. Gauge their comfort level with the solutions.",
      confirmation_mode: "auto",
      output_variables: [
        "objections_raised",
        "objections_resolved",
        "comfort_level",
      ],
      modality: "verbal",
      next_conditional_objectives: {
        show_social_proof: "If user needs more confidence in the solution",
        discuss_next_steps: "If objections are resolved and user seems ready",
      },
    },
    {
      objective_name: "show_social_proof",
      objective_prompt:
        "Share relevant customer success stories, case studies, or testimonials that match their company size and use case. Show any available customer demo videos or results. Build confidence in the solution.",
      confirmation_mode: "auto",
      output_variables: ["social_proof_shared", "confidence_level"],
      modality: "verbal",
      next_required_objectives: ["discuss_next_steps"],
    },
    {
      objective_name: "discuss_next_steps",
      objective_prompt:
        "Based on their interest level and company fit, suggest appropriate next steps. This could be a trial signup, speaking with sales, getting a custom demo, or accessing additional resources. Gauge their timeline and decision-making process.",
      confirmation_mode: "auto",
      output_variables: [
        "next_step_preference",
        "timeline",
        "decision_makers",
        "urgency_level",
      ],
      modality: "verbal",
      next_required_objectives: ["capture_contact_info"],
    },
    {
      objective_name: "capture_contact_info",
      objective_prompt:
        "If they're interested in next steps, collect their contact information and preferred communication method. Confirm their details and set expectations for follow-up. Thank them for their time and interest.",
      confirmation_mode: "manual",
      output_variables: [
        "email",
        "phone",
        "preferred_contact_method",
        "best_time_to_contact",
      ],
      modality: "verbal",
      next_required_objectives: ["complete_demo"],
    },
    {
      objective_name: "complete_demo",
      objective_prompt:
        "Summarize what was covered, confirm their next steps, and provide any promised resources or links. End on a positive note and show the call-to-action for their chosen next step.",
      confirmation_mode: "auto",
      output_variables: [
        "demo_summary",
        "resources_provided",
        "satisfaction_level",
      ],
      modality: "verbal",
    },
  ],
};