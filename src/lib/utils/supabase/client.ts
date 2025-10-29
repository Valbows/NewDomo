/**
 * Supabase Server Client
 * For use in server components, API routes, and server actions
 */

import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from 'next/headers';

// Environment configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseSecretKey = process.env.SUPABASE_SECRET_KEY;

const isE2E = process.env.NEXT_PUBLIC_E2E_TEST_MODE === "true";
const isProduction = process.env.NODE_ENV === "production";

/**
 * Get validated Supabase URL
 */
function getSupabaseUrl(): string {
  let url = supabaseUrl;

  if (!url || url.startsWith("YOUR_")) {
    if (isE2E) {
      console.warn("E2E mode: Using dummy Supabase URL");
      url = "https://e2e.invalid";
    } else if (isProduction) {
      console.warn("Production: Using default Supabase URL");
      url = "https://xddjudwawavxwirpkksz.supabase.co";
    } else {
      throw new Error(
        "ERROR: NEXT_PUBLIC_SUPABASE_URL is missing or still set to placeholder value."
      );
    }
  }

  return url as string;
}

/**
 * Create a server-side Supabase client with cookie handling
 * Use this in server components, API routes, and server actions
 */
export function createServerSupabaseClient() {
  const url = getSupabaseUrl();
  
  if (!supabaseSecretKey) {
    throw new Error("SUPABASE_SECRET_KEY is required for server-side client");
  }

  const cookieStore = cookies();

  return createServerClient(
    url,
    supabaseSecretKey,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options });
          } catch (error) {
            // The `set` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: '', ...options });
          } catch (error) {
            // The `delete` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  );
}

/**
 * Legacy server client export for backward compatibility
 * @deprecated Use createServerSupabaseClient() instead
 */
export const createClient = createServerSupabaseClient;