#!/usr/bin/env node

/**
 * Test API Connections Script
 *
 * Tests all configured API keys and reports their status.
 * Usage: node scripts/test-connections.js
 */

const fs = require('fs');
const path = require('path');

// Try to load env files in order of priority
// Use ENV_FILE env var to override, e.g.: ENV_FILE=.env.production npm run test:connections
const envFiles = process.env.ENV_FILE
  ? [process.env.ENV_FILE]
  : ['.env.local', '.env.development', '.env.production', '.env'];
let loadedEnvFile = null;

for (const envFile of envFiles) {
  const envPath = path.resolve(process.cwd(), envFile);
  if (fs.existsSync(envPath)) {
    require('dotenv').config({ path: envPath });
    loadedEnvFile = envFile;
    break;
  }
}

if (!loadedEnvFile) {
  console.error('\x1b[31mError: No .env file found!\x1b[0m');
  console.error('Create one of: .env.local, .env.development, or .env');
  console.error('You can copy from .env.example: cp .env.example .env.local');
  process.exit(1);
}

const COLORS = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  dim: '\x1b[2m',
};

function log(color, symbol, service, message) {
  console.log(`${color}${symbol}${COLORS.reset} ${service.padEnd(12)} ${COLORS.dim}${message}${COLORS.reset}`);
}

/**
 * Test Tavus API
 */
async function testTavus() {
  const apiKey = process.env.TAVUS_API_KEY;
  const baseUrl = process.env.TAVUS_BASE_URL || 'https://api.tavus.io/v2';

  if (!apiKey || apiKey === 'your_tavus_api_key_here') {
    return { status: 'missing', message: 'TAVUS_API_KEY not configured' };
  }

  try {
    const response = await fetch(`${baseUrl}/replicas`, {
      method: 'GET',
      headers: { 'x-api-key': apiKey },
    });

    if (response.ok) {
      const data = await response.json();
      const count = data.data?.length || 0;
      return { status: 'valid', message: `Connected (${count} replicas)` };
    }

    const errorData = await response.json().catch(() => ({}));
    return { status: 'invalid', message: `${response.status}: ${errorData.message || 'Invalid key'}` };
  } catch (error) {
    return { status: 'error', message: error.message };
  }
}

/**
 * Test Twelve Labs API
 */
async function testTwelveLabs() {
  const apiKey = process.env.TWELVE_LABS_API_KEY;

  if (!apiKey || apiKey === 'your_twelve_labs_api_key_here') {
    return { status: 'missing', message: 'TWELVE_LABS_API_KEY not configured' };
  }

  try {
    const response = await fetch('https://api.twelvelabs.io/v1.3/indexes', {
      method: 'GET',
      headers: {
        'x-api-key': apiKey,
        'Content-Type': 'application/json',
      },
    });

    if (response.ok) {
      const data = await response.json();
      const count = data.data?.length || 0;
      return { status: 'valid', message: `Connected (${count} indexes)` };
    }

    const errorData = await response.json().catch(() => ({}));
    return { status: 'invalid', message: `${response.status}: ${errorData.message || 'Invalid key'}` };
  } catch (error) {
    return { status: 'error', message: error.message };
  }
}

/**
 * Test ElevenLabs API
 */
async function testElevenLabs() {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  // Sanitize URL - remove any trailing non-URL characters
  const rawUrl = process.env.ELEVENLABS_URL || 'https://api.elevenlabs.io/v1';
  const baseUrl = rawUrl.replace(/[^a-zA-Z0-9/:._-]/g, '').replace(/\/$/, '');

  if (!apiKey) {
    return { status: 'missing', message: 'ELEVENLABS_API_KEY not configured' };
  }

  try {
    // Test voices endpoint
    const voicesResponse = await fetch(`${baseUrl}/voices`, {
      method: 'GET',
      headers: { 'xi-api-key': apiKey },
    });

    if (!voicesResponse.ok) {
      const errorData = await voicesResponse.json().catch(() => ({}));
      return { status: 'invalid', message: `${voicesResponse.status}: ${errorData.detail || 'Invalid key'}` };
    }

    const voicesData = await voicesResponse.json();
    const voiceCount = voicesData.voices?.length || 0;

    // Test user subscription to verify STT access
    const userResponse = await fetch(`${baseUrl}/user/subscription`, {
      method: 'GET',
      headers: { 'xi-api-key': apiKey },
    });

    if (userResponse.ok) {
      const userData = await userResponse.json();
      const tier = userData.tier || 'unknown';
      return { status: 'valid', message: `Connected (${voiceCount} voices, ${tier} tier)` };
    }

    return { status: 'valid', message: `Connected (${voiceCount} voices)` };
  } catch (error) {
    return { status: 'error', message: error.message };
  }
}

