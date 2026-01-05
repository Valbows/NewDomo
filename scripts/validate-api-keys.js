#!/usr/bin/env node

/**
 * API Key Validation Script
 *
 * Tests all API keys in your .env file against real endpoints
 * Run: node scripts/validate-api-keys.js
 */

require('dotenv').config({ path: '.env.development' });

const results = [];

async function testSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const serviceKey = process.env.SUPABASE_SECRET_KEY;

  if (!url || url.includes('YOUR_PROJECT')) {
    return { name: 'Supabase', status: 'SKIPPED', message: 'URL not configured' };
  }

  try {
    // Test anon key with a simple health check
    const response = await fetch(`${url}/rest/v1/`, {
      headers: {
        'apikey': anonKey,
        'Authorization': `Bearer ${anonKey}`
      }
    });

    if (response.status === 401) {
      return { name: 'Supabase (Anon Key)', status: 'FAILED', message: 'Invalid anon key' };
    }

    return { name: 'Supabase (Anon Key)', status: 'PASSED', message: `Status: ${response.status}` };
  } catch (error) {
    return { name: 'Supabase', status: 'FAILED', message: error.message };
  }
}

async function testTavus() {
  const apiKey = process.env.TAVUS_API_KEY;

  if (!apiKey || apiKey.includes('your_')) {
    return { name: 'Tavus', status: 'SKIPPED', message: 'API key not configured' };
  }

  try {
    // Test by listing replicas (lightweight endpoint)
    const response = await fetch('https://tavusapi.com/v2/replicas', {
      headers: {
        'x-api-key': apiKey
      }
    });

    if (response.status === 401 || response.status === 403) {
      return { name: 'Tavus', status: 'FAILED', message: 'Invalid API key' };
    }

    return { name: 'Tavus', status: 'PASSED', message: `Status: ${response.status}` };
  } catch (error) {
    return { name: 'Tavus', status: 'FAILED', message: error.message };
  }
}

async function testTwelveLabs() {
  const apiKey = process.env.TWELVE_LABS_API_KEY;

  if (!apiKey || apiKey.includes('your_')) {
    return { name: 'Twelve Labs', status: 'SKIPPED', message: 'API key not configured' };
  }

  try {
    // Test by listing indexes
    const response = await fetch('https://api.twelvelabs.io/v1.3/indexes', {
      headers: {
        'x-api-key': apiKey
      }
    });

    if (response.status === 401 || response.status === 403) {
      return { name: 'Twelve Labs', status: 'FAILED', message: 'Invalid API key' };
    }

    const data = await response.json();
    return { name: 'Twelve Labs', status: 'PASSED', message: `Found ${data.data?.length || 0} indexes` };
  } catch (error) {
    return { name: 'Twelve Labs', status: 'FAILED', message: error.message };
  }
}

async function testOpenAI() {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey || apiKey.includes('your_')) {
    return { name: 'OpenAI', status: 'SKIPPED', message: 'API key not configured' };
  }

  try {
    // Test by listing models (lightweight endpoint)
    const response = await fetch('https://api.openai.com/v1/models', {
      headers: {
        'Authorization': `Bearer ${apiKey}`
      }
    });

    if (response.status === 401) {
      return { name: 'OpenAI', status: 'FAILED', message: 'Invalid API key' };
    }

    return { name: 'OpenAI', status: 'PASSED', message: `Status: ${response.status}` };
  } catch (error) {
    return { name: 'OpenAI', status: 'FAILED', message: error.message };
  }
}

async function testElevenLabs() {
  const apiKey = process.env.ELEVENLABS_API_KEY;

  if (!apiKey || apiKey.includes('your_')) {
    return { name: 'ElevenLabs', status: 'SKIPPED', message: 'API key not configured (optional)' };
  }

  try {
    // Test by getting user info
    const response = await fetch('https://api.elevenlabs.io/v1/user', {
      headers: {
        'xi-api-key': apiKey
      }
    });

    if (response.status === 401) {
      return { name: 'ElevenLabs', status: 'FAILED', message: 'Invalid API key' };
    }

    return { name: 'ElevenLabs', status: 'PASSED', message: `Status: ${response.status}` };
  } catch (error) {
    return { name: 'ElevenLabs', status: 'FAILED', message: error.message };
  }
}

async function testMixpanel() {
  // Mixpanel token is hardcoded in the lib, just check if it exists
  const token = 'b6bca0aef2fc049b7376d9168e202cc6'; // From mixpanel.ts

  try {
    // Mixpanel doesn't have a validation endpoint, but we can try to track a test event
    const response = await fetch('https://api.mixpanel.com/track', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        token: token,
        event: 'API Key Validation Test',
        properties: {
          distinct_id: 'api-key-test',
          test: true
        }
      })
    });

    if (response.status === 200) {
      return { name: 'Mixpanel', status: 'PASSED', message: 'Token valid' };
    }

    return { name: 'Mixpanel', status: 'FAILED', message: `Status: ${response.status}` };
  } catch (error) {
    return { name: 'Mixpanel', status: 'FAILED', message: error.message };
  }
}

async function main() {
  console.log('\n========================================');
  console.log('  API Key Validation');
  console.log('========================================\n');

  const tests = [
    testSupabase(),
    testTavus(),
    testTwelveLabs(),
    testOpenAI(),
    testElevenLabs(),
    testMixpanel(),
  ];

  const results = await Promise.all(tests);

  // Display results
  let passed = 0;
  let failed = 0;
  let skipped = 0;

  results.forEach(result => {
    let icon;
    if (result.status === 'PASSED') {
      icon = '\x1b[32m✓\x1b[0m'; // Green checkmark
      passed++;
    } else if (result.status === 'FAILED') {
      icon = '\x1b[31m✗\x1b[0m'; // Red X
      failed++;
    } else {
      icon = '\x1b[33m○\x1b[0m'; // Yellow circle
      skipped++;
    }

    console.log(`${icon} ${result.name.padEnd(25)} ${result.status.padEnd(10)} ${result.message}`);
  });

  console.log('\n----------------------------------------');
  console.log(`Total: ${results.length} | Passed: ${passed} | Failed: ${failed} | Skipped: ${skipped}`);
  console.log('----------------------------------------\n');

  // Exit with error code if any failed
  if (failed > 0) {
    process.exit(1);
  }
}

main().catch(console.error);
