"use client";

import { useState, useCallback } from "react";

interface UseTokensOptions {
  initialBalance?: number;
  authToken?: string;
}

interface UseTokensReturn {
  balance: number;
  isLoading: boolean;
  sendBoum: (toUserId: string, streamId: string) => Promise<{ error?: string; message?: string }>;
  giftTokens: (toUserId: string, amount: number, streamId?: string) => Promise<{ error?: string; message?: string }>;
  refreshBalance: () => Promise<void>;
}

/**
 * useTokens — Client-side token economy hook.
 *
 * Manages the user's token balance and provides methods for
 * Boum! reactions and gifting tokens to streamers.
 */
export function useTokens({
  initialBalance = 0,
  authToken,
}: UseTokensOptions): UseTokensReturn {
  const [balance, setBalance] = useState(initialBalance);
  const [isLoading, setIsLoading] = useState(false);

  const getHeaders = () => ({
    "Content-Type": "application/json",
    ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
  });

  const refreshBalance = useCallback(async () => {
    if (!authToken) return;
    try {
      const res = await fetch("/api/tokens", { headers: getHeaders() });
      if (res.ok) {
        const data = await res.json();
        setBalance(data.balance);
      }
    } catch {
      // Silently fail — balance will refresh on next interaction
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authToken]);

  const sendBoum = useCallback(
    async (toUserId: string, streamId: string) => {
      if (!authToken) return { error: "Connecte-toi pour envoyer un Boum!" };
      setIsLoading(true);
      try {
        const res = await fetch("/api/tokens", {
          method: "POST",
          headers: getHeaders(),
          body: JSON.stringify({ action: "boum", toUserId, streamId, amount: 5 }),
        });
        const data = await res.json();
        if (!res.ok) return { error: data.error };
        setBalance(data.newBalance);
        return { message: data.message };
      } catch {
        return { error: "Connexion perdue" };
      } finally {
        setIsLoading(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [authToken]
  );

  const giftTokens = useCallback(
    async (toUserId: string, amount: number, streamId?: string) => {
      if (!authToken) return { error: "Connecte-toi pour faire un don" };
      setIsLoading(true);
      try {
        const res = await fetch("/api/tokens", {
          method: "POST",
          headers: getHeaders(),
          body: JSON.stringify({ action: "gift", toUserId, streamId, amount }),
        });
        const data = await res.json();
        if (!res.ok) return { error: data.error };
        setBalance(data.newBalance);
        return { message: data.message };
      } catch {
        return { error: "Connexion perdue" };
      } finally {
        setIsLoading(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [authToken]
  );

  return { balance, isLoading, sendBoum, giftTokens, refreshBalance };
}
