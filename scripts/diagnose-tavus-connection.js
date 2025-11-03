#!/usr/bin/env node

/**
 * Comprehensive Tavus connection diagnosis
 */

import fetch from 'node-fetch';

const NEW_ROOM_URL = 'https://tavus.daily.co/ca044349a5ba247a';
const TAVUS_API_KEY = '9e3a9a6a54e44edaa2e456191ba0d0f3';
const TAVUS_BASE_URL = 'https://tavusapi.com/v2';

async function diagnoseTavusConnection() {
  console.log('🔍 Comprehensive Tavus Connection Diagnosis');
  console.log('==========================================\n');

  // Test 1: Basic HTTP connectivity to room
  console.log('1. Testing HTTP connectivity to Tavus room...');
  try {
    const response = await fetch(NEW_ROOM_URL, { 
      method: 'HEAD',
      timeout: 10000 
    });
    console.log(`   Status: ${response.status} ${response.statusText}`);
    
    if (response.status === 200) {
      console.log('   ✅ Room is accessible via HTTP');
    } else if (response.status === 404) {
      console.log('   ❌ Room not found (404) - Room may not exist');
    } else {
      console.log(`   ⚠️  Unexpected status: ${response.status}`);
    }
  } catch (error) {
    console.log('   ❌ HTTP connectivity failed:', error.message);
  }

  console.log('');

  // Test 2: Check Tavus API conversation status
  console.log('2. Checking conversation status via Tavus API...');
  try {
    const conversationId = 'ca044349a5ba247a';
    const response = await fetch(`${TAVUS_BASE_URL}/conversations/${conversationId}`, {
      headers: {
        'x-api-key': TAVUS_API_KEY
      },
      timeout: 10000
    });

    if (response.ok) {
      const data = await response.json();
      console.log('   ✅ Conversation found:');
      console.log('     - Status:', data.status);
      console.log('     - Created:', data.created_at);
      console.log('     - URL:', data.conversation_url);
    } else {
      const errorText = await response.text();
      console.log(`   ❌ API error: ${response.status} - ${errorText}`);
    }
  } catch (error) {
    console.log('   ❌ Tavus API check failed:', error.message);
  }

  console.log('');

  // Test 3: Check Daily.co service
  console.log('3. Testing Daily.co service connectivity...');
  try {
    const response = await fetch('https://api.daily.co/v1/', {
      timeout: 5000
    });
    
    if (response.status === 401) {
      console.log('   ✅ Daily.co API is accessible (401 expected without auth)');
    } else {
      console.log(`   Daily.co API status: ${response.status}`);
    }
  } catch (error) {
    console.log('   ❌ Daily.co connectivity failed:', error.message);
  }

  console.log('');

  // Test 4: Network diagnostics
  console.log('4. Network diagnostics...');
  console.log('   - Testing from your network to Tavus/Daily.co');
  console.log('   - Common issues: Corporate firewalls, VPN, proxy settings');
  
  // Test basic connectivity to Daily.co domain
  try {
    const response = await fetch('https://tavus.daily.co/', {
      method: 'HEAD',
      timeout: 5000
    });
    console.log(`   ✅ tavus.daily.co domain accessible: ${response.status}`);
  } catch (error) {
    console.log('   ❌ tavus.daily.co domain blocked:', error.message);
    console.log('   🚨 This suggests network/firewall blocking Daily.co');
  }

  console.log('');

  // Recommendations
  console.log('🎯 Diagnosis Results & Recommendations:');
  console.log('======================================');
  console.log('');
  console.log('If room is accessible but connection fails:');
  console.log('  → Network/firewall issue blocking WebRTC connections');
  console.log('  → Try different network (mobile hotspot)');
  console.log('  → Check corporate firewall settings');
  console.log('');
  console.log('If room returns 404:');
  console.log('  → Room was created but may have been auto-deleted');
  console.log('  → Create another new conversation');
  console.log('');
  console.log('If Daily.co domain is blocked:');
  console.log('  → Corporate network blocking video conferencing');
  console.log('  → Contact IT to whitelist *.daily.co domains');
  console.log('');
  console.log('🔧 Quick fixes to try:');
  console.log('  1. Different network (mobile hotspot)');
  console.log('  2. Different browser/incognito mode');
  console.log('  3. Disable VPN if using one');
  console.log('  4. Create another new Tavus conversation');
}

diagnoseTavusConnection();