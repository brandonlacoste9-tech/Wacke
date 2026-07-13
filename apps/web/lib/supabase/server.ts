import { createClient } from "@supabase/supabase-js";
import { isSupabaseMocked } from "../config";
import { verifyPlatformSession } from "../platform-session";

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
          const session = token ? verifyPlatformSession(token) : null;
          if (session) {
            return {
              data: {
                user: {
                  id: session.supabaseId,
                  email: `${session.username}@mock.wacke.ca`,
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

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  // IMPORTANT: For storage uploads (TTS audio etc) we *must* use service role
  // to bypass RLS. Never silently fall back here for admin ops.
  const finalKey = (!serviceKey || serviceKey.includes("your-supabase-service-role-key"))
    ? anonKey
    : serviceKey;

  if (finalKey === anonKey && !isSupabaseMocked()) {
    console.warn(
      "[SUPABASE ADMIN] WARNING: Using ANON key instead of SERVICE_ROLE_KEY. " +
      "This will cause RLS violations on storage uploads (e.g. TTS audio). " +
      "Set SUPABASE_SERVICE_ROLE_KEY in your environment."
    );
  }

  const client = createClient(url, finalKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  // Intercept auth.getUser for signed Kick/Twitch platform sessions only
  const originalGetUser = client.auth.getUser.bind(client.auth);
  client.auth.getUser = async (jwt?: string) => {
    if (jwt) {
      const session = verifyPlatformSession(jwt);
      if (session) {
        return {
          data: {
            user: {
              id: session.supabaseId,
              email: `${session.username}@platform.wacke.ca`,
            } as any,
          },
          error: null,
        };
      }
    }
    return originalGetUser(jwt);
  };

  return client;
}

/**
 * Strict service-role client. Throws a clear error if the service key is not properly configured.
 * Use this for storage uploads, privileged writes, etc. where RLS must be bypassed.
 */
export function getSupabaseServiceRole() {
  if (isSupabaseMocked()) {
    return getSupabaseAdmin();
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!serviceKey || serviceKey.includes("your-supabase-service-role-key") || serviceKey.length < 30) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY is missing or invalid. TTS audio uploads (and other admin storage) require the service role key to bypass RLS policies. " +
      "Add it to your .env.local / hosting environment variables."
    );
  }

  return createClient(url, serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
