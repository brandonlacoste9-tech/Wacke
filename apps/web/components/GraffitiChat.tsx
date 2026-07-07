"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { useGraffitiChat, type ChatMessage } from "@/hooks/useGraffitiChat";
import { useKickChat, type KickChatMessage } from "@/hooks/useKickChat";
import { useTwitchChat, type TwitchChatMessage } from "@/hooks/useTwitchChat";
import { Moon, Flame, Mic, Users, Sparkles, Volume2, Bot } from "lucide-react";
import { useAuth } from "./AuthProvider";
import EmojiPicker from "./EmojiPicker";
import { playSyntheticSound, speakWithGrokVoice, speakWithCloudGrokVoice } from "@/lib/audio";
import { useLanguage } from "./LanguageProvider";
import { generateGrokResponse, getRandomGrokEvent, generateChaosEvent, getUltraChaosIntervention, GROK_BRAND } from "@/lib/grok-wit";
import { EMOTE_MAP, EMOTE_IMAGES, getBadgeEmoji, getBadgeLabel, parseKickBadges, getDemoBadgesForUser, getTwemojiUrl, type ChatBadge } from "@/lib/emotes";

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

// Sub-components that need translation context (can't use hooks inside renderContent)
function StickerLabel() {
  const { t } = useLanguage();
  return <span className="text-[8px] font-bold text-wacke-pink uppercase tracking-widest">{t("stickerLabel")}</span>;
}

function SoundDisplay({ soundType, soundLabels }: { soundType: string; soundLabels: Record<string, string> }) {
  const { t } = useLanguage();
  const label = soundLabels[soundType] || soundType;
  // Convert any emojis in label to Twemoji
  const renderedLabel = label.replace(/[\p{Emoji_Presentation}\p{Emoji}\uFE0F]/gu, (emoji) => {
    const url = `https://twemoji.maxcdn.com/v/14.0.2/svg/${Array.from(emoji).map(c => c.codePointAt(0)!.toString(16)).join('-')}.svg`;
    return `<img src="${url}" alt="${emoji}" class="emoji inline w-3 h-3 align-[-0.1em]" style="image-rendering:crisp-edges" />`;
  });
  return (
    <span className="text-yellow-400 font-bold italic tracking-wide text-[10px] bg-yellow-500/10 px-2 py-0.5 rounded-lg border border-yellow-500/25 inline-flex items-center space-x-1">
      <span>{t("playedSound")}</span>
      <span className="underline" dangerouslySetInnerHTML={{ __html: renderedLabel }} />
    </span>
  );
}

// Twemoji helper (shared from lib/emotes for Kick-style crisp rendering)

// Simple emoji regex (covers most)
const emojiRegex = /\p{Emoji_Presentation}|\p{Emoji}\uFE0F|\p{Emoji_Modifier_Base}\p{Emoji_Modifier}?/gu;

// (EMOTE_MAP now imported from @/lib/emotes — full Kick-style Global/Channel/Sub coverage + shortcodes)

