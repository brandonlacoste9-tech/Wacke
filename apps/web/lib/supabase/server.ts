import { createClient } from "@supabase/supabase-js";
import { isSupabaseMocked } from "../config";

/**
 * Server-side Supabase client using the service role key.
 * NEVER expose this to the client — only use in API routes and Server Actions.
 */
export function getSupabaseAdmin() {
  if (isSupabaseMocked()) {
    const mockAdmin = {
      channel: (channelName: string) => {
        // Match the same broadcast behavior on server-side calls
        const mockChannel = {
          send: async (payload: any) => {
            const listeners = globalThis.mockChannels?.[channelName] || [];
            setTimeout(() => {
              for (const listener of listeners) {
                if (listener.type === "broadcast") {
                  listener.callback({ payload: payload.payload });
                }
              }
            }, 10);
            return { error: null };
          }
        };
        return mockChannel;
      },
      auth: {
        getUser: async (token: string) => {
          if (token && token.startsWith("mock-session:")) {
            // Format: mock-session:username:supabaseId
            const parts = token.split(":");
            const username = parts[1];
            const supabaseId = parts[2];
            return {
              data: {
                user: {
                  id: supabaseId,
                  email: `${username}@mock.wacke.ca`,
                },
              },
              error: null,
            };
          }
          return { data: { user: null }, error: new Error("Invalid mock token") };
        },
      },
    };
    return mockAdmin as any;
  }

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

