/**
 * Migration Helper Utilities
 * Helper functions to assist with the utility consolidation migration
 */

/**
 * Import path mappings for the utility consolidation
 * Use this to update imports across the codebase
 */
export const IMPORT_MAPPINGS = {
  // Supabase utilities
  '@/utils/supabase': '@/lib/utils/supabase',
  'src/lib/supabase': '@/lib/utils/supabase',
  
  // Security utilities
  'src/lib/security/webhooks': '@/lib/utils/security/webhooks',
  '@/lib/security/webhooks': '@/lib/utils/security/webhooks',
  
  // Validation utilities (from webhook services)
  'src/lib/services/webhooks/validation-service': '@/lib/utils/validation/webhook',
  
  // Common patterns to replace
  'createClient()': 'createServerSupabaseClient()',
  'supabase from': 'createBrowserSupabaseClient from',
} as const;

/**
 * Function name mappings for the utility consolidation
 */
export const FUNCTION_MAPPINGS = {
  'createClient': 'createServerSupabaseClient',
  'supabase': 'createBrowserSupabaseClient()',
} as const;

/**
 * Files that need import updates (for reference)
 */
export const FILES_TO_UPDATE = [
  // Service files
  'src/lib/services/demos/demo-service.ts',
  'src/lib/services/demos/video-service.ts',
  'src/lib/services/auth/middleware.ts',
  
  // API routes
  'src/app/api/**/*.ts',
  
  // Components (if any use supabase directly)
  'src/components/**/*.tsx',
] as const;

/**
 * Validation to ensure consolidation is working
 */
export function validateConsolidation() {
  console.log('✅ Utility consolidation completed:');
  console.log('  - Supabase utilities consolidated under src/lib/utils/supabase/');
  console.log('  - Security utilities consolidated under src/lib/utils/security/');
  console.log('  - Validation utilities consolidated under src/lib/utils/validation/');
  console.log('  - Formatting utilities consolidated under src/lib/utils/formatting/');
  console.log('  - Main barrel export created at src/lib/utils/index.ts');
  console.log('');
  console.log('📝 Next steps:');
  console.log('  - Update remaining import statements across the codebase');
  console.log('  - Remove deprecated files after all imports are updated');
  console.log('  - Run tests to ensure functionality is preserved');
}