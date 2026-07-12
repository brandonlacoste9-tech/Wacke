"use client";

import { useState, useEffect, useCallback } from "react";
import { getSupabaseClient } from "@/lib/supabase/client";

export interface HeatChamber {
  level: number;
  phase: "idle" | "overload" | "cooldown";
}

/**
 * useHeatChamber — Client hook that subscribes to real-time updates for a stream's HEAT meter.
 * Handles Postgres change feeds for real DB streams, and falls back to polling for simulated mock streams.
 */
export function useHeatChamber(streamId: string) {
  const [level, setLevel] = useState<number>(0);
  const [phase, setPhase] = useState<"idle" | "overload" | "cooldown">("idle");

  const isMockStream =
    streamId.startsWith("twitch-mock-chat-") ||
    streamId.startsWith("kick-mock-chat-");

  // Helper to fetch current state
  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch(`/api/heat?streamId=${encodeURIComponent(streamId)}`);
      if (res.ok) {
        const data = await res.json();
        if (data.chamber) {
          setLevel(data.chamber.level);
          setPhase(data.chamber.phase);
        }
      }
    } catch (err) {
      console.error("[useHeatChamber] Fetch status error:", err);
    }
  }, [streamId]);

  // Transition phase (e.g. cooldown -> idle or overload -> cooldown)
  const transitionPhase = useCallback(async (targetPhase: "idle" | "cooldown") => {
    try {
      const res = await fetch("/api/heat/charge", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "transition",
          streamId,
          phase: targetPhase,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.chamber) {
          setLevel(data.chamber.level);
          setPhase(data.chamber.phase);
        }
      }
    } catch (err) {
      console.error("[useHeatChamber] Transition phase error:", err);
    }
  }, [streamId]);

  useEffect(() => {
    if (!streamId) return;

    // 1. Initial Load
    fetchStatus();

    // 2. Realtime/Polling sync
    if (isMockStream) {
      // For mock streams, poll every 2.5 seconds since WebSocket WAL triggers don't run
      const interval = setInterval(fetchStatus, 2500);
      return () => clearInterval(interval);
    } else {
      // For real streams, use Supabase Realtime Postgres replication listener
      const supabase = getSupabaseClient();
      
      const channel = supabase
        .channel(`heat_chamber_changes:${streamId}`)
        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "heat_chambers",
            filter: `stream_id=eq.${streamId}`,
          },
          (payload: { new: { level: number; phase: "idle" | "overload" | "cooldown" } }) => {
            const newChamber = payload.new;
            if (newChamber) {
              setLevel(newChamber.level);
              setPhase(newChamber.phase);
            }
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [streamId, isMockStream, fetchStatus]);

  return {
    level,
    phase,
    transitionPhase,
    refresh: fetchStatus,
  };
}
