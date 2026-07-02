"use client";

import { useState, useRef, useEffect } from "react";
import { useGraffitiChat, type ChatMessage } from "@/hooks/useGraffitiChat";
import { Moon, Flame, Mic, Users } from "lucide-react";
import { useAuth } from "./AuthProvider";
import EmojiPicker from "./EmojiPicker";

// ─── Colour palette for usernames ─────────────────────────────────────────────
const USER_COLORS = [
  "text-yellow-400",
  "text-purple-400",
  "text-pink-400",
  "text-cyan-400",
  "text-green-400",
  "text-orange-400",
  "text-rose-400",
  "text-emerald-400",
];

function getUserColor(userId: string): string {
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = userId.charCodeAt(i) + ((hash << 5) - hash);
  }
  return USER_COLORS[Math.abs(hash) % USER_COLORS.length];
}

function formatTime(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    return d.toLocaleTimeString("fr-CA", { hour: "2-digit", minute: "2-digit" });
  } catch {
    return "";
  }
}

// Highlight @mentions in message content
function renderContent(content: string): React.ReactNode {
  const parts = content.split(/(@\w+)/g);
  return parts.map((part, i) => {
    if (part.startsWith("@")) {
      return (
        <span key={i} className="text-wacke-cyan font-bold">
          {part}
        </span>
      );
    }
    return part;
  });
}

interface GraffitiChatProps {
  streamId: string;
  currentUserId?: string;
  initialMessages?: ChatMessage[];
}

