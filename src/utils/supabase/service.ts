import { createClient } from '@supabase/supabase-js';

/**
 * Create a Supabase client with service role key.
 * This bypasses RLS and should only be used for server-side operations
 * that require elevated permissions (e.g., public embed access).
 */
export const createServiceClient = () => {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SECRET_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
};
