#!/usr/bin/env node
/**
 * Test script to verify webhook endpoints are working correctly
 * Tests both qualification and product interest webhooks
 */

const BASE_URL = 'http://localhost:3000';

// Test data that simulates what Tavus will send
const testPayloads = {
  qualification: {
    conversation_id: "test_conversation_123",
    event_type: "conversation.objective.completed",
    message_type: "conversation",
    properties: {
      objective_name: "greeting_and_qualification",
      output_variables: {
        first_name: "John",
        last_name: "Doe", 
        email: "john.doe@example.com",
        position: "Software Engineer"
      }
    }
  },
  
  productInterest: {
    conversation_id: "test_conversation_123",
    event_type: "conversation.objective.completed", 
    message_type: "conversation",
    properties: {
      objective_name: "product_interest_discovery",
      output_variables: {
        primary_interest: "HR management and workforce analytics",
        pain_points: ["Manual time tracking", "Lack of real-time reporting", "Complex approval workflows"]
      }
    }
  }
};

async function testEndpoint(name, url, payload) {
  console.log(`\n🧪 Testing ${name} webhook...`);
  console.log(`📡 URL: ${url}`);
  console.log(`📋 Payload:`, JSON.stringify(payload, null, 2));
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload)
    });
    
    const responseText = await response.text();
    let responseData;
    
    try {
      responseData = JSON.parse(responseText);
    } catch {
      responseData = responseText;
    }
    
    console.log(`📊 Status: ${response.status} ${response.statusText}`);
    console.log(`📄 Response:`, responseData);
    
    if (response.ok) {
      console.log(`✅ ${name} webhook test PASSED`);
      return true;
    } else {
      console.log(`❌ ${name} webhook test FAILED`);
      return false;
    }
    
  } catch (error) {
    console.log(`❌ ${name} webhook test ERROR:`, error.message);
    return false;
  }
}

async function testHealthEndpoints() {
  console.log('🏥 Testing health endpoints...');
  
  const endpoints = [
    { name: 'Qualification Health', url: `${BASE_URL}/api/webhook/qualification` },
    { name: 'Product Interest Health', url: `${BASE_URL}/api/webhook/product-interest` }
  ];
  
  for (const endpoint of endpoints) {
    try {
      const response = await fetch(endpoint.url, { method: 'GET' });
      const data = await response.json();
      
      if (response.ok) {
        console.log(`✅ ${endpoint.name}: ${data.message}`);
      } else {
        console.log(`❌ ${endpoint.name}: Failed`);
      }
    } catch (error) {
      console.log(`❌ ${endpoint.name}: ${error.message}`);
    }
  }
}

async function checkDatabaseTables() {
  console.log('\n📊 Checking database tables...');
  
  const tables = [
    { name: 'Qualification Data', url: `${BASE_URL}/api/qualification-data` },
    { name: 'Product Interest Data', url: `${BASE_URL}/api/product-interest-data` }
  ];
  
  for (const table of tables) {
    try {
      const response = await fetch(table.url);
      
      if (response.ok) {
        const data = await response.json();
        console.log(`✅ ${table.name}: ${data.length || 0} records`);
        
        // Show recent records
        if (data.length > 0) {
          const recent = data.slice(-2); // Last 2 records
          console.log(`   Recent records:`, recent.map(r => ({
            id: r.id,
            conversation_id: r.conversation_id,
            received_at: r.received_at
          })));
        }
      } else {
        console.log(`❌ ${table.name}: API not available`);
      }
    } catch (error) {
      console.log(`❌ ${table.name}: ${error.message}`);
    }
  }
}

