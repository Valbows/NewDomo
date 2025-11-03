#!/usr/bin/env node

/**
 * Test if a Tavus room URL is valid and accessible
 */

import fetch from 'node-fetch';

const TAVUS_ROOM_URL = 'https://tavus.daily.co/c4fe82e31ff4d43a';

console.log('🔍 Testing Tavus Room Connectivity');
console.log('=================================\n');

console.log(`Testing URL: ${TAVUS_ROOM_URL}\n`);

async function testTavusRoom() {
  try {
    console.log('1. Testing HTTP connectivity...');
    const response = await fetch(TAVUS_ROOM_URL, {
      method: 'HEAD',
      timeout: 10000
    });
    
    console.log(`   Status: ${response.status} ${response.statusText}`);
    console.log(`   Headers:`, Object.fromEntries(response.headers.entries()));
    
    if (response.status === 200) {
      console.log('✅ Room URL is accessible via HTTP\n');
    } else if (response.status === 404) {
      console.log('❌ Room not found (404) - Room may be expired or invalid\n');
      return false;
    } else {
      console.log(`⚠️  Unexpected status: ${response.status}\n`);
    }
    
  } catch (error) {
    console.log('❌ HTTP test failed:', error.message);
    console.log('   This could indicate network issues or invalid URL\n');
    return false;
  }
  
  return true;
}

async function checkDailyCoStatus() {
  try {
    console.log('2. Testing Daily.co service status...');
    const response = await fetch('https://api.daily.co/v1/', {
      timeout: 5000
    });
    
    if (response.status === 401) {
      console.log('✅ Daily.co API is accessible (401 expected without auth)\n');
    } else {
      console.log(`   Daily.co API status: ${response.status}\n`);
    }
  } catch (error) {
    console.log('❌ Daily.co service test failed:', error.message);
    console.log('   This could indicate network connectivity issues\n');
  }
}

// Run tests
console.log('Starting connectivity tests...\n');

Promise.all([
  testTavusRoom(),
  checkDailyCoStatus()
]).then(() => {
  console.log('🎯 Recommendations:');
  console.log('==================');
  console.log('1. If room is 404/expired: Create a new Tavus conversation');
  console.log('2. If network issues: Check firewall/proxy settings');
  console.log('3. Try the E2E mode to bypass Tavus: Add ?e2e=true to URL');
  console.log('4. Check if your organization blocks Daily.co domains\n');
  
  console.log('🔧 Quick Fix - Enable E2E Mode:');
  console.log('===============================');
  console.log('Add this to your .env.development file:');
  console.log('NEXT_PUBLIC_E2E_TEST_MODE=true');
  console.log('');
  console.log('Or add ?e2e=true to your URL:');
  console.log('http://localhost:3000/demos/your-demo-id/experience?e2e=true');
}).catch(error => {
  console.error('Test execution failed:', error);
});