export default function GraffitiChat({
  streamId,
  currentUserId,
  initialMessages = [],
}: GraffitiChatProps) {
  const [sacreMode, setSacreMode] = useState(true);
  const [inputValue, setInputValue] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showEmojis, setShowEmojis] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { token } = useAuth();

  const { messages, sendMessage, sendTtsMessage, isConnected, isSending, isSendingTts } = useGraffitiChat({
    streamId,
    currentUserId,
    sacreModeEnabled: sacreMode,
    initialMessages,
    authToken: token || undefined,
  });

  // Track played audio to prevent duplicate playback on re-renders
  const playedAudioRef = useRef<Set<string>>(new Set());

  // Auto-scroll to bottom on new messages and play TTS
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });

    // Check if the latest message has TTS and we haven't played it yet
    if (messages.length > 0) {
      const latestMessage = messages[messages.length - 1];
      if (latestMessage.audioUrl && !playedAudioRef.current.has(latestMessage.id)) {
        playedAudioRef.current.add(latestMessage.id);
        const audio = new Audio(latestMessage.audioUrl);
        audio.play().catch(e => console.error("Auto-play prevented", e));
      }
    }
  }, [messages]);

  const handleSend = async () => {
    if (!inputValue.trim() || isSending || isSendingTts) return;
    setErrorMsg(null);

    const { error } = await sendMessage(inputValue.trim());
    if (error) {
      setErrorMsg(error);
      return;
    }
    setInputValue("");
  };

  const handleSendTts = async () => {
    if (!inputValue.trim() || isSending || isSendingTts) return;
    setErrorMsg(null);

    const { error } = await sendTtsMessage(inputValue.trim());
    if (error) {
      setErrorMsg(error);
      return;
    }
    setInputValue("");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleEmojiSelect = (emoji: string) => {
    setInputValue((prev) => prev + emoji);
    inputRef.current?.focus();
  };

  return (
    <aside className="w-96 bg-wacke-darker/95 border-l border-wacke-purple/20 flex flex-col h-full backdrop-blur-sm">

      {/* ── Chat Header ───────────────────────────────────────────────────── */}
      <div className="p-4 border-b border-wacke-purple/20 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <img src="/spray_can.png" alt="Graffiti" className="h-5 w-5 object-contain drop-shadow-[0_0_6px_rgba(255,0,255,0.6)]" />
          <h2 className="text-lg font-bold graffiti-text neon-pink">GRAFFITI CHAT</h2>
          {/* Connection status */}
          <div className="flex items-center space-x-1">
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                isConnected ? "bg-green-400 animate-pulse" : "bg-red-500"
              }`}
            />
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {/* Chat user count */}
          <div className="flex items-center space-x-1 text-[10px] text-gray-500">
            <Users className="w-3 h-3" />
            <span>{messages.length > 0 ? new Set(messages.map(m => m.userId)).size : 0}</span>
          </div>
          {/* Mode Sacré toggle */}
          <button
            onClick={() => setSacreMode((prev) => !prev)}
            className={`text-[10px] px-2.5 py-1 rounded-full font-bold transition-all flex items-center space-x-1 ${
              sacreMode
                ? "bg-red-600/80 text-white shadow-[0_0_8px_rgba(255,0,0,0.3)]"
                : "bg-gray-700/50 text-gray-400"
            }`}
            title={sacreMode ? "Mode Sacré actif — sacres permis" : "Mode Sacré désactivé"}
          >
            <span>SACRÉ</span>
            {sacreMode ? (
              <Flame className="w-3 h-3 fill-current" />
            ) : (
              <Moon className="w-3 h-3" />
            )}
          </button>
        </div>
      </div>

      {/* ── Chat Messages ─────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2 scrollbar-hide">
        {messages.length === 0 && (
          <div className="text-center mt-12 space-y-3">
            <img src="/spray_can.png" alt="Spray" className="w-10 h-10 mx-auto opacity-30" />
            <p className="text-gray-600 text-xs font-medium">
              Sois le premier à sprayer un message...
            </p>
          </div>
        )}
        {messages.map((msg) => (
          <div key={msg.id} className="animate-spray-in group">
            <div className="flex items-baseline space-x-1.5">
              <span className="text-[10px] text-gray-700 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                {formatTime(msg.createdAt)}
              </span>
              <p className={`text-xs font-bold ${getUserColor(msg.userId)} shrink-0`}>
                {msg.user?.displayName ?? msg.user?.username ?? "Anonyme"}
                {msg.isSacre && (
                  <Flame className="w-3 h-3 inline ml-0.5 text-red-500 fill-current drop-shadow-[0_0_4px_rgba(255,0,0,0.6)]" />
                )}
                {msg.audioUrl && (
                  <Mic className="w-3 h-3 inline ml-0.5 text-wacke-cyan drop-shadow-[0_0_4px_rgba(0,255,255,0.6)]" />
                )}
              </p>
              <p className="text-xs text-gray-300 break-words min-w-0">{renderContent(msg.content)}</p>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* ── Error Banner ──────────────────────────────────────────────────── */}
      {errorMsg && (
        <div className="mx-4 mb-2 px-3 py-2 bg-red-900/40 border border-red-500/30 rounded-lg text-[10px] text-red-300 animate-fade-in">
          {errorMsg}
        </div>
      )}

      {/* ── Emoji Picker ──────────────────────────────────────────────────── */}
      {showEmojis && (
        <div className="px-4 py-1 border-t border-wacke-purple/10 animate-fade-in">
          <EmojiPicker onSelect={handleEmojiSelect} />
        </div>
      )}

      {/* ── Chat Input ────────────────────────────────────────────────────── */}
      <div className="p-3 border-t border-wacke-purple/20">
        <div className="flex space-x-2">
          {/* Emoji toggle */}
          <button
            onClick={() => setShowEmojis((prev) => !prev)}
            className={`px-2 py-2 rounded-lg text-sm transition-all shrink-0 ${
              showEmojis ? "bg-wacke-purple/20 text-wacke-pink" : "text-gray-500 hover:text-white hover:bg-white/5"
            }`}
            title="Emojis"
            type="button"
          >
            😀
          </button>
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              currentUserId ? "Spray ton message..." : "Connecte-toi pour chatter..."
            }
            disabled={!currentUserId || isSending || isSendingTts}
            maxLength={500}
            className="flex-1 bg-white/3 border border-wacke-purple/20 rounded-xl px-3 py-2 text-sm
                       focus:border-wacke-cyan/40 focus:bg-white/5 transition-all
                       disabled:opacity-40 disabled:cursor-not-allowed placeholder:text-gray-600"
          />
          <button
            onClick={handleSend}
            disabled={!currentUserId || isSending || isSendingTts || !inputValue.trim()}
            className="bg-gradient-to-r from-wacke-pink to-wacke-purple px-3.5 py-2 rounded-xl
                       hover:opacity-80 transition-all disabled:opacity-30 disabled:cursor-not-allowed
                       hover:scale-105 active:scale-95"
            aria-label="Envoyer"
          >
            {isSending ? "..." : "➤"}
          </button>
        </div>

        {/* TTS Button */}
        <div className="mt-2 flex justify-end">
          <button
            onClick={handleSendTts}
            disabled={!currentUserId || isSending || isSendingTts || !inputValue.trim()}
            className="flex items-center space-x-1.5 text-[9px] bg-wacke-cyan/5 border border-wacke-cyan/20 text-wacke-cyan px-2.5 py-1 rounded-lg hover:bg-wacke-cyan/10 transition-all disabled:opacity-30 font-bold uppercase tracking-wider"
          >
            <Mic className="w-3 h-3" />
            <span>{isSendingTts ? "Génération..." : "TTS (50 🪙)"}</span>
          </button>
        </div>
      </div>
    </aside>
  );
}
