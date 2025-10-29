/**
 * Library - Main Barrel Export
 * Consolidated exports for all library modules
 */

// Services (main export)
export * from './services';

// Utilities (selective exports to avoid conflicts)
export { 
  createBrowserSupabaseClient,
  supabase,
  createServerSupabaseClient,
  createClient
} from './utils/supabase';

export * from './utils/security';
export * from './utils/formatting';

// Tools
export * from './tools';

// Ngrok Utilities
export * from './ngrok';

// Core utilities (direct exports)
export * from './errors';
export * from './guardrail-monitor';
export * from './sentry-utils';
export * from './supabase';