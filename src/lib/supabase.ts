import { createBrowserClient } from '@supabase/ssr';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || supabaseUrl.startsWith('YOUR_') || !supabaseAnonKey || supabaseAnonKey.startsWith('YOUR_')) {
  throw new Error('ERROR: Supabase environment variables are either missing or still set to placeholder values. Please update NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in your .env.local file.');
}

export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey);
