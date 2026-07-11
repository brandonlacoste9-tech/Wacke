"use client";

import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/components/AuthProvider";

const MIN_WATCH_MS = 10 * 60 * 1000;

/**
 * Tracks time on a stream page and awards 50 tokens after 10 min (once/day).
 */
export function useWatchReward(streamId: string) {
  const { user, token } = useAuth();
  const startRef = useRef(Date.now());
  const rewardedRef = useRef(false);
  const [rewardMessage, setRewardMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!user || !token || !streamId) return;

    const interval = setInterval(async () => {
      if (rewardedRef.current) return;
      const elapsed = Date.now() - startRef.current;
      if (elapsed < MIN_WATCH_MS) return;

      rewardedRef.current = true;
      try {
        const res = await fetch("/api/tokens/watch-reward", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ watchMs: elapsed, streamId }),
        });
        const data = await res.json();
        if (data.success) {
          setRewardMessage(data.message);
          setTimeout(() => setRewardMessage(null), 5000);
        }
      } catch {
        rewardedRef.current = false;
      }
    }, 30_000);

    return () => clearInterval(interval);
  }, [user, token, streamId]);

  return { rewardMessage };
}