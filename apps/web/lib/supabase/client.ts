import { createClient } from "@supabase/supabase-js";
import { isSupabaseMocked } from "../config";

// Singleton pattern — safe for client-side use in Next.js App Router
let supabaseClient: ReturnType<typeof createClient> | null = null;

// Global container for mock realtime broadcast listeners
declare global {
  var mockChannels: Record<string, Array<{ type: string; callback: Function }>> | undefined;
}

export function getSupabaseClient() {
  if (isSupabaseMocked()) {
    const mockClient = {
      channel: (channelName: string) => {
        const mockChannel = {
          on: (type: string, filter: any, callback: Function) => {
            if (!globalThis.mockChannels) {
              globalThis.mockChannels = {};
            }
            if (!globalThis.mockChannels[channelName]) {
              globalThis.mockChannels[channelName] = [];
            }
            // If filtering, check event type
            const eventType = typeof filter === "string" ? filter : (filter.event || "*");
            globalThis.mockChannels[channelName].push({ type: type === "broadcast" ? "broadcast" : eventType, callback });
            return mockChannel;
          },
          subscribe: (statusCallback: (status: string) => void) => {
            setTimeout(() => {
              statusCallback("SUBSCRIBED");
            }, 50);
            return mockChannel;
          },
          send: async (payload: any) => {
            // Forward payload to all broadcast listeners on this channel
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
      removeChannel: (channel: any) => {
        // Cleanup not strictly necessary for mock, but keeps API matching
      },
      auth: {
        // Client auth details will be handled by our AuthProvider state
      }
    };
    return mockClient as any;
  }

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

