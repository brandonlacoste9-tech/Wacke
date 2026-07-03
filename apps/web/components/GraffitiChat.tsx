"use client";

import { useState, useRef, useEffect } from "react";
import { useGraffitiChat, type ChatMessage } from "@/hooks/useGraffitiChat";
import { Moon, Flame, Mic, Users, Sparkles, Volume2 } from "lucide-react";
import { useAuth } from "./AuthProvider";
import EmojiPicker from "./EmojiPicker";
import { playSyntheticSound } from "@/lib/audio";

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
  if (content.startsWith("[spray]:")) {
    const url = content.substring(8);
    return (
      <div className="mt-1.5 relative group max-w-[180px] rounded-xl overflow-hidden border border-wacke-pink/20 hover:border-wacke-pink/40 bg-black/40 p-1.5 animate-scale-in">
        <img
          src={url}
          alt="Graffiti Sticker"
          className="w-full h-auto rounded-lg object-contain drop-shadow-[0_0_8px_rgba(255,20,147,0.5)]"
        />
        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
          <span className="text-[8px] font-bold text-wacke-pink uppercase tracking-widest">STICKER AI</span>
        </div>
      </div>
    );
  }
  if (content.startsWith("[sound]:")) {
    const soundType = content.substring(8);
    const soundLabels: Record<string, string> = {
      bell: "🔔 Cling-Cling",
      coin: "🪙 Coin-Coin",
      alarm: "🚨 Alerte!",
      laser: "⚡ Laser",
    };
    return (
      <span className="text-yellow-400 font-bold italic tracking-wide text-[10px] bg-yellow-500/10 px-2 py-0.5 rounded-lg border border-yellow-500/25 inline-flex items-center space-x-1">
        <span>a joué le son</span>
        <span className="underline">{soundLabels[soundType] || soundType}</span>
      </span>
    );
  }
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

  const [showSprayPanel, setShowSprayPanel] = useState(false);
  const [sprayPrompt, setSprayPrompt] = useState("");

  const [showSoundboard, setShowSoundboard] = useState(false);
  const [showSacres, setShowSacres] = useState(false);

  const SACRE_PREFIXES = ["Saint-ciboire de", "Calvaire de", "Ostie de", "Jésus de"];
  const SACRE_CORES = ["tabarnak", "câlisse", "ciboire", "crisse"];
  const SACRE_SUFFIXES = ["de marde", "sale", "d'enfer", "d'épais"];

  const [sacrePrefix, setSacrePrefix] = useState(SACRE_PREFIXES[0]);
  const [sacreCore, setSacreCore] = useState(SACRE_CORES[0]);
  const [sacreSuffix, setSacreSuffix] = useState(SACRE_SUFFIXES[0]);
  const [sacreTts, setSacreTts] = useState(false);

  const {
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
  } = useGraffitiChat({
    streamId,
    currentUserId,
    sacreModeEnabled: sacreMode,
    initialMessages,
    authToken: token || undefined,
  });

  const handleSpray = async () => {
    if (!sprayPrompt.trim() || isSendingSpray) return;
    setErrorMsg(null);
    const { error } = await sendSprayMessage(sprayPrompt.trim());
    if (error) {
      setErrorMsg(error);
      return;
    }
    setSprayPrompt("");
    setShowSprayPanel(false);
  };

  const handleTriggerSound = async (soundType: string) => {
    setErrorMsg(null);
    const { error } = await sendSoundboardMessage(soundType);
    if (error) {
      setErrorMsg(error);
      return;
    }
    setShowSoundboard(false);
  };

  const handleSacreSubmit = async () => {
    setErrorMsg(null);
    const { error } = await sendSacreMessage(sacrePrefix, sacreCore, sacreSuffix, sacreTts);
    if (error) {
      setErrorMsg(error);
      return;
    }
    setShowSacres(false);
  };

  // Track played audio to prevent duplicate playback on re-renders
  const playedAudioRef = useRef<Set<string>>(new Set());

  // Auto-scroll to bottom on new messages and play TTS/WebAudio chimes
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });

    if (messages.length > 0) {
      const latestMessage = messages[messages.length - 1];
      
      // Play TTS audio
      if (latestMessage.audioUrl && !playedAudioRef.current.has(latestMessage.id)) {
        playedAudioRef.current.add(latestMessage.id);
        const audio = new Audio(latestMessage.audioUrl);
        audio.play().catch(e => console.error("Auto-play prevented", e));
      }

      // Play soundboard chimes
      if (latestMessage.content.startsWith("[sound]:") && !playedAudioRef.current.has(latestMessage.id)) {
        playedAudioRef.current.add(latestMessage.id);
        const soundType = latestMessage.content.substring(8);
        playSyntheticSound(soundType);
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

      {/* ── AI Spray Panel ───────────────────────────────────────────────── */}
      {showSprayPanel && (
        <div className="p-3 border-t border-wacke-purple/20 bg-wacke-purple/5 space-y-2 animate-scale-in">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-wacke-cyan flex items-center space-x-1">
              <Sparkles className="w-3.5 h-3.5" />
              <span>GÉNÉRATEUR DE STICKERS AI (100 🪙)</span>
            </span>
            <button
              onClick={() => setShowSprayPanel(false)}
              className="text-gray-500 hover:text-white text-xs font-bold"
            >
              ✕
            </button>
          </div>
          <div className="flex space-x-2">
            <input
              type="text"
              value={sprayPrompt}
              onChange={(e) => setSprayPrompt(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSpray();
                }
              }}
              placeholder="Ex: un canard punk en veste noire..."
              disabled={isSendingSpray}
              className="flex-1 bg-white/3 border border-wacke-purple/20 rounded-xl px-3 py-1.5 text-xs
                         focus:border-wacke-cyan/40 transition-all placeholder:text-gray-600"
            />
            <button
              onClick={handleSpray}
              disabled={isSendingSpray || !sprayPrompt.trim()}
              className="bg-gradient-to-r from-wacke-pink to-wacke-purple text-xs font-bold px-3 py-1.5 rounded-xl
                         hover:opacity-90 disabled:opacity-40 transition-all active:scale-95 shrink-0"
            >
              {isSendingSpray ? "Spray..." : "Sprayer"}
            </button>
          </div>
          {isSendingSpray && (
            <div className="flex items-center space-x-2 text-[9px] text-wacke-pink animate-pulse mt-1">
              <span className="w-1.5 h-1.5 bg-wacke-pink rounded-full animate-ping shrink-0" />
              <span>L&apos;IA dessine ton graffiti... (2s)</span>
            </div>
          )}
        </div>
      )}

      {/* ── Soundboard Panel ───────────────────────────────────────────── */}
      {showSoundboard && (
        <div className="p-3.5 border-t border-wacke-purple/20 bg-wacke-purple/5 space-y-2.5 animate-scale-in">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-yellow-400 flex items-center space-x-1">
              <Volume2 className="w-3.5 h-3.5" />
              <span>SOUNDBOARD INTERACTIVE</span>
            </span>
            <button
              onClick={() => setShowSoundboard(false)}
              className="text-gray-500 hover:text-white text-xs font-bold"
            >
              ✕
            </button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {[
              { type: "bell", label: "🔔 Cling-Cling", cost: 20 },
              { type: "coin", label: "🪙 Coin-Coin", cost: 30 },
              { type: "alarm", label: "🚨 Alerte!", cost: 40 },
              { type: "laser", label: "⚡ Laser", cost: 50 },
            ].map((snd) => (
              <button
                key={snd.type}
                onClick={() => handleTriggerSound(snd.type)}
                disabled={isSendingSound}
                className="bg-wacke-purple/10 hover:bg-wacke-purple/35 border border-wacke-purple/25
                           px-3 py-2 rounded-xl text-left transition-all hover:scale-105 active:scale-95 flex flex-col justify-between"
              >
                <span className="text-[11px] font-bold text-white">{snd.label}</span>
                <span className="text-[9px] font-extrabold text-yellow-400 mt-1">{snd.cost} 🪙</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Swears Generator Panel ──────────────────────────────────────── */}
      {showSacres && (
        <div className="p-3.5 border-t border-wacke-purple/20 bg-wacke-purple/5 space-y-3 animate-scale-in">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-red-400 flex items-center space-x-1">
              <span>🤬</span>
              <span>GÉNÉRATEUR DE SACRES QUÉBÉCOIS</span>
            </span>
            <button
              onClick={() => setShowSacres(false)}
              className="text-gray-500 hover:text-white text-xs font-bold"
            >
              ✕
            </button>
          </div>

          <div className="grid grid-cols-3 gap-1.5">
            {/* Prefixes */}
            <div className="flex flex-col space-y-1">
              <label className="text-[8px] font-extrabold text-gray-500 uppercase px-1">Préfixe</label>
              <select
                value={sacrePrefix}
                onChange={(e) => setSacrePrefix(e.target.value)}
                className="bg-wacke-dark border border-wacke-purple/25 rounded-lg px-2 py-1 text-[10px] text-white focus:outline-none"
              >
                {SACRE_PREFIXES.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            {/* Core */}
            <div className="flex flex-col space-y-1">
              <label className="text-[8px] font-extrabold text-gray-500 uppercase px-1">Sacre</label>
              <select
                value={sacreCore}
                onChange={(e) => setSacreCore(e.target.value)}
                className="bg-wacke-dark border border-wacke-purple/25 rounded-lg px-2 py-1 text-[10px] text-white focus:outline-none"
              >
                {SACRE_CORES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            {/* Suffix */}
            <div className="flex flex-col space-y-1">
              <label className="text-[8px] font-extrabold text-gray-500 uppercase px-1">Suffixe</label>
              <select
                value={sacreSuffix}
                onChange={(e) => setSacreSuffix(e.target.value)}
                className="bg-wacke-dark border border-wacke-purple/25 rounded-lg px-2 py-1 text-[10px] text-white focus:outline-none"
              >
                {SACRE_SUFFIXES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>

          <div className="flex items-center justify-between pt-1 border-t border-wacke-purple/10">
            <label className="flex items-center space-x-1.5 cursor-pointer select-none text-[9px] font-bold text-gray-400">
              <input
                type="checkbox"
                checked={sacreTts}
                onChange={(e) => setSacreTts(e.target.checked)}
                className="rounded border-wacke-purple/20 bg-white/5 text-wacke-pink focus:ring-0 focus:ring-offset-0"
              />
              <span>Hurler via TTS (+50 🪙)</span>
            </label>

            <button
              onClick={handleSacreSubmit}
              disabled={isSendingSacre}
              className="bg-gradient-to-r from-red-600 to-orange-500 text-[10px] font-extrabold px-3 py-1.5 rounded-lg text-white hover:scale-105 active:scale-95 transition-all shadow-md shadow-red-500/10 shrink-0"
            >
              {isSendingSacre ? "Cri en cours..." : `Crier (${sacreTts ? 60 : 10} 🪙)`}
            </button>
          </div>
        </div>
      )}

      {/* ── Chat Input ────────────────────────────────────────────────────── */}
      <div className="p-3 border-t border-wacke-purple/20">
        <div className="flex space-x-2">
          {/* Emoji toggle */}
          <button
            onClick={() => {
              setShowEmojis((prev) => !prev);
              setShowSprayPanel(false);
              setShowSoundboard(false);
              setShowSacres(false);
            }}
            className={`px-2 py-2 rounded-lg text-sm transition-all shrink-0 ${
              showEmojis ? "bg-wacke-purple/20 text-wacke-pink" : "text-gray-500 hover:text-white hover:bg-white/5"
            }`}
            title="Emojis"
            type="button"
          >
            😀
          </button>
          {/* AI Spray toggle */}
          <button
            onClick={() => {
              setShowSprayPanel((prev) => !prev);
              setShowEmojis(false);
              setShowSoundboard(false);
              setShowSacres(false);
            }}
            className={`px-2 py-2 rounded-lg text-sm transition-all shrink-0 ${
              showSprayPanel ? "bg-wacke-purple/20 text-wacke-cyan" : "text-gray-500 hover:text-white hover:bg-white/5"
            }`}
            title="Générateur de stickers AI (100 jetons)"
            type="button"
          >
            🎨
          </button>
          {/* Soundboard toggle */}
          <button
            onClick={() => {
              setShowSoundboard((prev) => !prev);
              setShowEmojis(false);
              setShowSprayPanel(false);
              setShowSacres(false);
            }}
            className={`px-2 py-2 rounded-lg text-sm transition-all shrink-0 ${
              showSoundboard ? "bg-wacke-purple/20 text-yellow-400" : "text-gray-500 hover:text-white hover:bg-white/5"
            }`}
            title="Soundboard interactive (20-50 jetons)"
            type="button"
          >
            📢
          </button>
          {/* Sacres toggle */}
          <button
            onClick={() => {
              setShowSacres((prev) => !prev);
              setShowEmojis(false);
              setShowSprayPanel(false);
              setShowSoundboard(false);
            }}
            className={`px-2 py-2 rounded-lg text-sm transition-all shrink-0 ${
              showSacres ? "bg-wacke-purple/20 text-red-400" : "text-gray-500 hover:text-white hover:bg-white/5"
            }`}
            title="Générateur de sacres (10 jetons)"
            type="button"
          >
            🤬
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