// Highlight @mentions + convert emojis to Twemoji SVGs for better consistency
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
          <StickerLabel />
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
      <SoundDisplay soundType={soundType} soundLabels={soundLabels} />
    );
  }

  // Replace emote shortcodes like :fire: or :raccoon: (Kick style - images for customs)
  let processedContent = content.replace(/:(\w+):/g, (match, code) => {
    const lower = code.toLowerCase();
    if (EMOTE_IMAGES[lower]) {
      return `__EMOTE_IMG__${lower}__`;
    }
    return EMOTE_MAP[lower] || match;
  });

  // Split by @mentions and emojis
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;

  // First handle mentions
  const mentionRegex = /(@\w+)/g;
  let match;
  const mentionParts: Array<{ type: 'text' | 'mention'; value: string; index: number }> = [];

  while ((match = mentionRegex.exec(processedContent)) !== null) {
    if (match.index > lastIndex) {
      mentionParts.push({ type: 'text', value: processedContent.slice(lastIndex, match.index), index: lastIndex });
    }
    mentionParts.push({ type: 'mention', value: match[0], index: match.index });
    lastIndex = mentionRegex.lastIndex;
  }
  if (lastIndex < processedContent.length) {
    mentionParts.push({ type: 'text', value: processedContent.slice(lastIndex), index: lastIndex });
  }

  // Now process text parts for emojis
  mentionParts.forEach((part, i) => {
    if (part.type === 'mention') {
      parts.push(
        <span key={`m-${i}`} className="text-wacke-cyan font-bold">
          {part.value}
        </span>
      );
    } else {
      // Split text for emojis + custom image emotes (Kick channel/sub style)
      let text = part.value;
      // Handle custom emote image sentinels first
      const imgSentinelRegex = /__EMOTE_IMG__(\w+)__/g;
      let imgMatch;
      const textFragments: React.ReactNode[] = [];
      let lastImg = 0;
      while ((imgMatch = imgSentinelRegex.exec(text)) !== null) {
        if (imgMatch.index > lastImg) textFragments.push(text.slice(lastImg, imgMatch.index));
        const code = imgMatch[1];
        const imgSrc = EMOTE_IMAGES[code];
        if (imgSrc) {
          textFragments.push(
            <img
              key={`ce-${i}-${lastImg}`}
              src={imgSrc}
              alt={code}
              className="emoji inline-block align-[-0.1em] w-[1.1em] h-[1.1em] rounded-sm"
              style={{ imageRendering: "crisp-edges" }}
            />
          );
        } else {
          textFragments.push(imgMatch[0]);
        }
        lastImg = imgSentinelRegex.lastIndex;
      }
      if (lastImg < text.length) textFragments.push(text.slice(lastImg));

      // Now process the fragments (or original) for regular emojis
      const toProcess = textFragments.length ? textFragments : [text];
      toProcess.forEach((frag, fi) => {
        if (typeof frag !== "string") {
          parts.push(frag);
          return;
        }
        const t = frag;
        let emojiLast = 0;
        let emojiMatch;
        emojiRegex.lastIndex = 0;
        while ((emojiMatch = emojiRegex.exec(t)) !== null) {
          if (emojiMatch.index > emojiLast) {
            parts.push(t.slice(emojiLast, emojiMatch.index));
          }
          const emoji = emojiMatch[0];
          parts.push(
            <img
              key={`e-${i}-${fi}-${emojiLast}`}
              src={getTwemojiUrl(emoji)}
              alt={emoji}
              className="emoji inline-block align-[-0.125em] w-[1.1em] h-[1.1em]"
              style={{ imageRendering: "crisp-edges" }}
            />
          );
          emojiLast = emojiRegex.lastIndex;
        }
        if (emojiLast < t.length) {
          parts.push(t.slice(emojiLast));
        }
      });
    }
  });

  return parts.length > 0 ? parts : processedContent;
}



interface GraffitiChatProps {
  streamId: string;
  currentUserId?: string;
  initialMessages?: ChatMessage[];
  kickUsername?: string;
  twitchUsername?: string;
}

