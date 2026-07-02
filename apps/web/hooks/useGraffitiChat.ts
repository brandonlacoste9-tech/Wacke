"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { getSupabaseClient } from "@/lib/supabase/client";
import { moderateMessage } from "@/lib/moderation";
import type { RealtimeChannel } from "@supabase/supabase-js";

export interface ChatMessage {
  id: string;
  streamId: string;
  userId: string;
  content: string;
  isSacre: boolean;
  audioUrl?: string | null;
  createdAt: string;
  user: {
    id: string;
    username: string;
    displayName: string;
    avatarUrl: string | null;
  };
}

interface UseGraffitiChatOptions {
  streamId: string;
  currentUserId?: string;
  sacreModeEnabled: boolean;
  initialMessages?: ChatMessage[];
  authToken?: string;
}

interface UseGraffitiChatReturn {
  messages: ChatMessage[];
  sendMessage: (content: string) => Promise<{ error?: string }>;
  sendTtsMessage: (content: string) => Promise<{ error?: string }>;
  isConnected: boolean;
  isSending: boolean;
  isSendingTts: boolean;
}

/**
 * useGraffitiChat — Real-time Supabase WebSocket chat hook.
 *
 * Subscribes to the Postgres Changes feed on the `messages` table,
 * filtered by streamId. Handles Mode Sacré moderation client-side
 * before sending to the API route for server-side validation.
 */
export function useGraffitiChat({
  streamId,
  currentUserId,
  sacreModeEnabled,
  initialMessages = [],
  authToken,
}: UseGraffitiChatOptions): UseGraffitiChatReturn {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [isConnected, setIsConnected] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isSendingTts, setIsSendingTts] = useState(false);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const supabase = getSupabaseClient();

  // ─── Realtime Subscription ─────────────────────────────────────────────────
  useEffect(() => {
    if (!streamId) return;

    const channel = supabase
      .channel(`graffiti-chat:${streamId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `stream_id=eq.${streamId}`,
        },
        (payload: any) => {
          // The payload contains the new row — we need to fetch the user data
          // In production, use a Supabase broadcast channel for full message objects
          const newMessage = payload.new as ChatMessage;
          setMessages((prev) => {
            // Deduplicate by id
            if (prev.some((m) => m.id === newMessage.id)) return prev;
            return [...prev, newMessage];
          });
        }
      )
      .on("broadcast", { event: "chat_message" }, ({ payload }: { payload: any }) => {
        // Broadcast channel carries the full hydrated message object
        const newMessage = payload as ChatMessage;
        setMessages((prev) => {
          if (prev.some((m) => m.id === newMessage.id)) return prev;
          return [...prev, newMessage];
        });
      })
      .subscribe((status: string) => {
        setIsConnected(status === "SUBSCRIBED");
      });

    channelRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
      setIsConnected(false);
    };
  }, [streamId, supabase]);

  // ─── Send Message ──────────────────────────────────────────────────────────
  const sendMessage = useCallback(
    async (content: string): Promise<{ error?: string }> => {
      if (!currentUserId) return { error: "Tu dois être connecté pour chatter" };
      if (isSending) return { error: "Attends un peu..." };

      // Client-side moderation pre-check
      const modResult = moderateMessage(content, sacreModeEnabled);
      if (!modResult.allowed) {
        return { error: modResult.reason };
      }

      setIsSending(true);

      try {
        const response = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            streamId,
            content: modResult.sanitized,
            isSacre: modResult.isSacre,
          }),
        });

        if (!response.ok) {
          const data = await response.json();
          return { error: data.error ?? "Erreur d'envoi" };
        }

        return {};
      } catch {
        return { error: "Connexion perdue. Réessaie." };
      } finally {
        setIsSending(false);
      }
    },
    [streamId, currentUserId, sacreModeEnabled, isSending]
  );

  // ─── Send TTS Message ──────────────────────────────────────────────────────
  const sendTtsMessage = useCallback(
    async (content: string): Promise<{ error?: string }> => {
      if (!currentUserId || !authToken) return { error: "Tu dois être connecté pour envoyer un TTS" };
      if (isSendingTts) return { error: "Attends la fin de la génération TTS..." };

      const modResult = moderateMessage(content, sacreModeEnabled);
      if (!modResult.allowed) {
        return { error: modResult.reason };
      }

      setIsSendingTts(true);

      try {
        const response = await fetch("/api/chat/tts", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${authToken}`,
          },
          body: JSON.stringify({
            streamId,
            content: modResult.sanitized,
            isSacre: modResult.isSacre,
          }),
        });

        if (!response.ok) {
          const data = await response.json();
          return { error: data.error ?? "Erreur TTS" };
        }

        return {};
      } catch {
        return { error: "Connexion perdue. Réessaie." };
      } finally {
        setIsSendingTts(false);
      }
    },
    [streamId, currentUserId, sacreModeEnabled, isSendingTts, authToken]
  );

  // ─── Send Spray Message (AI Graffiti) ──────────────────────────────────────
  const [isSendingSpray, setIsSendingSpray] = useState(false);

  const sendSprayMessage = useCallback(
    async (prompt: string): Promise<{ error?: string }> => {
      if (!currentUserId || !authToken) return { error: "Tu dois être connecté pour sprayer un graffiti" };
      if (isSendingSpray) return { error: "Attends la fin de la génération du graffiti..." };

      setIsSendingSpray(true);

      try {
        const response = await fetch("/api/chat/spray", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${authToken}`,
          },
          body: JSON.stringify({
            streamId,
            prompt,
          }),
        });

        if (!response.ok) {
          const data = await response.json();
          return { error: data.error ?? "Erreur lors du spray" };
        }

        return {};
      } catch {
        return { error: "Connexion perdue. Réessaie." };
      } finally {
        setIsSendingSpray(false);
      }
    },
    [streamId, currentUserId, isSendingSpray, authToken]
  );

  return {
    messages,
    sendMessage,
    sendTtsMessage,
    sendSprayMessage,
    isConnected,
    isSending,
    isSendingTts,
    isSendingSpray,
  };
}
