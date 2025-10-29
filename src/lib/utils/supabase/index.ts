/**
 * Supabase Utilities - Barrel Export
 * Consolidated exports for all Supabase-related utilities
 */

// Browser client (for client components)
export {
  createBrowserSupabaseClient,
  supabase
} from './browser';

// Server client (for server components, API routes)
export {
  createServerSupabaseClient,
  createClient
} from './client';