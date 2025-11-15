/**
 * Webhook URL Manager
 * Handles dynamic webhook URLs and provides utilities to update existing objectives
 */

import { createObjectivesManager } from './objectives-manager';
import { getWebhookUrl } from './webhook-objectives';

/**
 * Update webhook URLs for all custom objectives when ngrok URL changes
 */
export async function updateWebhookUrlsForAllObjectives(newWebhookUrl?: string): Promise<void> {
  const webhookUrl = newWebhookUrl || getWebhookUrl();
  const objectivesManager = createObjectivesManager();
  
  console.log(`🔄 Updating webhook URLs to: ${webhookUrl}`);
  
  try {
    // Get all objectives
    const allObjectives = await objectivesManager.getAllObjectives();
    
    for (const objective of allObjectives) {
      if (objective.data && objective.data.length > 0) {
        // Check if any objectives in this set need webhook URLs
        const needsUpdate = objective.data.some((obj: any) => 
          obj.objective_name?.toLowerCase().includes('product_interest') ||
          obj.objective_name?.toLowerCase().includes('contact') ||
          obj.objective_name?.toLowerCase().includes('qualification')
        );
        
        if (needsUpdate && objective.uuid) {
          console.log(`📝 Updating objectives: ${objective.name || objective.uuid}`);
          
          // Update objectives with new webhook URL
          const updatedObjectives = objective.data.map((obj: any) => {
            const needsWebhook = obj.objective_name?.toLowerCase().includes('product_interest') ||
                                obj.objective_name?.toLowerCase().includes('contact') ||
                                obj.objective_name?.toLowerCase().includes('qualification');
            
            if (needsWebhook) {
              return { ...obj, callback_url: webhookUrl };
            }
            return obj;
          });
          
          await objectivesManager.updateObjectives(objective.uuid, {
            name: objective.name || 'Updated Objectives',
            description: 'Updated with new webhook URL',
            objectives: updatedObjectives
          });
          
          console.log(`✅ Updated objectives: ${objective.uuid}`);
        }
      }
    }
    
    console.log('🎉 All webhook URLs updated successfully');
  } catch (error) {
    console.error('❌ Error updating webhook URLs:', error);
    throw error;
  }
}

/**
 * Get current webhook URL status
 */
export function getWebhookUrlStatus() {
  const webhookUrl = getWebhookUrl();
  const isNgrok = webhookUrl.includes('ngrok');
  const isLocalhost = webhookUrl.includes('localhost');
  
  return {
    webhookUrl,
    isNgrok,
    isLocalhost,
    isProduction: !isNgrok && !isLocalhost,
    warning: isNgrok ? 'Using ngrok URL - remember to update when ngrok restarts' : null
  };
}

/**
 * Validate webhook URL is accessible
 */
export async function validateWebhookUrl(url?: string): Promise<boolean> {
  const webhookUrl = url || getWebhookUrl();
  
  try {
    // Try to make a HEAD request to the webhook endpoint
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    
    const response = await fetch(webhookUrl.replace('?t=', '?test=true&t='), {
      method: 'HEAD',
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    return response.status === 200 || response.status === 405; // 405 is OK (method not allowed for HEAD)
  } catch (error) {
    console.warn(`⚠️ Webhook URL validation failed: ${error}`);
    return false;
  }
}