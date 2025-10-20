#!/usr/bin/env tsx
/**
 * Demo Script: Custom Objectives Feature
 * 
 * This script demonstrates the custom objectives feature by creating
 * sample objectives and showing how they integrate with the system.
 */

// Define types locally to avoid Supabase imports
interface ObjectiveDefinition {
  objective_name: string;
  objective_prompt: string;
  confirmation_mode: 'auto' | 'manual';
  output_variables?: string[];
  modality: 'verbal' | 'visual';
  next_conditional_objectives?: Record<string, string>;
  next_required_objectives?: string[];
  callback_url?: string;
}

// Simple validation function for demo
function validateCustomObjectives(objectives: any[]): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!Array.isArray(objectives) || objectives.length === 0) {
    errors.push('At least one objective is required');
    return { valid: false, errors };
  }

  objectives.forEach((obj, index) => {
    if (!obj.objective_name || typeof obj.objective_name !== 'string') {
      errors.push(`Objective ${index + 1}: Name is required`);
    }

    if (!obj.objective_prompt || typeof obj.objective_prompt !== 'string') {
      errors.push(`Objective ${index + 1}: Prompt is required`);
    }

    if (!['auto', 'manual'].includes(obj.confirmation_mode)) {
      errors.push(`Objective ${index + 1}: Invalid confirmation mode`);
    }

    if (!['verbal', 'visual'].includes(obj.modality)) {
      errors.push(`Objective ${index + 1}: Invalid modality`);
    }

    if (obj.output_variables && !Array.isArray(obj.output_variables)) {
      errors.push(`Objective ${index + 1}: Output variables must be an array`);
    }
  });

  return { valid: errors.length === 0, errors };
}

// Sample custom objectives for different demo types
const sampleObjectives = {
  'Product Demo': [
    {
      objective_name: 'welcome_and_qualify',
      objective_prompt: 'Welcome the visitor warmly and understand their role, company size, and what brought them to explore our product today.',
      confirmation_mode: 'auto' as const,
      output_variables: ['visitor_name', 'company_name', 'role', 'company_size', 'trigger_event'],
      modality: 'verbal' as const,
    },
    {
      objective_name: 'show_core_features',
      objective_prompt: 'Demonstrate the 2-3 most relevant core features based on their company size and role. Focus on value and outcomes rather than technical details.',
      confirmation_mode: 'manual' as const,
      output_variables: ['features_shown', 'interest_signals', 'questions_asked'],
      modality: 'visual' as const,
    },
    {
      objective_name: 'address_concerns',
      objective_prompt: 'Proactively address common concerns like pricing, implementation time, security, and integration with existing tools.',
      confirmation_mode: 'auto' as const,
      output_variables: ['concerns_raised', 'objections_handled', 'confidence_level'],
      modality: 'verbal' as const,
    },
    {
      objective_name: 'capture_next_steps',
      objective_prompt: 'Based on their interest level, suggest appropriate next steps: trial signup, sales call, or additional resources. Capture contact information.',
      confirmation_mode: 'manual' as const,
      output_variables: ['next_step_preference', 'contact_info', 'timeline', 'decision_makers'],
      modality: 'verbal' as const,
    },
  ],

  'Lead Qualification': [
    {
      objective_name: 'initial_qualification',
      objective_prompt: 'Quickly assess if they fit our ideal customer profile by understanding their company size, industry, and current challenges.',
      confirmation_mode: 'auto' as const,
      output_variables: ['company_size', 'industry', 'budget_range', 'authority_level'],
      modality: 'verbal' as const,
    },
    {
      objective_name: 'pain_point_discovery',
      objective_prompt: 'Dig deeper into their specific pain points and understand the impact on their business. Quantify the problem when possible.',
      confirmation_mode: 'auto' as const,
      output_variables: ['pain_points', 'business_impact', 'current_solutions', 'urgency'],
      modality: 'verbal' as const,
    },
    {
      objective_name: 'solution_fit_assessment',
      objective_prompt: 'Determine if our solution is a good fit for their needs. If yes, schedule a full demo. If no, provide helpful resources.',
      confirmation_mode: 'manual' as const,
      output_variables: ['solution_fit', 'demo_interest', 'alternative_resources'],
      modality: 'verbal' as const,
    },
  ],

  'Customer Onboarding': [
    {
      objective_name: 'welcome_new_customer',
      objective_prompt: 'Welcome them as a new customer and understand their immediate goals and timeline for getting started.',
      confirmation_mode: 'auto' as const,
      output_variables: ['customer_goals', 'timeline', 'team_size', 'technical_level'],
      modality: 'verbal' as const,
    },
    {
      objective_name: 'show_getting_started',
      objective_prompt: 'Walk them through the essential first steps to get value quickly. Focus on their specific use case and goals.',
      confirmation_mode: 'manual' as const,
      output_variables: ['setup_completed', 'first_use_case', 'blockers_identified'],
      modality: 'visual' as const,
    },
    {
      objective_name: 'provide_resources',
      objective_prompt: 'Share relevant documentation, training materials, and support contacts. Ensure they know how to get help.',
      confirmation_mode: 'auto' as const,
      output_variables: ['resources_shared', 'support_preferences', 'follow_up_scheduled'],
      modality: 'verbal' as const,
    },
  ],
};

