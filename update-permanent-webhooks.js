#!/usr/bin/env node

/**
 * Update all Tavus webhooks to use the permanent tunnel URL
 */

const { updateWebhookUrlsForAllObjectives, getWebhookUrlStatus } = require('./src/lib/tavus/webhook-url-manager.ts');

async function main() {
  console.log('🔄 Updating all webhooks to use permanent tunnel URL...\n');
  
  // Show current webhook status
  const status = getWebhookUrlStatus();
  console.log('📊 Current webhook status:');
  console.log(`   URL: ${status.webhookUrl}`);
  console.log(`   Type: ${status.isNgrok ? 'ngrok' : status.isLocalhost ? 'localhost' : 'production'}`);
  if (status.warning) {
    console.log(`   ⚠️  ${status.warning}`);
  }
  console.log('');
  
  try {
    // Update all webhook URLs
    await updateWebhookUrlsForAllObjectives();
    
    console.log('\n✅ All webhooks updated successfully!');
    console.log('🔗 Permanent webhook URL: https://domo-kelvin-webhook.loca.lt/api/tavus-webhook');
    console.log('💡 This URL will never change - no more webhook updates needed!');
    
  } catch (error) {
    console.error('\n❌ Error updating webhooks:', error.message);
    process.exit(1);
  }
}

main();