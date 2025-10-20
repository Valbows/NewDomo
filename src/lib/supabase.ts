import { createBrowserClient } from '@supabase/ssr';

let supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
let supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const isE2E = process.env.NEXT_PUBLIC_E2E_TEST_MODE === 'true';

if (!supabaseUrl || supabaseUrl.startsWith('YOUR_') || !supabaseAnonKey || supabaseAnonKey.startsWith('YOUR_')) {
  if (isE2E) {
    // In E2E mode we avoid throwing to allow pages/components to mount.
    // The app should avoid using Supabase when E2E mode is enabled.
    console.warn('E2E mode: Supabase env missing or placeholder; creating dummy client.');
    supabaseUrl = 'https://e2e.invalid';
    supabaseAnonKey = 'e2e-key';
  } else {
    throw new Error('ERROR: Supabase environment variables are either missing or still set to placeholder values. Please update NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in your .env.local file.');
  }
}

export const supabase = createBrowserClient(supabaseUrl as string, supabaseAnonKey as string);