function demonstrateValidation() {
  console.log('🔍 Demonstrating Objective Validation\n');

  Object.entries(sampleObjectives).forEach(([type, objectives]) => {
    console.log(`📋 Validating ${type} objectives:`);
    
    const result = validateCustomObjectives(objectives);
    
    if (result.valid) {
      console.log(`  ✅ Valid - ${objectives.length} objectives`);
      objectives.forEach((obj, i) => {
        console.log(`    ${i + 1}. ${obj.objective_name} (${obj.confirmation_mode}, ${obj.modality})`);
      });
    } else {
      console.log(`  ❌ Invalid - ${result.errors.length} errors:`);
      result.errors.forEach(error => console.log(`    - ${error}`));
    }
    console.log('');
  });
}

function demonstrateObjectiveStructure() {
  console.log('📖 Objective Structure Example\n');
  
  const example = sampleObjectives['Product Demo'][0];
  
  console.log('Sample Objective:');
  console.log(JSON.stringify(example, null, 2));
  console.log('');
  
  console.log('Key Components:');
  console.log(`- Name: ${example.objective_name}`);
  console.log(`- Prompt: ${example.objective_prompt.substring(0, 50)}...`);
  console.log(`- Confirmation: ${example.confirmation_mode}`);
  console.log(`- Modality: ${example.modality}`);
  console.log(`- Variables: ${example.output_variables?.join(', ')}`);
  console.log('');
}

function demonstrateUsageFlow() {
  console.log('🔄 Usage Flow Example\n');
  
  console.log('1. User creates custom objectives in Agent Settings');
  console.log('2. Objectives are stored in Supabase database');
  console.log('3. System syncs objectives with Tavus API');
  console.log('4. User activates the objective set');
  console.log('5. New conversations use the custom objectives');
  console.log('6. Agent follows structured conversation flow');
  console.log('7. System captures specified output variables');
  console.log('');
}

function demonstrateBenefits() {
  console.log('💡 Benefits of Custom Objectives\n');
  
  const benefits = [
    'Structured Conversations: Ensure consistent, high-quality demo experiences',
    'Data Capture: Automatically collect important lead information',
    'Personalization: Tailor conversation flows to specific audiences',
    'Optimization: Iterate and improve based on conversation analytics',
    'Scalability: Create multiple objective sets for different scenarios',
    'Integration: Seamlessly works with existing Tavus agent infrastructure',
  ];
  
  benefits.forEach((benefit, i) => {
    console.log(`${i + 1}. ${benefit}`);
  });
  console.log('');
}

function main() {
  console.log('🎯 Custom Demo Objectives - Feature Demonstration\n');
  console.log('='.repeat(60));
  console.log('');
  
  demonstrateObjectiveStructure();
  demonstrateValidation();
  demonstrateUsageFlow();
  demonstrateBenefits();
  
  console.log('🚀 Ready to use Custom Objectives!');
  console.log('');
  console.log('Next steps:');
  console.log('1. Navigate to your demo\'s Agent Settings page');
  console.log('2. Scroll to "Custom Demo Objectives" section');
  console.log('3. Click "New Objective Set" to get started');
  console.log('4. Create your first custom conversation flow');
  console.log('5. Activate it and test with a demo conversation');
}

if (require.main === module) {
  main();
}