async function testTavusWebhookHandler() {
  console.log('\n🎯 Testing main Tavus webhook handler...');
  
  const webhookUrl = `${BASE_URL}/api/tavus-webhook?t=domo_webhook_token_2025`;
  
  // Test with qualification objective
  console.log('\n📋 Testing qualification objective through main handler...');
  const qualResult = await testEndpoint('Main Handler (Qualification)', webhookUrl, testPayloads.qualification);
  
  // Test with product interest objective  
  console.log('\n📋 Testing product interest objective through main handler...');
  const interestResult = await testEndpoint('Main Handler (Product Interest)', webhookUrl, testPayloads.productInterest);
  
  return qualResult && interestResult;
}

async function runAllTests() {
  console.log('🚀 Webhook Test Suite');
  console.log('='.repeat(50));
  console.log(`Testing against: ${BASE_URL}`);
  console.log('');
  
  // Test 1: Health checks
  await testHealthEndpoints();
  
  // Test 2: Direct webhook endpoints
  console.log('\n🎯 Testing direct webhook endpoints...');
  const qualResult = await testEndpoint(
    'Qualification Webhook', 
    `${BASE_URL}/api/webhook/qualification`, 
    testPayloads.qualification
  );
  
  const interestResult = await testEndpoint(
    'Product Interest Webhook',
    `${BASE_URL}/api/webhook/product-interest`, 
    testPayloads.productInterest
  );
  
  // Test 3: Main Tavus webhook handler
  const mainHandlerResult = await testTavusWebhookHandler();
  
  // Test 4: Check database
  await checkDatabaseTables();
  
  // Summary
  console.log('\n' + '='.repeat(50));
  console.log('📊 TEST SUMMARY');
  console.log('='.repeat(50));
  
  const results = [
    { name: 'Qualification Webhook', passed: qualResult },
    { name: 'Product Interest Webhook', passed: interestResult },
    { name: 'Main Webhook Handler', passed: mainHandlerResult }
  ];
  
  results.forEach(result => {
    const status = result.passed ? '✅ PASS' : '❌ FAIL';
    console.log(`${status} ${result.name}`);
  });
  
  const allPassed = results.every(r => r.passed);
  
  if (allPassed) {
    console.log('\n🎉 ALL TESTS PASSED!');
    console.log('Your webhook system is ready to receive data from Tavus.');
    console.log('');
    console.log('🚀 Next steps:');
    console.log('1. Create a new agent in your demo settings');
    console.log('2. Start a conversation to test the real flow');
    console.log('3. Check the database for captured data');
  } else {
    console.log('\n⚠️  SOME TESTS FAILED');
    console.log('Check the error messages above and fix any issues.');
  }
  
  console.log('\n📊 Monitor your data:');
  console.log(`- Qualification data: ${BASE_URL}/api/qualification-data`);
  console.log(`- Product interest data: ${BASE_URL}/api/product-interest-data`);
}

// Handle command line arguments
const args = process.argv.slice(2);

if (args.includes('--help') || args.includes('-h')) {
  console.log('Webhook Test Suite');
  console.log('');
  console.log('Usage: node test-webhooks.js [options]');
  console.log('');
  console.log('Options:');
  console.log('  --health    Test health endpoints only');
  console.log('  --data      Check database tables only');
  console.log('  --qual      Test qualification webhook only');
  console.log('  --interest  Test product interest webhook only');
  console.log('  --help      Show this help message');
  console.log('');
  console.log('Examples:');
  console.log('  node test-webhooks.js           # Run all tests');
  console.log('  node test-webhooks.js --health  # Health check only');
  console.log('  node test-webhooks.js --qual    # Test qualification only');
  process.exit(0);
}

// Run specific tests based on arguments
if (args.includes('--health')) {
  testHealthEndpoints();
} else if (args.includes('--data')) {
  checkDatabaseTables();
} else if (args.includes('--qual')) {
  testEndpoint('Qualification Webhook', `${BASE_URL}/api/webhook/qualification`, testPayloads.qualification);
} else if (args.includes('--interest')) {
  testEndpoint('Product Interest Webhook', `${BASE_URL}/api/webhook/product-interest`, testPayloads.productInterest);
} else {
  // Run all tests
  runAllTests();
}