"use client";

import { useEffect, useRef, useState } from "react";
import tmi from "tmi.js";

export interface TwitchChatMessage {
  id: string;
  source: "twitch";
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

interface UseTwitchChatOptions {
  twitchUsername: string | undefined;
  enabled?: boolean;
}

interface UseTwitchChatReturn {
  messages: TwitchChatMessage[];
  isConnected: boolean;
}

export function useTwitchChat({
  twitchUsername,
  enabled = true,
}: UseTwitchChatOptions): UseTwitchChatReturn {
  const [messages, setMessages] = useState<TwitchChatMessage[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const clientRef = useRef<tmi.Client | null>(null);

  useEffect(() => {
    if (!twitchUsername || !enabled) return;

    // Skip mock usernames
    if (twitchUsername.startsWith("twitch-mock-streamer-") || twitchUsername.startsWith("twitchseur_")) {
      return;
    }

    let cancelled = false;

    // Create TMI client
    const client = new tmi.Client({
      options: { debug: false },
      connection: {
        reconnect: true,
        secure: true,
      },
      channels: [twitchUsername],
    });
    
    clientRef.current = client;

    client.on("connected", () => {
      if (!cancelled) setIsConnected(true);
    });

    client.on("disconnected", () => {
      if (!cancelled) setIsConnected(false);
    });

    client.on("message", (channel, tags, message, self) => {
      if (cancelled || self) return;

      const twitchMsg: TwitchChatMessage = {
        id: `twitch-${tags.id || Date.now()}-${Math.random()}`,
        source: "twitch",
        content: message,
        sender: {
          id: tags["user-id"] || tags.username || "unknown",
          username: tags.username || "unknown",
          displayName: tags["display-name"] || tags.username || "Viewer",
          color: tags.color || undefined,
          isModerator: tags.mod || tags.badges?.broadcaster === "1",
          isSubscriber: !!tags.subscriber,
          isBroadcaster: tags.badges?.broadcaster === "1",
        },
        createdAt: new Date().toISOString(),
      };

      setMessages((prev) => {
        // Keep last 150 Twitch messages to avoid memory bloat
        const next = [...prev, twitchMsg];
        return next.slice(-150);
      });
    });

    client.connect().catch(console.error);

    return () => {
      cancelled = true;
      client.disconnect().catch(console.error);
      setIsConnected(false);
    };
  }, [twitchUsername, enabled]);

  return {
    messages,
    isConnected,
  };
}
