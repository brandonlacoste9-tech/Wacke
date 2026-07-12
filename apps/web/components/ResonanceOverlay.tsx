"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useResonanceMeter, ResonancePhase } from "@/hooks/useResonanceMeter";

interface ResonanceOverlayProps {
  slug: string;
  streamerName: string;
  variant?: "obs" | "compact";
}

interface Particle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  life: number;
  maxLife: number;
}

export default function ResonanceOverlay({ slug, streamerName, variant = "obs" }: ResonanceOverlayProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const particlesRef = useRef<Particle[]>([]);
  const nextParticleId = useRef<number>(0);
  
  const [aiCaption, setAiCaption] = useState<string>("");
  const [loadingCaption, setLoadingCaption] = useState<boolean>(false);
  const [heartbeatVolume, setHeartbeatVolume] = useState<number>(0); // 0 = muted, >0 = vol
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const prevPhaseRef = useRef<ResonancePhase>("calm");
  const heartTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Triggered when any client broadcasts an ephemeral 'pulse' event
  const spawnParticles = useCallback((payload: { x: number; y: number; kind: string }) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    // Default to center if coordinates are out of bounds or not provided
    const originX = payload.x !== undefined ? (payload.x / 100) * rect.width : rect.width / 2;
    const originY = payload.y !== undefined ? (payload.y / 100) * rect.height : rect.height * 0.8;

    const isSurge = payload.kind === "surge";
    const count = isSurge ? 35 : 12;
    const neonColors = ["#00E5FF", "#B14BFF", "#FF1E8C", "#FFFFFF"];

    const newParticles: Particle[] = [];
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * (isSurge ? 5 : 2.5) + 1;
      const maxLife = Math.random() * 40 + 20;

      newParticles.push({
        id: nextParticleId.current++,
        x: originX,
        y: originY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - (Math.random() * 1.5 + 0.5), // drift upward
        color: neonColors[Math.floor(Math.random() * neonColors.length)],
        size: Math.random() * 3 + 1.5,
        life: maxLife,
        maxLife,
      });
    }

    particlesRef.current = [...particlesRef.current, ...newParticles];
  }, []);

  const { value, phase, intensity, overloadActive, sendPulse } = useResonanceMeter(slug, spawnParticles);

  // Retro Web Audio Warning Siren and dynamic Heartbeat tick
  const playWarningAlarm = () => {
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = audioContextRef.current;
      if (ctx.state === "suspended") ctx.resume();

      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();

      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(100, ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(350, ctx.currentTime + 0.4);
      osc.frequency.linearRampToValueAtTime(80, ctx.currentTime + 0.8);

      gainNode.gain.setValueAtTime(0.12, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 1.6);

      osc.connect(gainNode);
      gainNode.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 1.8);
    } catch (e) {
      console.warn("[ResonanceOverlay] Alarm play failed:", e);
    }
  };

  const playHeartbeat = useCallback(() => {
    if (heartbeatVolume <= 0) return;
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = audioContextRef.current;
      if (ctx.state === "suspended") ctx.resume();

      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();

      osc.type = "sine";
      // Frequency goes down to make a deep thud
      osc.frequency.setValueAtTime(65, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(25, ctx.currentTime + 0.12);

      gainNode.gain.setValueAtTime(heartbeatVolume * 0.4, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);

      osc.connect(gainNode);
      gainNode.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.2);
    } catch {}
  }, [heartbeatVolume]);

  // Handle Heartbeat Interval Timer (BPM speeds up with intensity!)
  useEffect(() => {
    if (heartTimerRef.current) clearInterval(heartTimerRef.current);

    if (value > 5) {
      const minBpm = 60;
      const maxBpm = 160;
      const bpm = minBpm + (intensity * (maxBpm - minBpm));
      const intervalMs = (60 / bpm) * 1000;

      heartTimerRef.current = setInterval(() => {
        playHeartbeat();
      }, intervalMs);
    }

    return () => {
      if (heartTimerRef.current) clearInterval(heartTimerRef.current);
    };
  }, [value, intensity, playHeartbeat]);

  // Fetch AI Roast Caption when Overload phase detonates
  useEffect(() => {
    const fetchRoast = async () => {
      setLoadingCaption(true);
      setAiCaption("");
      try {
        const res = await fetch("/api/ai", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            prompt: `Write a short, unhinged, 1-sentence raw roast caption about the streamer "${streamerName}" because their stream chat just hit critical 100% Resonance. Keep it gritty, unfiltered, and street-style (dark alley of streaming). Do not be cheesy or use emojis. Max 14 words.`,
            maxTokens: 100,
          }),
        });

        if (res.ok) {
          const data = await res.json();
          if (data.content) {
            setAiCaption(data.content);
          }
        }
      } catch (err) {
        console.error("[ResonanceOverlay] Failed to fetch overload roast:", err);
      } finally {
        setLoadingCaption(false);
      }
    };

    if (phase === "overload" && prevPhaseRef.current !== "overload") {
      playWarningAlarm();
      fetchRoast();
    }

    prevPhaseRef.current = phase;
  }, [phase, streamerName]);

  // Canvas Particle Animation Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;

    const resizeCanvas = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;
    };
    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Update and draw particles
      const particles = particlesRef.current;
      const activeParticles: Particle[] = [];

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.life--;

        if (p.life > 0) {
          const alpha = p.life / p.maxLife;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fillStyle = p.color;
          ctx.shadowBlur = 8;
          ctx.shadowColor = p.color;
          ctx.globalAlpha = alpha;
          ctx.fill();
          activeParticles.push(p);
        }
      }

      ctx.globalAlpha = 1.0;
      ctx.shadowBlur = 0;
      particlesRef.current = activeParticles;
      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resizeCanvas);
    };
  }, []);

  const handleContainerClick = (e: React.MouseEvent<HTMLDivElement>) => {
    // If user clicks interactive element, emit optimistic broadcast pulse
    const rect = e.currentTarget.getBoundingClientRect();
    const percentX = ((e.clientX - rect.left) / rect.width) * 100;
    const percentY = ((e.clientY - rect.top) / rect.height) * 100;
    
    // Trigger pulse
    sendPulse(percentX, percentY, "pulse");
  };

  const getPhaseColor = () => {
    switch (phase) {
      case "overload": return "#FFFFFF";
      case "critical": return "#FF1E8C";
      case "rising": return "#B14BFF";
      default: return "#00E5FF";
    }
  };

  const neonColor = getPhaseColor();

  // ─── Compact Side-Rail View ───
  if (variant === "compact") {
    return (
      <div 
        onClick={handleContainerClick}
        className={`w-full bg-[#05060A]/95 border border-white/[0.08] p-3.5 font-mono text-[10px] uppercase tracking-wider text-gray-300 relative overflow-hidden transition-all duration-300 cursor-pointer select-none pointer-events-auto shadow-lg
                   ${phase === "overload" ? "border-white bg-red-950/20 shadow-[0_0_20px_rgba(255,255,255,0.25)] animate-screen-shake" : 
                     phase === "critical" ? "border-[#FF1E8C]/40 bg-pink-950/10 shadow-[0_0_10px_rgba(255,30,140,0.15)]" : ""}`}
      >
        <div className="flex justify-between items-center mb-1.5">
          <span className="font-bold flex items-center gap-1.5">
            <span className={`h-1.5 w-1.5 rounded-full`} style={{ backgroundColor: neonColor }} />
            {phase === "overload" ? "RESONANCE OVERLOAD" : phase === "critical" ? "CRITICAL RESONANCE" : "RESONANCE CHAMBER"}
          </span>
          <span className="font-extrabold text-[11px]" style={{ color: neonColor }}>
            {value.toFixed(1)}%
          </span>
        </div>
        <div className="h-2 w-full bg-white/[0.05] overflow-hidden relative rounded-sm">
          <div 
            className="h-full transition-all duration-300 relative"
            style={{ width: `${value}%`, backgroundColor: neonColor }}
          >
            {phase === "overload" && (
              <div className="absolute inset-0 bg-white animate-pulse" />
            )}
          </div>
        </div>
        <div className="text-[7.5px] text-gray-500 mt-1.5 flex justify-between">
          <span>Click to send pulse (+1.5%)</span>
          <span>Decay: -{parseFloat(intensity > 0 ? "2.00" : "0").toFixed(1)}/s</span>
        </div>
      </div>
    );
  }

  // ─── Full-Screen OBS Overlay View ───
  return (
    <div className={`pointer-events-none fixed inset-0 z-50 flex justify-between p-8 transition-all duration-300 ${phase === "overload" ? "bg-red-950/15" : ""}`}>
      {/* Absolute canvas for rendering interactive pulse particles */}
      <canvas ref={canvasRef} className="absolute inset-0 z-30 pointer-events-none" />

      {/* ─── Overload Full-Screen Assault Overlay ─── */}
      {overloadActive && (
        <div className="absolute inset-0 z-10 animate-screen-shake overflow-hidden overload-veil">
          <div className="chromatic-flash" />
          <div className="scanline-burst" />
          
          <div className="absolute inset-0 bg-[#05060A]/85 z-20 flex flex-col items-center justify-center">
            <div className="max-w-2xl bg-black border-2 border-white p-8 text-center shadow-[0_0_40px_rgba(255,255,255,0.4)] animate-caption-slam">
              <div className="font-mono text-xs uppercase tracking-[0.4em] text-red-500 mb-3 animate-pulse">
                🚨 RESONANCE OVERLOAD DETONATION 🚨
              </div>
              {loadingCaption ? (
                <div className="font-mono text-sm text-gray-400 animate-pulse">
                  CONSTRUCTING AI OVERLOAD ROAST...
                </div>
              ) : (
                <p className="font-display text-2xl font-black uppercase italic tracking-tight text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)] leading-normal">
                  "{aiCaption || "THE CHAOS LEVEL HAS EXCEEDED SYSTEM CAPACITY."}"
                </p>
              )}
              <div className="mt-4 font-mono text-[9px] uppercase tracking-widest text-cyan-400 font-bold">
                RESONANCE ACHIEVED
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── Left Space: Heartbeat Mute Knob ─── */}
      <div className="flex flex-col justify-end z-40 pointer-events-auto">
        <button
          onClick={() => setHeartbeatVolume(prev => prev > 0 ? 0 : 0.25)}
          className={`flex items-center gap-1.5 bg-black/85 border border-white/[0.08] px-3 py-1.5 font-mono text-[9px] uppercase tracking-wider text-gray-400 hover:text-white rounded-lg shadow-md transition-colors`}
        >
          <span>💓 Mute Heartbeat:</span>
          <span className={heartbeatVolume > 0 ? "text-green-400" : "text-red-500"}>
            {heartbeatVolume > 0 ? "ON" : "OFF"}
          </span>
        </button>
      </div>

      {/* ─── Right: Vertical Resonance Column HUD ─── */}
      <div 
        onClick={handleContainerClick}
        className="relative flex flex-col items-center justify-end h-[60vh] w-28 bg-[#05060A]/95 border border-white/[0.08] p-3 text-center shadow-2xl rounded-sm z-40 pointer-events-auto cursor-pointer select-none"
        style={{
          boxShadow: phase === "overload" ? "0 0 35px rgba(255,255,255,0.3)" : 
                     phase === "critical" ? "0 0 25px rgba(255,30,140,0.2)" : 
                     phase === "rising" ? "0 0 15px rgba(177,75,255,0.15)" : "none"
        }}
      >
        {/* SVG Glitched Progress Column */}
        <div className="h-full w-full relative flex items-end justify-center overflow-hidden mb-3">
          <svg className="absolute inset-0 w-full h-full" viewBox="0 0 80 320" preserveAspectRatio="none">
            <defs>
              <linearGradient id="columnFillGrad" x1="0" y1="1" x2="0" y2="0">
                <stop offset="0%" stopColor="#00E5FF" />
                <stop offset="50%" stopColor="#B14BFF" />
                <stop offset="85%" stopColor="#FF1E8C" />
                <stop offset="100%" stopColor="#FFFFFF" />
              </linearGradient>
              
              <filter id="svgGlitchFilter">
                <feTurbulence 
                  type="fractalNoise" 
                  baseFrequency="0.02 0.15" 
                  numOctaves="2" 
                  result="noise"
                >
                  <animate 
                    attributeName="baseFrequency" 
                    dur="0.5s" 
                    values="0.02 0.15; 0.06 0.45; 0.02 0.15" 
                    repeatCount="indefinite" 
                  />
                </feTurbulence>
                <feDisplacementMap 
                  in="SourceGraphic" 
                  in2="noise" 
                  scale={phase === "overload" ? 15 : phase === "critical" ? 8 : phase === "rising" ? 3 : 0} 
                />
              </filter>
            </defs>

            {/* Cylinder Tube Background */}
            <rect x="10" y="5" width="60" height="310" rx="6" fill="#010204" stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
            
            {/* Cylinder Liquid Column Fill */}
            {value > 0 && (
              <rect 
                x="12" 
                y={5 + (310 * (100 - value)) / 100} 
                width="56" 
                height={(310 * value) / 100} 
                rx="4"
                fill="url(#columnFillGrad)" 
                filter="url(#svgGlitchFilter)"
                className="column-fill"
                style={{
                  opacity: 0.9,
                  filter: `url(#svgGlitchFilter)`
                }}
              />
            )}

            {/* Scale lines */}
            {[25, 50, 75].map((tick) => (
              <line 
                key={tick} 
                x1="8" 
                y1={5 + (310 * (100 - tick)) / 100} 
                x2="72" 
                y2={5 + (310 * (100 - tick)) / 100} 
                stroke="rgba(255,255,255,0.08)" 
                strokeWidth="1" 
                strokeDasharray="2, 4"
              />
            ))}
          </svg>
        </div>

        {/* Readout stats */}
        <div className="font-mono flex flex-col items-center">
          <div 
            className={`text-xl font-black italic tracking-tighter tabular-nums ${phase === "critical" || phase === "overload" ? "animate-pulse" : ""}`}
            style={{ 
              color: neonColor,
              textShadow: phase === "overload" ? "0 0 10px #FFFFFF, 0 0 20px #FFFFFF" : 
                          phase === "critical" ? "0 0 8px #FF1E8C" : "none"
            }}
          >
            {value.toFixed(1)}%
          </div>
          <div className="text-[7.5px] text-gray-500 font-semibold tracking-widest uppercase mt-0.5">
            RESONANCE
          </div>
        </div>

        {/* Inject CSS Animations dynamically */}
        <style dangerouslySetInnerHTML={{ __html: `
          .column-fill {
            box-shadow: 0 0 15px var(--neon);
            animation: breathe calc(2.2s - var(--intensity) * 1.6s) ease-in-out infinite;
          }

          @keyframes breathe {
            0%, 100% { filter: brightness(1) drop-shadow(0 0 2px var(--neon)); }
            50% { filter: brightness(1.5) drop-shadow(0 0 10px var(--neon)); }
          }
        ` }} />
      </div>

      {/* Global CSS Inject for full screen Overload shake and Chromatic burst */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes screen-shake {
          0%, 100% { transform: translate(0, 0) rotate(0deg); }
          10% { transform: translate(-3px, -2px) rotate(-0.5deg); }
          20% { transform: translate(-4px, 0px) rotate(0.5deg); }
          30% { transform: translate(0px, 3px) rotate(0deg); }
          40% { transform: translate(2px, -2px) rotate(0.5deg); }
          50% { transform: translate(-2px, 3px) rotate(-0.5deg); }
          60% { transform: translate(-4px, 2px) rotate(0deg); }
          75% { transform: translate(3px, 2px) rotate(-0.5deg); }
          90% { transform: translate(2px, 3px) rotate(0deg); }
        }

        .overload-mode {
          animation: screen-shake 0.07s linear infinite !important;
        }

        .overload-veil {
          position: fixed; inset: 0; z-index: 9999; pointer-events: none;
          mix-blend-mode: screen;
          animation: veil-pulse 0.2s steps(2) infinite;
        }

        .chromatic-flash {
          position: absolute; inset: 0;
          background: radial-gradient(circle at 50% 50%, rgba(255, 45, 45, 0.45), transparent 70%);
          animation: strobe 0.1s steps(2) infinite;
        }

        .scanline-burst {
          position: absolute; inset: 0;
          background: linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.3) 50%);
          background-size: 100% 4px;
        }

        @keyframes strobe { 0% { opacity: 0.15; } 100% { opacity: 0.85; } }
        @keyframes veil-pulse { 0% { filter: hue-rotate(0); } 100% { filter: hue-rotate(30deg); } }

        @keyframes caption-slam {
          0% { transform: scale(1.5) rotate(-4deg); opacity: 0; filter: blur(5px); }
          12% { transform: scale(1) rotate(0deg); opacity: 1; filter: blur(0px); }
          13% { transform: translate(3px, -1px); }
          15% { transform: translate(-2px, 2px); }
          17% { transform: translate(0, 0); }
        }

        .animate-caption-slam {
          animation: caption-slam 12s forwards;
        }

        @media (prefers-reduced-motion: reduce) {
          .overload-mode { animation: none !important; }
          .overload-veil { animation: none; }
          .chromatic-flash, .scanline-burst { display: none; }
        }
      ` }} />
    </div>
  );
}
