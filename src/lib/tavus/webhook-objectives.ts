/**
 * Webhook URL utilities for Tavus objectives
 * Automatically adds webhook URLs to specific objectives during agent creation
 */

import { ObjectiveDefinition } from './objectives-templates';

/**
 * Get the webhook URL for Tavus callbacks
 * Reads ngrok URL from environment variables to handle dynamic URLs
 */
export function getWebhookUrl(): string {
  // Read tunnel URL from environment variable (permanent tunnel URL)
  const tunnelUrl = process.env.TUNNEL_URL || process.env.NGROK_URL;
  
  // Fallback chain for different deployment scenarios
  let baseUrl;
  if (tunnelUrl) {
    baseUrl = tunnelUrl;
  } else if (process.env.NEXT_PUBLIC_BASE_URL) {
    baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
  } else if (process.env.VERCEL_URL) {
    baseUrl = `https://${process.env.VERCEL_URL}`;
  } else {
    baseUrl = 'http://localhost:3000';
  }
  
  const webhookToken = process.env.TAVUS_WEBHOOK_TOKEN || 'domo_webhook_token_2025';
  
  console.log(`🔗 Generated webhook URL: ${baseUrl}/api/tavus/webhook?t=${webhookToken}`);
  
  return `${baseUrl}/api/tavus/webhook?t=${webhookToken}`;
}

/**
 * Objectives that should automatically have webhook URLs added
 */
const WEBHOOK_ENABLED_OBJECTIVES = [
  'product_interest_discovery',
  'contact_information_collection',
  'capture_contact_info',
  'qualification_complete',
  'lead_qualified'
];

/**
 * Add webhook URLs to objectives that need them
 */
export function addWebhookUrlsToObjectives(objectives: ObjectiveDefinition[]): ObjectiveDefinition[] {
  const webhookUrl = getWebhookUrl();
  
  return objectives.map(objective => {
    // Check if this objective should have a webhook URL
    const needsWebhook = WEBHOOK_ENABLED_OBJECTIVES.some(pattern => 
      objective.objective_name.toLowerCase().includes(pattern.toLowerCase()) ||
      pattern.toLowerCase().includes(objective.objective_name.toLowerCase())
    );
    
    if (needsWebhook) {
      console.log(`🔗 Adding webhook URL to objective: ${objective.objective_name}`);
      return {
        ...objective,
        callback_url: webhookUrl
      };
    }
    
    return objective;
  });
}

/**
 * Create a product interest discovery objective with webhook
 */
export function createProductInterestObjective(): ObjectiveDefinition {
  const webhookUrl = getWebhookUrl();
  
  return {
    objective_name: 'product_interest_discovery',
    objective_prompt: 'What interests you most about our product Workday? Keep follow-up questions brief and to the point.',
    confirmation_mode: 'auto',
    output_variables: ['primary_interest', 'pain_points'],
    modality: 'verbal',
    callback_url: webhookUrl
  };
}

/**
 * Create a contact information collection objective with webhook
 */
export function createContactInfoObjective(): ObjectiveDefinition {
  const webhookUrl = getWebhookUrl();
  
  return {
    objective_name: 'contact_information_collection',
    objective_prompt: 'To provide you with more detailed information and follow up appropriately, could you please share your name, email, and your role at your company?',
    confirmation_mode: 'manual',
    output_variables: ['first_name', 'last_name', 'email', 'position'],
    modality: 'verbal',
    callback_url: webhookUrl
  };
}

/**
 * Enhanced objectives for CUSTOM objectives only - adds webhook URLs to data collection objectives
 * This function is specifically for user-created custom objectives, not hardcoded templates
 */
export function createEnhancedObjectivesWithWebhooks(baseObjectives: ObjectiveDefinition[]): ObjectiveDefinition[] {
  console.log('🔗 Adding webhook URLs to custom objectives...');
  
  // Add webhook URLs to existing objectives that collect data
  const enhancedObjectives = addWebhookUrlsToObjectives(baseObjectives);
  
  // For custom objectives, we ONLY add webhook URLs to existing objectives
  // We don't add new objectives - that's up to the user to configure
  console.log(`✅ Enhanced ${enhancedObjectives.length} custom objectives with webhook URLs`);
  
  return enhancedObjectives;
}