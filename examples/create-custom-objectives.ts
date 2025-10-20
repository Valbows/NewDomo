/**
 * Example: Creating Custom Demo Objectives
 * 
 * This example shows how to create custom objectives for a demo
 * that will be used by the Tavus agent during conversations.
 */

import { createCustomObjective } from '@/lib/supabase/custom-objectives';
import { ObjectiveDefinition } from '@/lib/tavus/objectives-templates';

// Example: E-commerce Product Demo Objectives
const ecommerceObjectives: ObjectiveDefinition[] = [
  {
    objective_name: 'welcome_and_qualify',
    objective_prompt: 'Welcome the visitor and understand what type of e-commerce business they run. Ask about their current platform, monthly sales volume, and main challenges with their current setup.',
    confirmation_mode: 'auto',
    output_variables: ['business_type', 'current_platform', 'monthly_sales', 'main_challenges'],
    modality: 'verbal',
    next_required_objectives: ['show_relevant_features']
  },
  {
    objective_name: 'show_relevant_features',
    objective_prompt: 'Based on their business type and challenges, show the most relevant product features. For small businesses, focus on ease of use and setup. For enterprise, focus on scalability and integrations.',
    confirmation_mode: 'auto',
    output_variables: ['features_shown', 'interest_level'],
    modality: 'verbal',
    next_conditional_objectives: {
      'show_integration_demo': 'If they mentioned integration needs',
      'show_analytics_demo': 'If they want to see reporting features',
      'discuss_pricing': 'If they seem ready to talk about costs'
    }
  },
  {
    objective_name: 'show_integration_demo',
    objective_prompt: 'Demonstrate how our platform integrates with their existing tools. Show specific integrations they mentioned needing.',
    confirmation_mode: 'manual',
    output_variables: ['integrations_of_interest', 'technical_requirements'],
    modality: 'visual',
    next_required_objectives: ['address_concerns']
  },
  {
    objective_name: 'show_analytics_demo',
    objective_prompt: 'Show the analytics and reporting dashboard. Highlight metrics that matter most to their business type.',
    confirmation_mode: 'manual',
    output_variables: ['analytics_interest', 'key_metrics'],
    modality: 'visual',
    next_required_objectives: ['address_concerns']
  },
  {
    objective_name: 'address_concerns',
    objective_prompt: 'Proactively address common concerns like migration complexity, downtime, training needs, and ongoing support.',
    confirmation_mode: 'auto',
    output_variables: ['concerns_raised', 'concerns_resolved'],
    modality: 'verbal',
    next_required_objectives: ['discuss_pricing']
  },
  {
    objective_name: 'discuss_pricing',
    objective_prompt: 'Present pricing options that fit their business size and needs. Focus on ROI and value rather than just features.',
    confirmation_mode: 'auto',
    output_variables: ['pricing_tier_interest', 'budget_range', 'decision_timeline'],
    modality: 'verbal',
    next_required_objectives: ['schedule_next_steps']
  },
  {
    objective_name: 'schedule_next_steps',
    objective_prompt: 'Based on their interest level, suggest appropriate next steps: free trial, technical consultation, or speaking with sales team.',
    confirmation_mode: 'manual',
    output_variables: ['next_step_preference', 'contact_info', 'follow_up_timeline'],
    modality: 'verbal'
  }
];

// Example: SaaS Security Demo Objectives
const securitySaasObjectives: ObjectiveDefinition[] = [
  {
    objective_name: 'security_assessment',
    objective_prompt: 'Understand their current security posture, compliance requirements, and any recent security incidents or concerns.',
    confirmation_mode: 'auto',
    output_variables: ['current_security_tools', 'compliance_needs', 'security_incidents', 'team_size'],
    modality: 'verbal',
    next_required_objectives: ['demonstrate_threat_detection']
  },
  {
    objective_name: 'demonstrate_threat_detection',
    objective_prompt: 'Show real-time threat detection capabilities. Use examples relevant to their industry and demonstrate how threats are identified and mitigated.',
    confirmation_mode: 'manual',
    output_variables: ['threat_types_of_interest', 'detection_speed_importance'],
    modality: 'visual',
    next_required_objectives: ['show_compliance_features']
  },
  {
    objective_name: 'show_compliance_features',
    objective_prompt: 'Demonstrate compliance reporting and audit trail features. Focus on the specific compliance frameworks they mentioned (SOC2, GDPR, HIPAA, etc.).',
    confirmation_mode: 'manual',
    output_variables: ['compliance_frameworks', 'audit_requirements'],
    modality: 'visual',
    next_required_objectives: ['discuss_implementation']
  },
  {
    objective_name: 'discuss_implementation',
    objective_prompt: 'Address implementation timeline, integration with existing tools, and training requirements. Emphasize minimal disruption to current operations.',
    confirmation_mode: 'auto',
    output_variables: ['implementation_timeline', 'integration_complexity', 'training_needs'],
    modality: 'verbal',
    next_required_objectives: ['provide_security_assessment']
  },
  {
    objective_name: 'provide_security_assessment',
    objective_prompt: 'Offer a free security assessment or trial to demonstrate value. Capture their contact information and preferred next steps.',
    confirmation_mode: 'manual',
    output_variables: ['assessment_interest', 'contact_details', 'urgency_level'],
    modality: 'verbal'
  }
];

/**
 * Create custom objectives for a demo
 */
export async function createEcommerceObjectives(demoId: string) {
  try {
    const customObjective = await createCustomObjective({
      demo_id: demoId,
      name: 'E-commerce Platform Demo',
      description: 'Comprehensive demo flow for e-commerce businesses focusing on platform migration and growth',
      objectives: ecommerceObjectives,
    });

    console.log('✅ Created e-commerce objectives:', customObjective.id);
    return customObjective;
  } catch (error) {
    console.error('❌ Failed to create e-commerce objectives:', error);
    throw error;
  }
}

/**
 * Create security SaaS objectives for a demo
 */
export async function createSecuritySaasObjectives(demoId: string) {
  try {
    const customObjective = await createCustomObjective({
      demo_id: demoId,
      name: 'Security SaaS Demo',
      description: 'Security-focused demo for enterprise customers with compliance requirements',
      objectives: securitySaasObjectives,
    });

    console.log('✅ Created security SaaS objectives:', customObjective.id);
    return customObjective;
  } catch (error) {
    console.error('❌ Failed to create security SaaS objectives:', error);
    throw error;
  }
}

/**
 * Example usage:
 * 
 * // For an e-commerce demo
 * await createEcommerceObjectives('your-demo-id');
 * 
 * // For a security SaaS demo
 * await createSecuritySaasObjectives('your-demo-id');
 */