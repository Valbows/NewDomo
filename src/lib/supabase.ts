import { createBrowserClient } from "@supabase/ssr";

let supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
let supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const isE2E = process.env.NEXT_PUBLIC_E2E_TEST_MODE === "true";
const isProduction = process.env.NODE_ENV === "production";

if (
  !supabaseUrl ||
  supabaseUrl.startsWith("YOUR_") ||
  !supabaseAnonKey ||
  supabaseAnonKey.startsWith("YOUR_")
) {
  if (isE2E) {
    // In E2E mode we avoid throwing to allow pages/components to mount.
    // The app should avoid using Supabase when E2E mode is enabled.
    console.warn(
      "E2E mode: Supabase env missing or placeholder; creating dummy client."
    );
    supabaseUrl = "https://e2e.invalid";
    supabaseAnonKey = "e2e-key";
  } else if (isProduction) {
    // In production, use default values if env vars are missing
    console.warn("Production: Using default Supabase configuration");
    supabaseUrl = "https://xddjudwawavxwirpkksz.supabase.co";
    supabaseAnonKey =
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhkZGp1ZHdhd2F2eHdpcnBra3N6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY3NTgxODMsImV4cCI6MjA3MjMzNDE4M30.YmVUBMGLCw_2ncKE9nU0lneZi1xCbYspVn7iqjoFhuo";
  } else {
    throw new Error(
      "ERROR: Supabase environment variables are either missing or still set to placeholder values. Please update NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in your .env.local file."
    );
  }
}

export const supabase = createBrowserClient(
  supabaseUrl as string,
  supabaseAnonKey as string
);