/**
 * Test Supabase connection
 */
async function testSupabase() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || supabaseUrl.includes('YOUR_PROJECT')) {
    return { status: 'missing', message: 'NEXT_PUBLIC_SUPABASE_URL not configured' };
  }

  if (!supabaseKey || supabaseKey === 'your_anon_key_here') {
    return { status: 'missing', message: 'NEXT_PUBLIC_SUPABASE_ANON_KEY not configured' };
  }

  try {
    const response = await fetch(`${supabaseUrl}/rest/v1/`, {
      method: 'GET',
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
      },
    });

    if (response.ok || response.status === 200) {
      return { status: 'valid', message: 'Connected' };
    }

    return { status: 'invalid', message: `${response.status}: Connection failed` };
  } catch (error) {
    return { status: 'error', message: error.message };
  }
}

/**
 * Test OpenAI API
 */
async function testOpenAI() {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey || apiKey === 'your_openai_api_key_here') {
    return { status: 'missing', message: 'OPENAI_API_KEY not configured (optional)' };
  }

  try {
    const response = await fetch('https://api.openai.com/v1/models', {
      method: 'GET',
      headers: { Authorization: `Bearer ${apiKey}` },
    });

    if (response.ok) {
      return { status: 'valid', message: 'Connected' };
    }

    const errorData = await response.json().catch(() => ({}));
    return { status: 'invalid', message: `${response.status}: ${errorData.error?.message || 'Invalid key'}` };
  } catch (error) {
    return { status: 'error', message: error.message };
  }
}

/**
 * Test HubSpot API
 */
async function testHubSpot() {
  const apiKey = process.env.HUBSPOT_API_KEY;

  if (!apiKey || apiKey === 'your_hubspot_private_app_token_here') {
    return { status: 'missing', message: 'HUBSPOT_API_KEY not configured (optional)' };
  }

  try {
    // Test by fetching account info
    const response = await fetch('https://api.hubapi.com/crm/v3/objects/contacts?limit=1', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (response.ok) {
      const data = await response.json();
      const total = data.total || 0;
      return { status: 'valid', message: `Connected (${total} contacts)` };
    }

    const errorData = await response.json().catch(() => ({}));
    return { status: 'invalid', message: `${response.status}: ${errorData.message || 'Invalid key'}` };
  } catch (error) {
    return { status: 'error', message: error.message };
  }
}

/**
 * Main
 */
async function main() {
  console.log('\n' + COLORS.cyan + '  API Connection Tests' + COLORS.reset);
  console.log(COLORS.dim + `  Using: ${loadedEnvFile}` + COLORS.reset);
  console.log(COLORS.dim + '  ════════════════════════════════════════\n' + COLORS.reset);

  const tests = [
    { name: 'Tavus', fn: testTavus },
    { name: 'Twelve Labs', fn: testTwelveLabs },
    { name: 'ElevenLabs', fn: testElevenLabs },
    { name: 'Supabase', fn: testSupabase },
    { name: 'OpenAI', fn: testOpenAI },
    { name: 'HubSpot', fn: testHubSpot },
  ];

  const results = { valid: 0, missing: 0, invalid: 0, error: 0 };

  for (const test of tests) {
    const result = await test.fn();
    results[result.status]++;

    switch (result.status) {
      case 'valid':
        log(COLORS.green, '✓', test.name, result.message);
        break;
      case 'missing':
        log(COLORS.yellow, '○', test.name, result.message);
        break;
      case 'invalid':
        log(COLORS.red, '✗', test.name, result.message);
        break;
      case 'error':
        log(COLORS.red, '!', test.name, result.message);
        break;
    }
  }

  console.log(COLORS.dim + '\n  ════════════════════════════════════════' + COLORS.reset);
  console.log(`  ${COLORS.green}${results.valid} valid${COLORS.reset}  ${COLORS.yellow}${results.missing} missing${COLORS.reset}  ${COLORS.red}${results.invalid + results.error} failed${COLORS.reset}\n`);

  // Exit with error code if any required services failed
  if (results.invalid > 0 || results.error > 0) {
    process.exit(1);
  }
}

main().catch(console.error);
