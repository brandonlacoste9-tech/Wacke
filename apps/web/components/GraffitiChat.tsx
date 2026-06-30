"use client";

import { useState, useRef, useEffect } from "react";
import { useGraffitiChat, type ChatMessage } from "@/hooks/useGraffitiChat";
import { Moon, Flame, Mic } from "lucide-react";
import { useAuth } from "./AuthProvider";

// ─── Colour palette for usernames ─────────────────────────────────────────────
const USER_COLORS = [
  "text-yellow-400",
  "text-purple-400",
  "text-pink-400",
  "text-cyan-400",
  "text-green-400",
  "text-orange-400",
];

function getUserColor(userId: string): string {
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = userId.charCodeAt(i) + ((hash << 5) - hash);
  }
  return USER_COLORS[Math.abs(hash) % USER_COLORS.length];
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
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
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

  return (
    <aside className="w-96 bg-wacke-darker border-l border-wacke-purple/30 flex flex-col h-full">

      {/* ── Chat Header ───────────────────────────────────────────────────── */}
      <div className="p-4 border-b border-wacke-purple/30 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <img src="/spray_can.png" alt="Graffiti" className="h-6 w-6 object-contain drop-shadow-[0_0_8px_rgba(255,0,255,0.8)]" />
          <h2 className="text-xl font-bold graffiti-text neon-pink">GRAFFITI CHAT</h2>
          {/* Live connection indicator */}
          <span
            className={`w-2 h-2 rounded-full ${
              isConnected ? "bg-green-400 animate-pulse" : "bg-red-500"
            }`}
            title={isConnected ? "Connecté en temps réel" : "Reconnexion..."}
          />
        </div>
        <button
          onClick={() => setSacreMode((prev) => !prev)}
          className={`text-xs px-3 py-1 rounded-full font-bold transition-colors flex items-center space-x-1 ${
            sacreMode ? "bg-red-600 text-white" : "bg-gray-600 text-gray-300"
          }`}
          title={sacreMode ? "Mode Sacré actif" : "Mode Sacré désactivé"}
        >
          <span>MODE SACRÉ</span>
          {sacreMode ? (
            <img src="/fire.png" alt="Fire" className="h-4 w-4 object-contain ml-1" />
          ) : (
            <Moon className="w-4 h-4 ml-1" />
          )}
        </button>
      </div>

      {/* ── Chat Messages ─────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 && (
          <p className="text-gray-500 text-sm text-center mt-8">
            Sois le premier à sprayer un message...
          </p>
        )}
        {messages.map((msg) => (
          <div key={msg.id} className="animate-fade-in">
            <p className={`text-sm font-bold ${getUserColor(msg.userId)}`}>
              {msg.user?.displayName ?? msg.user?.username ?? "Anonyme"}
              {msg.isSacre && (
                <span className="ml-1 text-xs text-red-400" title="Mode Sacré">
                  <Flame className="w-3 h-3 inline text-red-500 fill-current drop-shadow-[0_0_5px_rgba(255,0,0,0.8)]" />
                </span>
              )}
              {msg.audioUrl && (
                <span className="ml-1 text-xs text-wacke-cyan" title="Message Vocal AI">
                  <Mic className="w-3 h-3 inline text-wacke-cyan drop-shadow-[0_0_5px_rgba(0,255,255,0.8)]" />
                </span>
              )}
            </p>
            <p className="text-sm text-gray-200 ml-2 break-words">{msg.content}</p>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* ── Error Banner ──────────────────────────────────────────────────── */}
      {errorMsg && (
        <div className="mx-4 mb-2 px-3 py-2 bg-red-900/60 border border-red-500/40 rounded-lg text-xs text-red-300">
          {errorMsg}
        </div>
      )}

      {/* ── Chat Input ────────────────────────────────────────────────────── */}
      <div className="p-4 border-t border-wacke-purple/30">
        <div className="flex space-x-2">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              currentUserId ? "Spray ton message..." : "Connecte-toi pour chatter..."
            }
            disabled={!currentUserId || isSending || isSendingTts}
            maxLength={500}
            className="flex-1 bg-wacke-dark border border-wacke-purple/40 rounded-lg px-4 py-2 text-sm
                       focus:outline-none focus:border-wacke-cyan/60 transition-colors
                       disabled:opacity-50 disabled:cursor-not-allowed"
          />
          <button
            onClick={handleSend}
            disabled={!currentUserId || isSending || isSendingTts || !inputValue.trim()}
            className="bg-gradient-to-r from-wacke-pink to-wacke-purple px-4 py-2 rounded-lg
                       hover:opacity-80 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
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
            className="flex items-center space-x-1.5 text-[10px] bg-wacke-dark border border-wacke-cyan/30 text-wacke-cyan px-3 py-1.5 rounded-lg hover:bg-wacke-cyan/10 transition-colors disabled:opacity-50 font-bold uppercase tracking-wider"
          >
            <Mic className="w-3 h-3" />
            <span>{isSendingTts ? "Génération..." : "TTS (50 🪙)"}</span>
          </button>
        </div>

      </div>
    </aside>
  );
}
