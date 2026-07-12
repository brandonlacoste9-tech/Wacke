"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { useLanguage } from "@/components/LanguageProvider";
import { Coins, TrendingUp, Gift, Zap } from "lucide-react";

interface EarningsData {
  chaosShareTotal: number;
  giftTotal: number;
  totalEarned: number;
  sharePercent: number;
  balance?: number;
  recent: Array<{
    id?: string;
    amount: number;
    type: string;
    reason?: string | null;
    createdAt?: string | Date;
  }>;
}

/**
 * Streamer-facing ledger: chaos share (30% of spends) + gifts/boum.
 */
export default function ChaosEarningsCard() {
  const { token, user } = useAuth();
  const { language } = useLanguage();
  const isFr = language === "fr";
  const [data, setData] = useState<EarningsData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;

    (async () => {
      try {
        const res = await fetch("/api/tokens/earnings", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) {
          if (!cancelled) setError("Could not load earnings");
          return;
        }
        const json = await res.json();
        if (!cancelled) setData(json);
      } catch {
        if (!cancelled) setError("Connection error");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [token]);

  if (!user || !token) return null;

  return (
    <div className="rounded-2xl border border-wacke-cyan/25 bg-black/40 p-4 space-y-3 animate-fade-in">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-wacke-cyan/15 text-wacke-cyan">
            <TrendingUp className="w-4 h-4" />
          </div>
          <div>
            <p className="text-xs font-black uppercase tracking-widest text-white">
              {isFr ? "Revenus Chaos" : "Chaos Earnings"}
            </p>
            <p className="text-[10px] text-gray-400">
              {isFr
                ? `${data?.sharePercent ?? 30}% des spends TTS/Sacre/Spray/Son`
                : `${data?.sharePercent ?? 30}% of TTS / Sacre / Spray / Sound spends`}
            </p>
          </div>
        </div>
        {typeof data?.balance === "number" && (
          <div className="flex items-center gap-1 text-yellow-400 text-xs font-bold">
            <Coins className="w-3.5 h-3.5" />
            {data.balance}
          </div>
        )}
      </div>

      {error && (
        <p className="text-[11px] text-red-400 font-medium">{error}</p>
      )}

      {!data && !error && (
        <p className="text-[11px] text-gray-500">Loading ledger…</p>
      )}

      {data && (
        <>
          <div className="grid grid-cols-3 gap-2">
            <div className="rounded-xl bg-wacke-pink/10 border border-wacke-pink/25 p-2.5 text-center">
              <Zap className="w-3.5 h-3.5 text-wacke-pink mx-auto mb-1" />
              <p className="text-sm font-black text-white tabular-nums">
                {data.chaosShareTotal}
              </p>
              <p className="text-[9px] text-gray-400 uppercase tracking-wider">
                {isFr ? "Part chaos" : "Chaos share"}
              </p>
            </div>
            <div className="rounded-xl bg-purple-500/10 border border-purple-400/25 p-2.5 text-center">
              <Gift className="w-3.5 h-3.5 text-purple-300 mx-auto mb-1" />
              <p className="text-sm font-black text-white tabular-nums">
                {data.giftTotal}
              </p>
              <p className="text-[9px] text-gray-400 uppercase tracking-wider">
                {isFr ? "Dons / Boum" : "Gifts / Boom"}
              </p>
            </div>
            <div className="rounded-xl bg-wacke-cyan/10 border border-wacke-cyan/25 p-2.5 text-center">
              <Coins className="w-3.5 h-3.5 text-wacke-cyan mx-auto mb-1" />
              <p className="text-sm font-black text-white tabular-nums">
                {data.totalEarned}
              </p>
              <p className="text-[9px] text-gray-400 uppercase tracking-wider">
                {isFr ? "Total" : "Total"}
              </p>
            </div>
          </div>

          {data.recent?.length > 0 && (
            <div className="space-y-1.5 max-h-36 overflow-y-auto">
              <p className="text-[9px] font-bold uppercase tracking-widest text-gray-500">
                {isFr ? "Récent" : "Recent"}
              </p>
              {data.recent.slice(0, 8).map((row, i) => (
                <div
                  key={row.id || i}
                  className="flex items-center justify-between text-[10px] py-1 border-b border-white/5"
                >
                  <span className="text-gray-400 truncate pr-2">
                    {row.reason || row.type}
                  </span>
                  <span className="text-wacke-cyan font-bold tabular-nums shrink-0">
                    +{row.amount}
                  </span>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
