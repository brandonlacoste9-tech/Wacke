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
  currentUser?: { username: string; displayName: string; avatarUrl?: string | null };
}

interface UseGraffitiChatReturn {
  messages: ChatMessage[];
  sendMessage: (content: string) => Promise<{ error?: string }>;
  sendTtsMessage: (content: string, lang?: "fr" | "en") => Promise<{ error?: string }>;
  sendSprayMessage: (prompt: string) => Promise<{ error?: string }>;
  sendSoundboardMessage: (soundType: string) => Promise<{ error?: string }>;
  sendSacreMessage: (prefix: string, core: string, suffix: string, useTts: boolean, lang?: "fr" | "en") => Promise<{ error?: string }>;
  isConnected: boolean;
  isSending: boolean;
  isSendingTts: boolean;
  isSendingSpray: boolean;
  isSendingSound: boolean;
  isSendingSacre: boolean;
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
  currentUser,
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

  // ─── WackeBot Chat Welcome Announcement ────────────────────────────────────
  useEffect(() => {
    if (!streamId) return;
    const timer = setTimeout(() => {
      const isEn = typeof window !== "undefined" && localStorage.getItem("wacke_lang") === "en";
      const welcomeMsg: ChatMessage = {
        id: "wackebot-welcome-system",
        streamId,
        userId: "wackebot-system-id",
        content: isEn 
          ? "🤖 WackeBot: Streamer is featured right now on Wacke.live! Send tips to trigger TTS, AI stickers, or arcade soundboard effects! 🪙🔥"
          : "🤖 WackeBot: Ce stream est en vedette sur Wacké ! Utilise tes jetons pour déclencher des alertes vocales (TTS), des stickers AI et des sons retro ! 🪙🔥",
        isSacre: false,
        createdAt: new Date().toISOString(),
        user: {
          id: "wackebot-system-id",
          username: "WackeBot",
          displayName: "WackeBot 🤖",
          avatarUrl: "/token.png"
        }
      };
      setMessages((prev) => {
        if (prev.some(m => m.id === welcomeMsg.id)) return prev;
        return [...prev, welcomeMsg];
      });
    }, 1500);
    return () => clearTimeout(timer);
  }, [streamId]);

  // ─── WackeBot Periodic Helpful Reminders ─────────────────────────────────
  useEffect(() => {
    if (!streamId) return;
    
    const tips = {
      fr: [
        "💡 Astuce : Réclame ton bonus de +500 jetons dans le Header pour débloquer les stickers AI !",
        "🔥 Hype : Ce stream est actuellement classé dans les tendances Wacké !",
        "📢 Info : Tu peux jouer des sons rétro (Sirène, Laser, Cling) directement sur le stream !",
        "🗣️ TTS : Fais lire ton message par la voix wackée de Mathieu en cochant l'option TTS (50 🪙) !",
      ],
      en: [
        "💡 Tip: Claim your daily +500 tokens bonus in the Header to unlock AI stickers!",
        "🔥 Hype: This stream is currently trending on the Wacké homepage!",
        "📢 Info: You can play arcade sounds (Siren, Laser, Chime) directly live on stream!",
        "🗣️ TTS: Make Mathieu read your message aloud by ticking the TTS checkbox (50 🪙)!",
      ]
    };

    const interval = setInterval(() => {
      const isEn = typeof window !== "undefined" && localStorage.getItem("wacke_lang") === "en";
      const pool = isEn ? tips.en : tips.fr;
      const randomTip = pool[Math.floor(Math.random() * pool.length)];

      const botMessage: ChatMessage = {
        id: `wackebot-periodic-${Date.now()}`,
        streamId,
        userId: "wackebot-system-id",
        content: `🤖 WackeBot: ${randomTip}`,
        isSacre: false,
        createdAt: new Date().toISOString(),
        user: {
          id: "wackebot-system-id",
          username: "WackeBot",
          displayName: "WackeBot 🤖",
          avatarUrl: "/token.png"
        }
      };

      setMessages((prev) => {
        if (prev.some(m => m.content === botMessage.content)) return prev;
        return [...prev, botMessage].slice(-100);
      });
    }, 120_000); // every 2 minutes

    return () => clearInterval(interval);
  }, [streamId]);

