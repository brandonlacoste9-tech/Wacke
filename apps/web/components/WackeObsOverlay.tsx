"use client";

import { useEffect, useState, useRef } from "react";
import { getSupabaseClient } from "@/lib/supabase/client";
import { playSyntheticSound } from "@/lib/audio";
import { Volume2, Sparkles, Flame, Mic, Coins } from "lucide-react";
import ResonanceOverlay from "@/components/ResonanceOverlay";

interface ChatMessage {
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

interface AlertItem {
  id: string;
  type: "tts" | "sacre" | "sound" | "spray" | "boom";
  displayName: string;
  avatarUrl: string | null;
  content: string;
  audioUrl?: string | null;
  soundType?: string;
  imageUrl?: string | null;
  cost?: number;
}

interface WackeObsOverlayProps {
  streamId: string;
  streamerName: string;
}

export default function WackeObsOverlay({ streamId, streamerName }: WackeObsOverlayProps) {
  const [currentAlert, setCurrentAlert] = useState<AlertItem | null>(null);
  const [coins, setCoins] = useState<Array<{ id: number; left: number; delay: number }>>([]);
  const [isAlertVisible, setIsAlertVisible] = useState(false);

  const queueRef = useRef<AlertItem[]>([]);
  const isPlayingRef = useRef<boolean>(false);
  const coinIdCounter = useRef<number>(0);
  const supabase = getSupabaseClient();

  // ─── Trigger Bouncing Coins Effect ─────────────────────────────────────────
  const triggerCoinShower = (count: number = 15) => {
    const newCoins = Array.from({ length: count }).map(() => ({
      id: coinIdCounter.current++,
      left: Math.random() * 80 + 10, // 10% - 90%
      delay: Math.random() * 0.8,
    }));
    setCoins((prev) => [...prev, ...newCoins]);

    // Cleanup coins after animation
    setTimeout(() => {
      setCoins((prev) => prev.slice(newCoins.length));
    }, 3000);
  };

  // ─── Play Alert Queue Sequentially ─────────────────────────────────────────
  const processQueue = async () => {
    if (isPlayingRef.current || queueRef.current.length === 0) return;
    isPlayingRef.current = true;

    const nextAlert = queueRef.current.shift()!;
    setCurrentAlert(nextAlert);
    setIsAlertVisible(true);

    // Trigger visual coins shower depending on cost or action
    if (nextAlert.cost && nextAlert.cost > 0) {
      triggerCoinShower(Math.min(nextAlert.cost / 4, 30));
    } else if (nextAlert.type === "boom") {
      triggerCoinShower(10);
    }

    // Determine display duration
    let duration = 6000; // default 6s

    // Play corresponding audio
    if (nextAlert.audioUrl) {
      try {
        const audio = new Audio(nextAlert.audioUrl);
        
        // Wait for audio meta to adjust duration
        await new Promise<void>((resolve) => {
          audio.onloadedmetadata = () => {
            duration = Math.max((audio.duration * 1000) + 1500, 5000);
            resolve();
          };
          audio.onerror = () => resolve();
          // Timeout fallback
          setTimeout(resolve, 1000);
        });

        await audio.play();

        // Wait until audio finished
        await new Promise<void>((resolve) => {
          audio.onended = () => resolve();
          setTimeout(resolve, duration - 1000);
        });
      } catch (e) {
        console.error("Audio playback error:", e);
      }
    } else if (nextAlert.type === "sound" && nextAlert.soundType) {
      // Soundboard chime
      playSyntheticSound(nextAlert.soundType);
      duration = 4000;
    } else if (nextAlert.type === "spray") {
      // Spray can sound
      playSyntheticSound("laser"); // Fallback retro chime
      duration = 6500;
    }

    // Hold display for remaining time
    await new Promise((resolve) => setTimeout(resolve, Math.max(duration - 2000, 1000)));

    // Transition out
    setIsAlertVisible(false);
    await new Promise((resolve) => setTimeout(resolve, 800)); // Outward transition delay

    setCurrentAlert(null);
    isPlayingRef.current = false;
    processQueue();
  };

  const queueAlert = (alert: AlertItem) => {
    queueRef.current.push(alert);
    processQueue();
  };

  // ─── Subscribe to Supabase Realtime ────────────────────────────────────────
  useEffect(() => {
    if (!streamId) return;

    console.log(`[OBS Overlay] Subscribing to streamId: ${streamId}`);

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
          // If we receive normal DB insert, wait if broadcast handled it
          // Broadcast is preferred for fully hydrated user objects.
        }
      )
      .on("broadcast", { event: "chat_message" }, ({ payload }: { payload: any }) => {
        const msg = payload as ChatMessage;
        if (!msg.user) return;

        // Parse custom interaction types
        if (msg.content.startsWith("[spray]:")) {
          // AI Sticker
          const imageUrl = msg.content.substring(8);
          queueAlert({
            id: msg.id,
            type: "spray",
            displayName: msg.user.displayName,
            avatarUrl: msg.user.avatarUrl,
            content: "a sprayé un Sticker AI !",
            imageUrl,
            cost: 100,
          });
        } else if (msg.content.startsWith("[sound]:")) {
          // Soundboard chime
          const soundType = msg.content.substring(8);
          const soundLabels: Record<string, string> = {
            bell: "🔔 Cling-Cling",
            coin: "🪙 Coin-Coin",
            alarm: "🚨 Alerte!",
            laser: "⚡ Laser",
          };
          const costMap: Record<string, number> = { bell: 20, coin: 30, alarm: 40, laser: 50 };

          queueAlert({
            id: msg.id,
            type: "sound",
            displayName: msg.user.displayName,
            avatarUrl: msg.user.avatarUrl,
            content: `a déclenché le son: ${soundLabels[soundType] || soundType}`,
            soundType,
            cost: costMap[soundType] || 20,
          });
        } else if (msg.audioUrl) {
          // TTS or Swear with TTS
          queueAlert({
            id: msg.id,
            type: msg.isSacre ? "sacre" : "tts",
            displayName: msg.user.displayName,
            avatarUrl: msg.user.avatarUrl,
            content: msg.content,
            audioUrl: msg.audioUrl,
            cost: msg.isSacre ? 60 : 50,
          });
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [streamId, supabase]);

  return (
    <div className="w-screen h-screen relative bg-transparent overflow-hidden select-none pointer-events-none">
      <div className="absolute top-2 right-3 text-[9px] font-mono tracking-[2px] text-white/30 z-[60] pointer-events-none">AI xAI POWERED</div>

      {/* Resonance Column overlay */}
      <ResonanceOverlay
        slug={streamId}
        streamerName={streamerName}
        variant="obs"
      />

      {/* ─── Animated Custom Bouncing Coins ─────────────────────────────────── */}
      <div className="absolute inset-0 z-50 pointer-events-none">
        <style>{`
          @keyframes coinBounceFall {
            0% {
              transform: translateY(-80px) rotate(0deg);
              opacity: 0;
            }
            10% {
              opacity: 1;
            }
            80% {
              transform: translateY(92vh) rotate(540deg);
              opacity: 1;
            }
            90% {
              transform: translateY(88vh) rotate(580deg);
              opacity: 0.9;
            }
            100% {
              transform: translateY(95vh) rotate(640deg);
              opacity: 0;
            }
          }
          .animate-coin-bounce {
            animation: coinBounceFall 2.2s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
          }
        `}</style>
        {coins.map((coin) => (
          <div
            key={coin.id}
            className="absolute text-yellow-400 font-bold animate-coin-bounce text-2xl drop-shadow-[0_0_8px_rgba(234,179,8,0.6)]"
            style={{
              left: `${coin.left}%`,
              top: `-40px`,
              animationDelay: `${coin.delay}s`,
            }}
          >
            🪙
          </div>
        ))}
      </div>

      {/* ─── Notification Alert Container ─────────────────────────────────── */}
      <div className="absolute top-10 right-10 w-96 z-40">
        {currentAlert && (
          <div
            className={`w-full glass-dark border border-wacke-purple/30 rounded-2xl p-5 shadow-[0_0_35px_rgba(255,0,255,0.2)] transition-all duration-700 transform backdrop-blur-md
                       ${isAlertVisible ? "translate-x-0 opacity-100 scale-100" : "translate-x-12 opacity-0 scale-95"}`}
          >
            {/* Custom Glowing Header line */}
            <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r rounded-t-2xl
                            ${currentAlert.type === "spray" ? "from-wacke-cyan to-wacke-pink" : 
                              currentAlert.type === "sound" ? "from-yellow-400 to-orange-500" :
                              currentAlert.type === "sacre" ? "from-red-600 to-orange-500" :
                              "from-wacke-pink to-wacke-purple"}`} 
            />

            <div className="flex items-center space-x-3.5">
              {/* User Avatar */}
              {currentAlert.avatarUrl ? (
                <img
                  src={currentAlert.avatarUrl}
                  alt={currentAlert.displayName}
                  className="w-12 h-12 rounded-xl object-cover border-2 border-white/10 shrink-0"
                />
              ) : (
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-wacke-pink to-wacke-purple flex items-center justify-center text-sm font-black text-white shrink-0 border border-white/10 shadow-lg">
                  {currentAlert.displayName.substring(0, 2).toUpperCase()}
                </div>
              )}

              <div className="min-w-0 flex-1">
                <div className="flex items-center space-x-1.5">
                  <p className="text-sm font-black text-white truncate drop-shadow-md">
                    {currentAlert.displayName}
                  </p>
                  
                  {/* Action Icon Badge */}
                  <span className={`p-1 rounded-lg shrink-0
                                  ${currentAlert.type === "spray" ? "bg-wacke-pink/10 text-wacke-pink" :
                                    currentAlert.type === "sound" ? "bg-yellow-500/10 text-yellow-400" :
                                    currentAlert.type === "sacre" ? "bg-red-500/10 text-red-500 animate-pulse" :
                                    "bg-wacke-cyan/10 text-wacke-cyan"}`}
                  >
                    {currentAlert.type === "spray" && <Sparkles className="w-3.5 h-3.5" />}
                    {currentAlert.type === "sound" && <Volume2 className="w-3.5 h-3.5" />}
                    {currentAlert.type === "sacre" && <Flame className="w-3.5 h-3.5 fill-current" />}
                    {currentAlert.type === "tts" && <Mic className="w-3.5 h-3.5" />}
                  </span>
                </div>
                
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-0.5">
                  {currentAlert.type === "spray" ? "Spray Sticker AI" :
                   currentAlert.type === "sound" ? "Soundboard Interactive" :
                   currentAlert.type === "sacre" ? "Mode Sacré TTS" :
                   "Message Vocal TTS"}
                </p>
              </div>

              {/* Tokens cost display */}
              {currentAlert.cost && (
                <div className="flex items-center space-x-1 bg-yellow-500/10 border border-yellow-500/20 px-2.5 py-1 rounded-xl text-yellow-400 font-extrabold text-xs shrink-0 shadow-md animate-pulse">
                  <span>{currentAlert.cost}</span>
                  <Coins className="w-3 h-3" />
                </div>
              )}
            </div>

            {/* Sticker Image content if spray */}
            {currentAlert.type === "spray" && currentAlert.imageUrl && (
              <div className="mt-4 flex justify-center bg-black/40 rounded-xl p-3 border border-white/5 animate-scale-in">
                <img
                  src={currentAlert.imageUrl}
                  alt="Spray Sticker Alert"
                  className="max-h-40 w-auto rounded-lg object-contain drop-shadow-[0_0_12px_rgba(255,20,147,0.6)]"
                />
              </div>
            )}

            {/* Content text for TTS/Swear */}
            {(currentAlert.type === "tts" || currentAlert.type === "sacre") && (
              <p className="mt-4 text-xs font-medium text-gray-200 bg-white/3 border border-white/5 rounded-xl px-3.5 py-2.5 leading-relaxed drop-shadow-md">
                "{currentAlert.content}"
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
