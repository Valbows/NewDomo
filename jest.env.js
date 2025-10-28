// jest.env.js - Test environment variables setup
// This file sets up environment variables for Jest tests

// Load environment variables from .env.local for tests
require('dotenv').config({ path: '.env.local' });

// Set test-specific environment variables
process.env.NODE_ENV = 'test';

// Ensure required Supabase environment variables are available for tests
// If they're not in .env.local, set test defaults
if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
}

if (!process.env.SUPABASE_SECRET_KEY) {
  process.env.SUPABASE_SECRET_KEY = 'test-secret-key';
}

// Set test defaults for Tavus webhook variables
if (!process.env.TAVUS_WEBHOOK_SECRET) {
  process.env.TAVUS_WEBHOOK_SECRET = 'test-webhook-secret';
}

if (!process.env.TAVUS_WEBHOOK_TOKEN) {
  process.env.TAVUS_WEBHOOK_TOKEN = 'test-webhook-token';
}

// Set other required test environment variables
process.env.NEXT_PUBLIC_E2E_TEST_MODE = 'false';
process.env.NEXT_PUBLIC_TAVUS_TOOLCALL_TEXT_FALLBACK = 'true';