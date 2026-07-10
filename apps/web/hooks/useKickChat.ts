"use client";

import { useEffect, useRef, useState, useCallback } from "react";

// Kick's public Pusher credentials (same as kick.com uses)
const KICK_PUSHER_KEY = "32cbd69e4b950bf97679";
const KICK_PUSHER_CLUSTER = "us2";

export interface KickChatMessage {
  id: string;
  source: "kick";
  content: string;
  sender: {
    id: string;
    username: string;
    displayName: string;
    color?: string;
    isModerator?: boolean;
    isSubscriber?: boolean;
    isBroadcaster?: boolean;
    rawBadges?: any[];
  };
  createdAt: string;
}

interface UseKickChatOptions {
  kickUsername: string | undefined;
  enabled?: boolean;
}

interface UseKickChatReturn {
  messages: KickChatMessage[];
  isConnected: boolean;
  chatroomId: number | null;
  hasKickAuth: boolean;
  isQuiet: boolean;
  sendToKick: (content: string) => Promise<{ success: boolean; error?: string }>;
}

function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(";").shift() || null;
  return null;
}

export function useKickChat({
  kickUsername,
  enabled = true,
}: UseKickChatOptions): UseKickChatReturn {
  const [messages, setMessages] = useState<KickChatMessage[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [chatroomId, setChatroomId] = useState<number | null>(null);
  const [hasKickAuth, setHasKickAuth] = useState(false);
  // True once we've been connected for a while with zero messages — usually means
  // the streamer is offline, so their Pusher chatroom is silent.
  const [isQuiet, setIsQuiet] = useState(false);
  const pusherRef = useRef<any>(null);
  const channelRef = useRef<any>(null);

  // Check if user has Kick OAuth token
  useEffect(() => {
    const kickToken = getCookie("kick_access_token");
    setHasKickAuth(!!kickToken);
  }, []);

  // Fetch chatroom_id then connect to Pusher
  useEffect(() => {
    if (!kickUsername || !enabled) return;

    // Skip mock usernames
    if (kickUsername.startsWith("kick-mock-streamer-") || kickUsername.startsWith("kickseur_")) {
      return;
    }

    let cancelled = false;
    let pusher: any;

    async function connect() {
      try {
        // 1. Get chatroom_id from our API
        const infoRes = await fetch(`/api/kick/channel-info?slug=${encodeURIComponent(kickUsername!)}`);
        if (!infoRes.ok || cancelled) return;

        const info = await infoRes.json();
        if (!info.chatroomId || cancelled) {
          console.warn("[useKickChat] No chatroom_id for", kickUsername);
          return;
        }

        const roomId = Number(info.chatroomId);
        setChatroomId(roomId);

        // 2. Dynamically import pusher-js (client only)
        const PusherModule = await import("pusher-js");
        if (cancelled) return;

        const Pusher = PusherModule.default;

        pusher = new Pusher(KICK_PUSHER_KEY, {
          cluster: KICK_PUSHER_CLUSTER,
          forceTLS: true,
        });

        pusherRef.current = pusher;

        pusher.connection.bind("connected", () => {
          if (!cancelled) setIsConnected(true);
          // If no messages arrive within 12s of connecting, flag the chat as quiet
          // so the UI can hint the streamer may be offline.
          quietTimer = window.setTimeout(() => {
            if (!cancelled) setIsQuiet(true);
          }, 12000);
        });

        pusher.connection.bind("disconnected", () => {
          if (!cancelled) setIsConnected(false);
        });

        pusher.connection.bind("error", (err: any) => {
          console.error("[useKickChat] Pusher error:", err);
          if (!cancelled) setIsConnected(false);
        });

        // 3. Subscribe to kick chatroom channel
        const channelName = `chatrooms.${roomId}.v2`;
        const channel = pusher.subscribe(channelName);
        channelRef.current = channel;

        channel.bind("subscription_succeeded", () => {
          if (!cancelled) setIsConnected(true);
        });

        // 4. Listen for chat messages.
        // Kick renamed their event from "ChatMessageSent" to "ChatMessageEvent".
        // Bind to both so we keep working if they roll back or use either.
        const handleChatMessage = (payload: any) => {
          if (cancelled) return;

          // A real message arrived — not quiet anymore
          setIsQuiet(false);
          if (quietTimer) { clearTimeout(quietTimer); quietTimer = null; }

          // Kick's Pusher payload nests the message as a JSON string in `data`.
          // Normalize it into an object.
          let msg = payload?.data ?? payload;
          if (typeof msg === "string") {
            try { msg = JSON.parse(msg); } catch { return; }
          }
          if (!msg || typeof msg !== "object") return;

          const sender = msg.sender ?? {};
          const identity = msg.broadcaster ?? sender;
          const rawBadges: any[] = sender.identity?.badges ?? [];

          const kickMsg: KickChatMessage = {
            id: `kick-${msg.id ?? Date.now()}-${Math.random()}`,
            source: "kick",
            content: msg.content ?? "",
            sender: {
              id: String(sender.id ?? ""),
              username: sender.slug ?? sender.username ?? identity.username ?? "unknown",
              displayName: sender.username ?? identity.username ?? "Viewer",
              color: sender.identity?.color ?? undefined,
              isModerator: rawBadges.some((b: any) => (b?.type || "").toLowerCase().includes("moderator")),
              isSubscriber: rawBadges.some((b: any) => (b?.type || "").toLowerCase().includes("subscriber")),
              isBroadcaster: rawBadges.some((b: any) => (b?.type || "").toLowerCase().includes("broadcaster")),
              // full for badge renderer (supports sub tiers etc)
              rawBadges,
            } as any,
            createdAt: msg.created_at ? new Date(msg.created_at).toISOString() : new Date().toISOString(),
          };

          setMessages((prev) => {
            // Keep last 150 Kick messages to avoid memory bloat
            const next = [...prev, kickMsg];
            return next.slice(-150);
          });
        };

        channel.bind("App\\Events\\ChatMessageEvent", handleChatMessage);
        channel.bind("App\\Events\\ChatMessageSent", handleChatMessage);
      } catch (err) {
        console.error("[useKickChat] Connection failed:", err);
      }
    }

    let quietTimer: number | null = null;

    connect();

    return () => {
      cancelled = true;
      if (quietTimer) { clearTimeout(quietTimer); quietTimer = null; }
      if (channelRef.current) {
        try {
          pusherRef.current?.unsubscribe(channelRef.current.name);
        } catch {}
        channelRef.current = null;
      }
      if (pusherRef.current) {
        try {
          pusherRef.current.disconnect();
        } catch {}
        pusherRef.current = null;
      }
      setIsConnected(false);
    };
  }, [kickUsername, enabled]);

  const sendToKick = useCallback(
    async (content: string): Promise<{ success: boolean; error?: string }> => {
      if (!chatroomId) {
        return { success: false, error: "Not connected to Kick chatroom" };
      }

      try {
        const res = await fetch("/api/kick/chat/send", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ chatroomId, content }),
        });

        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          return { success: false, error: err.error || `Error ${res.status}` };
        }

        return { success: true };
      } catch (err: any) {
        return { success: false, error: err.message || "Failed to send" };
      }
    },
    [chatroomId]
  );

  return { messages, isConnected, chatroomId, hasKickAuth, sendToKick, isQuiet };
}
