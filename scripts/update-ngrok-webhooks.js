#!/usr/bin/env node

/**
 * Script to update webhook URLs when ngrok restarts
 * Usage: node scripts/update-ngrok-webhooks.js [new-ngrok-url]
 */

const https = require('https');
const http = require('http');

const API_ENDPOINT = 'http://localhost:3000/api/update-webhook-urls';

async function updateWebhookUrls(newUrl) {
  return new Promise((resolve, reject) => {
    const postData = newUrl ? JSON.stringify({ newWebhookUrl: newUrl }) : '';
    
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: '/api/update-webhook-urls',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          resolve(response);
        } catch (error) {
          reject(new Error('Invalid JSON response'));
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (postData) {
      req.write(postData);
    }
    req.end();
  });
}

async function main() {
  const newUrl = process.argv[2];
  
  console.log('🔄 Updating webhook URLs...');
  if (newUrl) {
    console.log(`📝 New URL: ${newUrl}`);
  } else {
    console.log('📝 Using URL from environment variables');
  }
  
  try {
    const result = await updateWebhookUrls(newUrl);
    
    if (result.success) {
      console.log('✅ Success!');
      console.log(`🔗 Webhook URL: ${result.newWebhookUrl}`);
      console.log(`📊 Status: ${result.status.isNgrok ? 'Using ngrok' : 'Production'}`);
    } else {
      console.error('❌ Failed:', result.error);
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.log('\n💡 Make sure your Next.js server is running on localhost:3000');
    process.exit(1);
  }
}

main();