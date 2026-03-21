import { createClient } from "@supabase/supabase-js";

/**
 * Server-side Supabase client using the service role key.
 * NEVER expose this to the client — only use in API routes and Server Actions.
 */
export function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}
