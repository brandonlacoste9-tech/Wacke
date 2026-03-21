import { createClient } from "@supabase/supabase-js";

// Singleton pattern — safe for client-side use in Next.js App Router
let supabaseClient: ReturnType<typeof createClient> | null = null;

export function getSupabaseClient() {
  if (!supabaseClient) {
    supabaseClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        realtime: {
          params: {
            eventsPerSecond: 25, // High-throughput for Mode Sacré chat bursts
          },
        },
      }
    );
  }
  return supabaseClient;
}
