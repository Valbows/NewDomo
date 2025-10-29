/**
 * Supabase Browser Client
 * For use in client components and browser-side code
 */

import { createBrowserClient } from "@supabase/ssr";

// Environment configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const isE2E = process.env.NEXT_PUBLIC_E2E_TEST_MODE === "true";
const isProduction = process.env.NODE_ENV === "production";

/**
 * Get validated Supabase configuration
 * Handles E2E mode and production fallbacks
 */
function getSupabaseConfig(): { url: string; anonKey: string } {
  let url = supabaseUrl;
  let anonKey = supabaseAnonKey;

  if (
    !url ||
    url.startsWith("YOUR_") ||
    !anonKey ||
    anonKey.startsWith("YOUR_")
  ) {
    if (isE2E) {
      // In E2E mode we avoid throwing to allow pages/components to mount.
      // The app should avoid using Supabase when E2E mode is enabled.
      console.warn(
        "E2E mode: Supabase env missing or placeholder; creating dummy client."
      );
      url = "https://e2e.invalid";
      anonKey = "e2e-key";
    } else if (isProduction) {
      // In production, use default values if env vars are missing
      console.warn("Production: Using default Supabase configuration");
      url = "https://xddjudwawavxwirpkksz.supabase.co";
      anonKey =
        "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhkZGp1ZHdhd2F2eHdpcnBra3N6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY3NTgxODMsImV4cCI6MjA3MjMzNDE4M30.YmVUBMGLCw_2ncKE9nU0lneZi1xCbYspVn7iqjoFhuo";
    } else {
      throw new Error(
        "ERROR: Supabase environment variables are either missing or still set to placeholder values. Please update NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in your .env.local file."
      );
    }
  }

  return { url: url as string, anonKey: anonKey as string };
}

/**
 * Create a browser-side Supabase client
 * Use this in client components and browser-side code
 */
export function createBrowserSupabaseClient() {
  const { url, anonKey } = getSupabaseConfig();
  return createBrowserClient(url, anonKey);
}

/**
 * Default browser client instance
 */
export const supabase = createBrowserSupabaseClient();