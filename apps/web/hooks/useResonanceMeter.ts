"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { getSupabaseClient } from "@/lib/supabase/client";

export type ResonancePhase = "calm" | "rising" | "critical" | "overload";

export function useResonanceMeter(slug: string, onPulse?: (payload: { x: number; y: number; kind: string }) => void) {
  const [value, setValue] = useState<number>(0);
  const [phase, setPhase] = useState<ResonancePhase>("calm");
  const [overloadActive, setOverloadActive] = useState(false);
  const [isConnected, setIsConnected] = useState(false);

  const overloadTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isMock = slug.startsWith("twitch-mock-chat-") || slug.startsWith("kick-mock-chat-");

  // derived intensity 0..1 for CSS vars
  const intensity = Math.min(value / 100, 1);

  // Helper to fetch current state and apply lazy-decay
  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch(`/api/resonance?slug=${encodeURIComponent(slug)}`);
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.chamber) {
          setValue(parseFloat(data.chamber.meterValue) || 0);
          setPhase(data.chamber.phase as ResonancePhase);
        }
      }
    } catch (err) {
      console.error("[useResonanceMeter] Fetch status error:", err);
    }
  }, [slug]);

  // Request database phase transition back to calm
  const requestTransition = useCallback(async (targetPhase: "calm" | "rising" | "critical" | "overload") => {
    try {
      const res = await fetch("/api/resonance/transition", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, phase: targetPhase }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.chamber) {
          setValue(parseFloat(data.chamber.meterValue) || 0);
          setPhase(data.chamber.phase as ResonancePhase);
        }
      }
    } catch (err) {
      console.error("[useResonanceMeter] Transition phase error:", err);
    }
  }, [slug]);

  const triggerOverload = useCallback(() => {
    if (overloadActive) return; // guard re-entry
    setOverloadActive(true);

    // 1. slam CSS vars for max chaos
    const root = document.documentElement;
    root.style.setProperty("--neon", "#FFFFFF");
    root.style.setProperty("--shake", "8px");
    root.classList.add("overload-mode");

    // 2. haptics on supported devices
    if (typeof navigator !== "undefined" && navigator.vibrate) {
      navigator.vibrate([120, 40, 200]);
    }

    // 3. lock the climax for a fixed 12s, then release
    overloadTimer.current = setTimeout(() => {
      root.classList.remove("overload-mode");
      root.style.setProperty("--shake", "0px");
      setOverloadActive(false);
      // Transition back to calm after overload completes
      requestTransition("calm");
    }, 12000);
  }, [overloadActive, requestTransition]);

  // Sync state changes with CSS custom properties
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty("--intensity", String(intensity));
    
    if (phase === "overload") {
      triggerOverload();
    } else if (phase === "critical") {
      root.style.setProperty("--neon", "#FF1E8C");
      root.style.setProperty("--shake", "3px");
      root.classList.remove("overload-mode");
    } else if (phase === "rising") {
      root.style.setProperty("--neon", "#B14BFF");
      root.style.setProperty("--shake", "1.5px");
      root.classList.remove("overload-mode");
    } else {
      root.style.setProperty("--neon", "#00E5FF");
      root.style.setProperty("--shake", "0px");
      root.classList.remove("overload-mode");
    }
  }, [intensity, phase, triggerOverload]);

  // Bootstrap & subscribe
  useEffect(() => {
    if (!slug) return;

    // 1. Initial Load
    fetchStatus();

    // 2. Realtime replication / Polling fallback
    if (isMock) {
      // Mock streams poll to emulate PostgreSQL changes replication WAL feeds
      const interval = setInterval(fetchStatus, 2000);
      return () => {
        clearInterval(interval);
        if (overloadTimer.current) clearTimeout(overloadTimer.current);
      };
    } else {
      const supabase = getSupabaseClient();
      const channelName = `chamber:${slug}`;

      const channel = supabase
        .channel(channelName)
        // Listen for PostgreSQL writes to resonance_chambers
        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "resonance_chambers",
            filter: `slug=eq.${slug}`,
          },
          (payload: any) => {
            const row = payload.new as { meter_value: string; phase: string };
            if (row) {
              setValue(parseFloat(row.meter_value) || 0);
              setPhase(row.phase as ResonancePhase);
            }
          }
        )
        // Listen for transient click pulses to trigger visual FX wiggles
        .on("broadcast", { event: "pulse" }, ({ payload }: { payload: any }) => {
          if (onPulse && payload) {
            onPulse(payload as { x: number; y: number; kind: string });
          }
        })
        .subscribe((status: string) => {
          setIsConnected(status === "SUBSCRIBED");
        });

      return () => {
        supabase.removeChannel(channel);
        if (overloadTimer.current) clearTimeout(overloadTimer.current);
      };
    }
  }, [slug, isMock, fetchStatus, onPulse]);

  // Client-side optimistic pulse emitter
  const sendPulse = useCallback(async (x: number, y: number, kind: string = "pulse") => {
    // 1. Optimistic visual emission via Broadcast (realtime)
    if (!isMock) {
      const supabase = getSupabaseClient();
      supabase.channel(`chamber:${slug}`).send({
        type: "broadcast",
        event: "pulse",
        payload: { x, y, kind },
      });
    }

    // Call onPulse locally so the initiating client sees it instantly too
    if (onPulse) {
      onPulse({ x, y, kind });
    }

    // 2. Authoritative event log write
    try {
      await fetch("/api/resonance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug,
          kind,
          intensity: kind === "surge" ? 5.0 : 1.5,
          metadata: { x, y },
        }),
      });
    } catch (err) {
      console.error("[useResonanceMeter] Pulse write failed:", err);
    }
  }, [slug, isMock, onPulse]);

  return {
    value,
    phase,
    intensity,
    overloadActive,
    isConnected,
    sendPulse,
    refresh: fetchStatus,
  };
}