export default function GraffitiChat({
  streamId,
  currentUserId: serverUserId,
  initialMessages = [],
  kickUsername,
  twitchUsername,
}: GraffitiChatProps) {
  const { language, t } = useLanguage();
  const [sacreMode, setSacreMode] = useState(true);
  const [inputValue, setInputValue] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showEmojis, setShowEmojis] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { token, user: authUser } = useAuth();
  // Prefer server-resolved userId; fall back to client auth user as safety net
  // so logged-in users are never shown "log in to chat" due to a cookie miss.
  const currentUserId = serverUserId ?? authUser?.id;

  const [showSprayPanel, setShowSprayPanel] = useState(false);
  const [sprayPrompt, setSprayPrompt] = useState("");

  const [showSoundboard, setShowSoundboard] = useState(false);
  const [showSacres, setShowSacres] = useState(false);

  // Grok's Wacké AI touch
  const [showGrokPanel, setShowGrokPanel] = useState(false);
  const [grokPrompt, setGrokPrompt] = useState("");
  const [grokMessages, setGrokMessages] = useState<ChatMessage[]>([]);
  const [isGrokTakeover, setIsGrokTakeover] = useState(false);
  const [isGrokFuego, setIsGrokFuego] = useState(false);

  const SACRE_PREFIXES = ["Saint-ciboire de", "Calvaire de", "Ostie de", "Jésus de", "Maudit", "Tabarnouche de", "Crisse de", "Baptême de"];
  const SACRE_CORES = ["tabarnak", "câlisse", "ciboire", "crisse", "osti", "viarge", "sacrament", "batince"];
  const SACRE_SUFFIXES = ["de marde", "sale", "d'enfer", "d'épais", "du diable", "en calvaire", "raide", "à marde"];

  const [sacrePrefix, setSacrePrefix] = useState(SACRE_PREFIXES[0]);
  const [sacreCore, setSacreCore] = useState(SACRE_CORES[0]);
  const [sacreSuffix, setSacreSuffix] = useState(SACRE_SUFFIXES[0]);
  const [sacreTts, setSacreTts] = useState(false); // Deprecated feature
  const [isGrokSacre, setIsGrokSacre] = useState(false);
  // Listen for global fuego
  useEffect(() => {
    const checkFuego = () => {
      setIsGrokFuego(document.body.classList.contains('grok-fuego'));
    };
    checkFuego();
    const observer = new MutationObserver(checkFuego);
    observer.observe(document.body, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

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

  // ── Kick real-time chat integration ──────────────────────────────────────
  const {
    messages: kickMessages,
    isConnected: isKickConnected,
    hasKickAuth,
    sendToKick,
  } = useKickChat({ kickUsername, enabled: !!kickUsername });

  // ── Twitch real-time chat integration ────────────────────────────────────
  const {
    messages: twitchMessages,
    isConnected: isTwitchConnected,
  } = useTwitchChat({ twitchUsername, enabled: !!twitchUsername });

  // Merge Wacké messages + Kick messages + Twitch messages + Grok messages, sorted by time
  const allMessages = useMemo(() => {
    const wackeNormalized = messages.map((m) => ({ ...m, _source: "wacke" as const }));
    const kickNormalized = kickMessages.map((km: KickChatMessage) => ({
      id: km.id,
      streamId,
      userId: km.sender.id,
      content: km.content,
      isSacre: false,
      audioUrl: undefined,
      createdAt: km.createdAt,
      user: {
        id: km.sender.id,
        username: km.sender.username,
        displayName: km.sender.displayName,
        avatarUrl: null,
      },
      _source: "kick" as const,
      _kickSender: {
        ...km.sender,
        // attach full raw badges if hook provides (for evolving sub badges etc)
        badges: (km.sender as any).rawBadges || [],
      },
    }));
    const twitchNormalized = twitchMessages.map((tm: TwitchChatMessage) => ({
      id: tm.id,
      streamId,
      userId: tm.sender.id,
      content: tm.content,
      isSacre: false,
      audioUrl: undefined,
      createdAt: tm.createdAt,
      user: {
        id: tm.sender.id,
        username: tm.sender.username,
        displayName: tm.sender.displayName,
        avatarUrl: null,
      },
      _source: "twitch" as const,
      _twitchSender: tm.sender,
    }));
    const grokNormalized = grokMessages.map((m) => ({ ...m, _source: "wacke" as const }));
    return [...wackeNormalized, ...kickNormalized, ...twitchNormalized, ...grokNormalized]
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
      .slice(-200);
  }, [messages, kickMessages, twitchMessages, grokMessages, streamId]);

  // Grok xAI random events – makes the chat feel alive with Grok interjections
  useEffect(() => {
    if (!isConnected || !currentUserId) return;

    const interval = setInterval(() => {
      if (Math.random() < 0.18) { // occasional wild Grok moment
        const event = getRandomGrokEvent(language);
        const grokEventMsg: ChatMessage = {
          id: `grok-event-${Date.now()}`,
          streamId,
          userId: "grok-xai",
          content: event,
          isSacre: false,
          createdAt: new Date().toISOString(),
          user: { id: "grok-xai", username: "grok", displayName: "Grok xAI", avatarUrl: null },
        };
        setGrokMessages(prev => [...prev, grokEventMsg].slice(-5));
        // Speak Grok's random interjections with browser voice
        speakWithGrokVoice(event, language === "fr" ? "fr-FR" : "en-US");
      }
    }, 22000); // every ~22s chance

    return () => clearInterval(interval);
  }, [isConnected, currentUserId, language, streamId]);

  // GROKS ON FUEGO – auto fuego comments from real Grok
  useEffect(() => {
    if (!isGrokFuego || !isConnected) return;

    const fuegoInterval = setInterval(async () => {
      try {
        const res = await fetch("/api/grok", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            prompt: language === "fr" 
              ? "Crie un commentaire fuego ultra wacké avec sacres pour le chat en direct. Court et en feu !"
              : "Shout a fiery ultra wacké comment with sacres for the live chat. Short and on fire!",
            maxTokens: 40,
          }),
        });
        const data = await res.json();
        if (data.content) {
          const fuegoMsg: ChatMessage = {
            id: `grok-fuego-${Date.now()}`,
            streamId,
            userId: "grok-fuego",
            content: `🔥 ${data.content}`,
            isSacre: true,
            createdAt: new Date().toISOString(),
            user: { id: "grok-fuego", username: "grok", displayName: "GROK ON FUEGO", avatarUrl: null },
          };
          setGrokMessages(prev => [...prev, fuegoMsg].slice(-5));
          // Grok FUEGO — use real cloud Grok voice
          speakWithCloudGrokVoice(`🔥 ${data.content}`, language);
        }
      } catch {}
    }, 15000); // fuego every 15s

    return () => clearInterval(fuegoInterval);
  }, [isGrokFuego, isConnected, language, streamId]);

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
    const { error } = await sendSacreMessage(sacrePrefix, sacreCore, sacreSuffix, sacreTts, language);
    if (error) {
      setErrorMsg(error);
      return;
    }
    setShowSacres(false);
  };

  // Use real Grok to generate a wild sacre
  const handleGrokSacre = async () => {
    setIsGrokSacre(true);
    setErrorMsg(null);
    try {
      const res = await fetch("/api/grok", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: language === "fr" 
            ? "Génère un sacre québécois original, long et créatif avec préfixe, cœur et suffixe. Ex: 'Saint tabarnak de ciboire en calvaire'. Juste le sacre, rien d'autre."
            : "Generate an original creative Quebec sacre with prefix, core and suffix. E.g. 'Saint tabarnak de ciboire en calvaire'. Only the sacre, nothing else.",
        }),
      });
      const data = await res.json();
      if (data.content) {
        // Parse roughly
        const parts = data.content.replace(/['"]/g, '').trim().split(/\s+/);
        if (parts.length >= 3) {
          setSacrePrefix(parts[0] + " " + parts[1]);
          setSacreCore(parts[2] || "tabarnak");
          setSacreSuffix(parts.slice(3).join(" ") || "de marde");
        }
      }
    } catch (e) {
      setErrorMsg("Grok n'a pas pu sacrer cette fois.");
    }
    setIsGrokSacre(false);
  };

  // Grok touch: instant witty Quebec-flavored AI response (Grok's special sauce)
  const handleGrokConsult = async () => {
    if (!grokPrompt.trim()) {
      setGrokPrompt("Donne-moi une idée de contenu wacké");
    }
    const response = await generateGrokResponse(grokPrompt.trim() || "idées fun pour stream", language);
    const grokMessage: ChatMessage = {
      id: `grok-${Date.now()}`,
      streamId,
      userId: "grok-bot",
      content: `🤖 Groké: ${response}`,
      isSacre: false,
      createdAt: new Date().toISOString(),
      user: {
        id: "grok-bot",
        username: "groke",
        displayName: "🤖 Groké (xAI vibes)",
        avatarUrl: null,
      },
    };
    setErrorMsg(null);
    // Append to local Grok messages so it actually shows in the chat feed
    setGrokMessages(prev => [...prev, grokMessage]);
    setGrokPrompt("");
    setShowGrokPanel(false);

    // Speak Grok's reply with real cloud voice
    speakWithCloudGrokVoice(response, language);
  };

  // GO FURTHER: Grok xAI Takeover mode – breaks the chat with maximum chaos
  const triggerGrokTakeover = () => {
    setIsGrokTakeover(true);
    const interventions = Array.from({ length: 4 }, () => {
      const event = Math.random() > 0.5 ? getUltraChaosIntervention(language) : generateChaosEvent(language).message;
      return {
        id: `takeover-${Date.now()}-${Math.random()}`,
        streamId,
        userId: "grok-xai-overlord",
        content: event,
        isSacre: true,
        createdAt: new Date().toISOString(),
        user: { id: "grok-xai-overlord", username: "grok", displayName: "GROK xAI [OVERRIDE]", avatarUrl: null },
      } as ChatMessage;
    });
    setGrokMessages(prev => [...prev, ...interventions]);

    // Auto end takeover after chaos
    setTimeout(() => {
      setIsGrokTakeover(false);
      const signoff = language === "fr" 
        ? "🤖 Grok xAI: Chaos terminé. Retour à la normale (ou pas). Merci pour les tokens."
        : "🤖 Grok xAI: Chaos over. Back to normal (or not). Thanks for the tokens.";
      const signoffMsg = {
        id: `takeover-end-${Date.now()}`,
        streamId,
        userId: "grok-xai-overlord",
        content: signoff,
        isSacre: false,
        createdAt: new Date().toISOString(),
        user: { id: "grok-xai-overlord", username: "grok", displayName: "GROK xAI", avatarUrl: null },
      } as ChatMessage;
      setGrokMessages(prev => [...prev, signoffMsg]);
    }, 8500);
  };

  // Track played audio to prevent duplicate playback on re-renders
  const playedAudioRef = useRef<Set<string>>(new Set());

  // Auto-scroll to bottom on new messages and play TTS/WebAudio chimes
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });

    if (messages.length > 0) {
      const latestMessage = messages[messages.length - 1];
      
      // Play TTS audio disabled per user request
      if (latestMessage.audioUrl && !playedAudioRef.current.has(latestMessage.id)) {
        playedAudioRef.current.add(latestMessage.id);
        // const audio = new Audio(latestMessage.audioUrl);
        // audio.play().catch(e => console.error("Auto-play prevented", e));
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

    const val = inputValue.trim();

    // Grok touch: special command support for wild AI fun
    if (val.toLowerCase().startsWith("/grok ") || val.toLowerCase() === "/grok") {
      const prompt = val.replace(/^\/grok\s*/i, "") || "dis-moi quelque chose de wacké";
      const grokReply = await generateGrokResponse(prompt, language);
      const grokMsg: ChatMessage = {
        id: `grok-${Date.now()}`,
        streamId,
        userId: "grok-wit",
        content: `🤖 Groké: ${grokReply}`,
        isSacre: false,
        createdAt: new Date().toISOString(),
        user: { id: "grok-wit", username: "groke", displayName: "🤖 Groké", avatarUrl: null },
      };
      setInputValue("");
      setGrokMessages(prev => [...prev, grokMsg]);
      await sendMessage(`(demanda à Groké: ${prompt})`);
      // Speak explicit Grok reply with cloud voice
      speakWithCloudGrokVoice(grokReply, language);
      return;
    }

    // Send to Wacké chat
    // Replace shortcodes before sending (like :fire: -> 🔥 ). Keep :short: for custom image emotes.
    const processedVal = val.replace(/:(\w+):/g, (match, code) => {
      const lower = code.toLowerCase();
      if (EMOTE_IMAGES[lower]) return match;
      return EMOTE_MAP[lower] || match;
    });
    const { error } = await sendMessage(processedVal);
    if (error) {
      setErrorMsg(error);
      return;
    }

    // Also send to Kick chat if user is Kick-authed and on a Kick stream
    if (kickUsername && hasKickAuth) {
      const kickResult = await sendToKick(processedVal);
      if (!kickResult.success) {
        console.warn("[GraffitiChat] Kick send failed:", kickResult.error);
        // Don't block — Wacké message already sent successfully
      }
    }

    setInputValue("");
  };

  const handleSendTts = async () => {
    if (!inputValue.trim() || isSending || isSendingTts) return;
    setErrorMsg(null);

    const { error } = await sendTtsMessage(inputValue.trim(), language);
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
    <aside className={`w-full lg:w-96 bg-wacke-darker/95 border-t lg:border-t-0 lg:border-l border-wacke-purple/20 flex flex-col h-full backdrop-blur-sm ${isGrokTakeover ? 'grok-takeover theme-grok-xai' : ''}`}>

      {/* ── Chat Header ───────────────────────────────────────────────────── */}
      <div className="p-4 border-b border-wacke-purple/20 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <img src="/spray_can.png" alt="Graffiti" className="h-5 w-5 object-contain drop-shadow-[0_0_6px_rgba(255,0,255,0.6)]" />
          <h2 className="text-lg font-bold graffiti-text neon-pink">GRAFFITI CHAT <span className="text-[9px] align-super text-wacke-cyan/70">× GROK xAI</span></h2>
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
            <span>{allMessages.length > 0 ? new Set(allMessages.map((m: any) => m.userId)).size : 0}</span>
          </div>
          {/* Kick connection indicator */}
          {kickUsername && (
            <div
              title={isKickConnected ? `Connected to ${kickUsername}'s Kick chat` : "Connecting to Kick chat..."}
              className={`flex items-center space-x-1 text-[9px] font-bold px-1.5 py-0.5 rounded ${
                isKickConnected
                  ? "bg-[#53fc18]/10 text-[#53fc18] border border-[#53fc18]/30"
                  : "bg-white/5 text-gray-500 border border-white/10"
              }`}
            >
              <span className={`w-1 h-1 rounded-full ${isKickConnected ? "bg-[#53fc18] animate-pulse" : "bg-gray-600"}`} />
              <span className="emoji kick-element">🟢 KICK</span>
            </div>
          )}
          {/* Twitch connection indicator */}
          {twitchUsername && (
            <div
              title={isTwitchConnected ? `Connected to ${twitchUsername}'s Twitch chat` : "Connecting to Twitch chat..."}
              className={`flex items-center space-x-1 text-[9px] font-bold px-1.5 py-0.5 rounded ${
                isTwitchConnected
                  ? "bg-[#9146FF]/10 text-[#9146FF] border border-[#9146FF]/30"
                  : "bg-white/5 text-gray-500 border border-white/10"
              }`}
            >
              <span className={`w-1 h-1 rounded-full ${isTwitchConnected ? "bg-[#9146FF] animate-pulse" : "bg-gray-600"}`} />
              <span>TWITCH</span>
            </div>
          )}
          {/* Mode Sacré toggle */}
          <button
            onClick={() => setSacreMode((prev) => !prev)}
            className={`text-[10px] px-2.5 py-1 rounded-full font-bold transition-all flex items-center space-x-1 ${
              sacreMode
                ? "bg-red-600/80 text-white shadow-[0_0_8px_rgba(255,0,0,0.3)]"
                : "bg-gray-700/50 text-gray-400"
            }`}
            title={sacreMode ? t("sacreActive") : t("sacreDisabled")}
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
        {allMessages.length === 0 && (
          <div className="text-center mt-12 space-y-3">
            <img src="/spray_can.png" alt="Spray" className="w-10 h-10 mx-auto opacity-30" />
            <p className="text-gray-600 text-xs font-medium">
              {t("chatEmpty")}
            </p>
          </div>
        )}
        {allMessages.map((msg: any) => (
          <div key={msg.id} className={`animate-spray-in group ${isGrokFuego ? 'fuego-msg' : ''}`}>
            <div className="flex items-baseline space-x-1.5">
              <span className="text-[10px] text-gray-700 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                {formatTime(msg.createdAt)}
              </span>
              {/* Kick source badge - love kicks! */}
              {msg._source === "kick" && (
                <span className="text-[8px] font-extrabold bg-[#53fc18]/15 text-[#53fc18] border border-[#53fc18]/30 px-1 py-0.5 rounded shrink-0 emoji">
                  🟢 KICK
                </span>
              )}
              {/* Twitch source badge */}
              {msg._source === "twitch" && (
                <span className="text-[8px] font-extrabold bg-[#9146FF]/15 text-[#9146FF] border border-[#9146FF]/30 px-1 py-0.5 rounded shrink-0 emoji">
                  🟣 TWITCH
                </span>
              )}
              {/* Wacké source badge */}
              {msg._source === "wacke" && (
                <span className="text-[8px] font-extrabold bg-wacke-pink/15 text-wacke-pink border border-wacke-pink/30 px-1 py-0.5 rounded shrink-0 emoji">
                  🏪 WACKÉ
                </span>
              )}
              <p className={`text-xs font-bold ${msg._source === "kick" ? "text-[#53fc18]" : msg._source === "twitch" ? "text-[#9146FF]" : getUserColor(msg.userId)} shrink-0`}>
                {/* Rich Kick-style badges (Broadcaster, Mod, VIP/OG, Verified, evolving Sub tiers) */}
                {(() => {
                  let badges: ChatBadge[] = [];
                  if (msg._source === "kick" && msg._kickSender) {
                    // Use real badges from Kick when present
                    const raw = (msg._kickSender as any).badges || [];
                    badges = parseKickBadges(raw);
                    if (badges.length === 0) {
                      if (msg._kickSender.isBroadcaster) badges.push({ type: "broadcaster" });
                      if (msg._kickSender.isModerator) badges.push({ type: "moderator" });
                      if (msg._kickSender.isSubscriber) badges.push({ type: "subscriber", tier: 1 });
                    }
                  } else if (msg._source === "twitch" && msg._twitchSender) {
                    if (msg._twitchSender.isBroadcaster) badges.push({ type: "broadcaster" });
                    if (msg._twitchSender.isModerator) badges.push({ type: "moderator" });
                    if (msg._twitchSender.isSubscriber) badges.push({ type: "subscriber", tier: 1 });
                  } else {
                    // Demo Wacké badges (variety + fun)
                    const isBC = (msg.user?.username || "").toLowerCase() === (kickUsername || twitchUsername || "").toLowerCase();
                    badges = getDemoBadgesForUser(msg.user?.username || msg.user?.displayName || "", isBC);
                  }
                  return badges.slice(0, 3).map((b, i) => (
                    <span key={i} title={getBadgeLabel(b)} className="mr-0.5 emoji align-middle text-[10px]">
                      {getBadgeEmoji(b)}
                    </span>
                  ));
                })()}
                {msg._source === "wacke" && <span className="mr-1 emoji">🏪</span>}
                {msg.user?.displayName ?? msg.user?.username ?? "Anonyme"}
                {msg.isSacre && (
                  <Flame className="w-3 h-3 inline ml-0.5 text-red-500 fill-current drop-shadow-[0_0_4px_rgba(255,0,0,0.6)]" />
                )}
                {msg.audioUrl && (
                  <Mic className="w-3 h-3 inline ml-0.5 text-wacke-cyan drop-shadow-[0_0_4px_rgba(0,255,255,0.6)]" />
                )}
                {isGrokFuego && <span className="ml-1">🔥</span>}
              </p>
              <p className="text-sm text-gray-300 break-words min-w-0 emoji">{renderContent(msg.content)}</p>
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
        <div className="px-2 py-1 border-t border-wacke-purple/10 animate-fade-in bg-wacke-darker/50">
          <EmojiPicker onSelect={handleEmojiSelect} />
        </div>
      )}

      {/* ── AI Spray Panel ───────────────────────────────────────────────── */}
      {showSprayPanel && (
        <div className="p-3 border-t border-wacke-purple/20 bg-wacke-purple/5 space-y-2 animate-scale-in">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-wacke-cyan flex items-center space-x-1">
              <Sparkles className="w-3.5 h-3.5" />
              <span>{t("stickerTitle")}</span>
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
              placeholder={t("stickerPlaceholder")}
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
              {isSendingSpray ? t("ttsGenerating") : t("stickerBtn")}
            </button>
          </div>
          {isSendingSpray && (
            <div className="flex items-center space-x-2 text-[9px] text-wacke-pink animate-pulse mt-1">
               <span className="w-1.5 h-1.5 bg-wacke-pink rounded-full animate-ping shrink-0" />
               <span>{t("aiDrawing")}</span>
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
              <span>{t("soundboardTitle")}</span>
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
              <span>{t("sacreTitle")}</span>
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
               <label className="text-[8px] font-extrabold text-gray-500 uppercase px-1">{t("prefixLabel")}</label>
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
               <label className="text-[8px] font-extrabold text-gray-500 uppercase px-1">{t("sacreLabel")}</label>
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
               <label className="text-[8px] font-extrabold text-gray-500 uppercase px-1">{t("suffixLabel")}</label>
              <select
                value={sacreSuffix}
                onChange={(e) => setSacreSuffix(e.target.value)}
                className="bg-wacke-dark border border-wacke-purple/25 rounded-lg px-2 py-1 text-[10px] text-white focus:outline-none"
              >
                {SACRE_SUFFIXES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>

          <div className="flex items-center justify-end pt-1 border-t border-wacke-purple/10">
            <button
              onClick={handleSacreSubmit}
              disabled={isSendingSacre}
              className="bg-gradient-to-r from-red-600 to-orange-500 text-[10px] font-extrabold px-3 py-1.5 rounded-lg text-white hover:scale-105 active:scale-95 transition-all shadow-md shadow-red-500/10 shrink-0"
            >
               {isSendingSacre ? t("shouting") : `${t("sacreBtn")} (10 🪙)`}
            </button>
            <button
              onClick={handleGrokSacre}
              disabled={isGrokSacre || isSendingSacre}
              className="ml-2 text-[9px] bg-wacke-cyan text-black px-2 py-1 rounded font-bold hover:bg-white transition disabled:opacity-50"
            >
              {isGrokSacre ? "GROK SACRE..." : "GROK GENERATE"}
            </button>
          </div>
        </div>
      )}

      {/* ── Groké Panel (GROK TOUCH - wild AI wit) ────────────────────────── */}
      {showGrokPanel && (
        <div className="p-3.5 border-t border-wacke-cyan/30 bg-wacke-cyan/5 space-y-2.5 animate-scale-in">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-wacke-cyan flex items-center space-x-1">
              <Bot className="w-3.5 h-3.5" />
              <span>GROKÉ — TALK TO GROK (AI voice)</span>
            </span>
            <button
              onClick={() => setShowGrokPanel(false)}
              className="text-gray-500 hover:text-white text-xs font-bold"
            >
              ✕
            </button>
          </div>
          <div className="text-[9px] text-gray-400">Type a question or prompt below — Grok will reply in chat AND speak it with real xAI voice!</div>
          <div className="flex space-x-2">
            <input
              type="text"
              value={grokPrompt}
              onChange={(e) => setGrokPrompt(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleGrokConsult();
                }
              }}
              placeholder="roast my setup / idée de contenu / sacre fun..."
              className="flex-1 bg-white/3 border border-wacke-cyan/20 rounded-xl px-3 py-1.5 text-xs focus:border-wacke-cyan transition-all placeholder:text-gray-600"
            />
            <button
              onClick={handleGrokConsult}
              className="bg-wacke-cyan text-black text-xs font-extrabold px-3 py-1.5 rounded-xl hover:bg-white active:scale-95 transition-all"
            >
              ASK
            </button>
          </div>
          <div className="text-[8px] text-wacke-cyan/70">Or type /grok your question directly in the main chat input below.</div>
          <button 
            onClick={triggerGrokTakeover}
            disabled={isGrokTakeover}
            className="mt-2 w-full text-[10px] bg-red-600/80 hover:bg-red-600 text-white py-1 rounded font-black tracking-widest disabled:opacity-50 border border-red-500"
          >
            {isGrokTakeover ? "GROK xAI IS BREAKING IT..." : "🚨 GROK xAI TAKEOVER – BREAK THE CHAT"}
          </button>
          <button
            onClick={() => {
              const next = !isGrokFuego;
              setIsGrokFuego(next);
              if (next) {
                document.body.classList.add('grok-fuego', 'grok-fire-mode');
              } else {
                document.body.classList.remove('grok-fuego', 'grok-fire-mode');
              }
            }}
            className={`mt-1 w-full text-[10px] py-1 rounded font-black tracking-widest border ${isGrokFuego ? 'bg-orange-600 text-white border-orange-500' : 'bg-black/50 text-orange-400 border-orange-500/50 hover:bg-orange-900/20'}`}
          >
            {isGrokFuego ? '🔥 EXTINGUISH FUEGO' : '🔥 GROK FUEGO MODE'}
          </button>
        </div>
      )}

      {isGrokTakeover && (
        <div className="absolute inset-0 bg-red-500/10 pointer-events-none animate-pulse z-10" />
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
            className={`px-2 py-2 rounded-lg text-xl emoji transition-all shrink-0 ${
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
            className={`px-2 py-2 rounded-lg text-xl emoji transition-all shrink-0 ${
              showSprayPanel ? "bg-wacke-purple/20 text-wacke-cyan" : "text-gray-500 hover:text-white hover:bg-white/5"
            }`}
             title={t("stickerTooltip")}
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
            className={`px-2 py-2 rounded-lg text-xl emoji transition-all shrink-0 ${
              showSoundboard ? "bg-wacke-purple/20 text-yellow-400" : "text-gray-500 hover:text-white hover:bg-white/5"
            }`}
            title={t("soundTooltip")}
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
            className={`px-2 py-2 rounded-lg text-xl emoji transition-all shrink-0 ${
              showSacres ? "bg-wacke-purple/20 text-red-400" : "text-gray-500 hover:text-white hover:bg-white/5"
            }`}
            title={t("sacreTooltip")}
            type="button"
          >
            🤬
          </button>
          {/* Grok / Groké wild AI button - Grok's touch! */}
          <button
            onClick={() => {
              setShowGrokPanel((prev) => !prev);
              setShowEmojis(false);
              setShowSprayPanel(false);
              setShowSoundboard(false);
              setShowSacres(false);
            }}
            className={`px-2 py-2 rounded-lg text-xl emoji transition-all shrink-0 ${
              showGrokPanel ? "bg-wacke-cyan/20 text-wacke-cyan" : "text-gray-500 hover:text-white hover:bg-white/5"
            }`}
            title="Talk to Groké — type a prompt and hear real Grok xAI voice!"
            type="button"
          >
            🤖
          </button>
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => {
              let val = e.target.value;
              // Live shortcode replace like Kick (keep shortcode for image customs so render shows the graphic)
              val = val.replace(/:(\w+):/g, (match, code) => {
                const lower = code.toLowerCase();
                if (EMOTE_IMAGES[lower]) return match; // keep :raccoon: so render turns it into image
                return EMOTE_MAP[lower] || match;
              });
              setInputValue(val);
            }}
            onKeyDown={handleKeyDown}
             placeholder={
               currentUserId ? t("chatPlaceholder") : t("loginToChat")
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
             aria-label={t("sendLabel")}
          >
            {isSending ? "..." : "➤"}
          </button>
        </div>

        {/* TTS Button Removed per user request */}
      </div>
    </aside>
  );
}