  // ─── Send Message ──────────────────────────────────────────────────────────
  const sendMessage = useCallback(
    async (content: string): Promise<{ error?: string }> => {
      if (isSending) return { error: "Attends un peu..." };

      // Client-side moderation pre-check
      const modResult = moderateMessage(content, sacreModeEnabled);
      if (!modResult.allowed) {
        return { error: modResult.reason };
      }

      // Demo/mock streams (Twitch & Kick embed fallbacks) have no DB stream row.
      // Echo the message locally so the chat feels alive instead of 404-ing.
      const isMockStream =
        streamId.startsWith("twitch-mock-chat-") ||
        streamId.startsWith("kick-mock-chat-");
      if (isMockStream) {
        const echo: ChatMessage = {
          id: `local-${Date.now()}`,
          streamId,
          userId: currentUserId ?? "guest",
          content: modResult.sanitized,
          isSacre: modResult.isSacre,
          createdAt: new Date().toISOString(),
          user: {
            id: currentUserId ?? "guest",
            username: currentUser?.username ?? "invite",
            displayName: currentUser?.displayName ?? "Invité",
            avatarUrl: currentUser?.avatarUrl ?? null,
          },
        };
        setMessages((prev) =>
          prev.some((m) => m.id === echo.id) ? prev : [...prev, echo].slice(-100)
        );
        return {};
      }

      if (!currentUserId) return { error: "Tu dois être connecté pour chatter" };
      if (!authToken) {
        return { error: "Tu dois être connecté pour chatter" };
      }

      setIsSending(true);

      try {
        const response = await fetch("/api/chat", {
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
          // Friendlier message for the common 401 case
          if (response.status === 401) {
            return { error: "Tu dois être connecté pour chatter" };
          }
          return { error: data.error ?? "Erreur d'envoi" };
        }

        return {};
      } catch {
        return { error: "Connexion perdue. Réessaie." };
      } finally {
        setIsSending(false);
      }
    },
    [streamId, currentUserId, currentUser, authToken, sacreModeEnabled, isSending]
  );

  // ─── Send TTS Message ──────────────────────────────────────────────────────
  const sendTtsMessage = useCallback(
    async (content: string, lang: "fr" | "en" = "fr"): Promise<{ error?: string }> => {
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
            lang,
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

  // ─── Soundboard & Sacre Triggers ──────────────────────────────────────────
  const [isSendingSound, setIsSendingSound] = useState(false);
  const [isSendingSacre, setIsSendingSacre] = useState(false);

  const sendSoundboardMessage = useCallback(
    async (soundType: string): Promise<{ error?: string }> => {
      if (!currentUserId || !authToken) return { error: "Tu dois être connecté pour jouer un son" };
      if (isSendingSound) return { error: "Attends la fin de la lecture..." };

      setIsSendingSound(true);

      try {
        const response = await fetch("/api/chat/sound", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${authToken}`,
          },
          body: JSON.stringify({
            streamId,
            soundType,
          }),
        });

        if (!response.ok) {
          const data = await response.json();
          return { error: data.error ?? "Erreur lors du soundboard" };
        }

        return {};
      } catch {
        return { error: "Connexion perdue. Réessaie." };
      } finally {
        setIsSendingSound(false);
      }
    },
    [streamId, currentUserId, isSendingSound, authToken]
  );

  const sendSacreMessage = useCallback(
    async (prefix: string, core: string, suffix: string, useTts: boolean, lang: "fr" | "en" = "fr"): Promise<{ error?: string }> => {
      if (!currentUserId || !authToken) return { error: "Tu dois être connecté pour jurer" };
      if (isSendingSacre) return { error: "Attends que le sacre soit envoyé..." };

      setIsSendingSacre(true);

      try {
        if (useTts) {
          const sentence = `${prefix} ${core} ${suffix}!`;
          const response = await fetch("/api/chat/tts", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${authToken}`,
            },
            body: JSON.stringify({
              streamId,
              content: sentence,
              isSacre: true,
              lang,
            }),
          });

          if (!response.ok) {
            const data = await response.json();
            return { error: data.error ?? "Erreur TTS" };
          }
        } else {
          const response = await fetch("/api/chat/sacre", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${authToken}`,
            },
            body: JSON.stringify({
              streamId,
              prefix,
              core,
              suffix,
            }),
          });

          if (!response.ok) {
            const data = await response.json();
            return { error: data.error ?? "Erreur sacre" };
          }
        }

        return {};
      } catch {
        return { error: "Connexion perdue. Réessaie." };
      } finally {
        setIsSendingSacre(false);
      }
    },
    [streamId, currentUserId, isSendingSacre, authToken]
  );

  return {
    messages,
    sendMessage,
    sendTtsMessage,
    sendSprayMessage,
    sendSoundboardMessage,
    sendSacreMessage,
    isConnected,
    isSending,
    isSendingTts,
    isSendingSpray,
    isSendingSound,
    isSendingSacre,
  };
}
