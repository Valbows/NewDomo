#!/usr/bin/env node

/**
 * Simple script to update Tavus webhooks using the API directly
 */

const https = require('https');

const TAVUS_API_KEY = process.env.TAVUS_API_KEY || '9e3a9a6a54e44edaa2e456191ba0d0f3';
const TAVUS_BASE_URL = 'https://tavusapi.com/v2';
const WEBHOOK_URL = 'https://domo-kelvin-webhook.loca.lt/api/tavus-webhook?t=domo_webhook_token_2025';

async function makeRequest(path, method = 'GET', data = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, TAVUS_BASE_URL);
    const options = {
      hostname: url.hostname,
      port: url.port || 443,
      path: url.pathname + url.search,
      method: method,
      headers: {
        'x-api-key': TAVUS_API_KEY,
        'Content-Type': 'application/json'
      }
    };

    if (data) {
      const jsonData = JSON.stringify(data);
      options.headers['Content-Length'] = Buffer.byteLength(jsonData);
    }

    const req = https.request(options, (res) => {
      let responseData = '';
      res.on('data', (chunk) => responseData += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(responseData);
          resolve({ status: res.statusCode, data: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, data: responseData });
        }
      });
    });

    req.on('error', reject);
    
    if (data) {
      req.write(JSON.stringify(data));
    }
    
    req.end();
  });
}

async function main() {
  console.log('🔄 Updating Tavus webhooks to permanent URL...\n');
  console.log(`🔗 New webhook URL: ${WEBHOOK_URL}\n`);

  try {
    // Get all objectives
    console.log('📋 Fetching all objectives...');
    const objectivesResponse = await makeRequest('/objectives');
    
    if (objectivesResponse.status !== 200) {
      throw new Error(`Failed to fetch objectives: ${objectivesResponse.status}`);
    }

    const objectives = objectivesResponse.data.data || [];
    console.log(`📊 Found ${objectives.length} objective sets\n`);

    let updatedCount = 0;

    for (const objectiveSet of objectives) {
      if (objectiveSet.data && objectiveSet.data.length > 0) {
        // Check if any objectives need webhook URLs
        const needsUpdate = objectiveSet.data.some(obj => 
          obj.objective_name?.toLowerCase().includes('product_interest') ||
          obj.objective_name?.toLowerCase().includes('contact') ||
          obj.objective_name?.toLowerCase().includes('qualification')
        );

        if (needsUpdate && objectiveSet.uuid) {
          console.log(`📝 Updating objective set: ${objectiveSet.name || objectiveSet.uuid}`);
          
          // Update objectives with new webhook URL
          const updatedObjectives = objectiveSet.data.map(obj => {
            const needsWebhook = obj.objective_name?.toLowerCase().includes('product_interest') ||
                                obj.objective_name?.toLowerCase().includes('contact') ||
                                obj.objective_name?.toLowerCase().includes('qualification');
            
            if (needsWebhook) {
              console.log(`   🔗 Adding webhook to: ${obj.objective_name}`);
              return { ...obj, callback_url: WEBHOOK_URL };
            }
            return obj;
          });

          // Update the objective set
          const updateResponse = await makeRequest(`/objectives/${objectiveSet.uuid}`, 'PUT', {
            name: objectiveSet.name || 'Updated Objectives',
            description: 'Updated with permanent webhook URL',
            objectives: updatedObjectives
          });

          if (updateResponse.status === 200) {
            console.log(`   ✅ Successfully updated: ${objectiveSet.uuid}`);
            updatedCount++;
          } else {
            console.log(`   ❌ Failed to update: ${objectiveSet.uuid} (${updateResponse.status})`);
          }
        }
      }
    }

    console.log(`\n🎉 Successfully updated ${updatedCount} objective sets!`);
    console.log('🔗 Permanent webhook URL: https://domo-kelvin-webhook.loca.lt/api/tavus-webhook');
    console.log('💡 This URL will never change - no more webhook updates needed!');

  } catch (error) {
    console.error('\n❌ Error updating webhooks:', error.message);
    process.exit(1);
  }
}

main();