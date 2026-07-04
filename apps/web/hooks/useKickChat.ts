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

        // 4. Listen for chat messages
        channel.bind("App\\Events\\ChatMessageSent", (data: any) => {
          if (cancelled) return;

          const msg = data?.data ?? data;
          if (!msg) return;

          const sender = msg.sender ?? {};
          const identity = msg.broadcaster ?? sender;
          const badges: string[] = sender.identity?.badges?.map((b: any) => b.type) ?? [];

          const kickMsg: KickChatMessage = {
            id: `kick-${msg.id ?? Date.now()}-${Math.random()}`,
            source: "kick",
            content: msg.content ?? "",
            sender: {
              id: String(sender.id ?? ""),
              username: sender.slug ?? sender.username ?? identity.username ?? "unknown",
              displayName: sender.username ?? identity.username ?? "Viewer",
              color: sender.identity?.color ?? undefined,
              isModerator: badges.includes("moderator"),
              isSubscriber: badges.includes("subscriber"),
              isBroadcaster: badges.includes("broadcaster"),
            },
            createdAt: new Date().toISOString(),
          };

          setMessages((prev) => {
            // Keep last 150 Kick messages to avoid memory bloat
            const next = [...prev, kickMsg];
            return next.slice(-150);
          });
        });
      } catch (err) {
        console.error("[useKickChat] Connection failed:", err);
      }
    }

    connect();

    return () => {
      cancelled = true;
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

  return { messages, isConnected, chatroomId, hasKickAuth, sendToKick };
}
