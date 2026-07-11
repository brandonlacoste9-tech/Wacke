"use client";

import { useEffect, useState } from "react";
import { Users, TrendingUp, Zap } from "lucide-react";
import { useLanguage } from "./LanguageProvider";

interface Stats {
  liveChannels: number;
  totalViewers: number;
  wackeChannels: number;
  boomCount: number;
}

function formatStat(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M+`;
  if (n >= 1000) return `${Math.floor(n / 1000)}K+`;
  return `${n}`;
}

interface HeroStatsProps {
  initial: Stats;
}

export default function HeroStats({ initial }: HeroStatsProps) {
  const { t } = useLanguage();
  const [stats, setStats] = useState(initial);

  useEffect(() => {
    fetch("/api/stats")
      .then((r) => r.json())
      .then((data) => setStats(data))
      .catch(() => {});
  }, []);

  return (
    <div className="flex items-center justify-center space-x-6 md:space-x-10">
      <div className="flex items-center space-x-2 glass rounded-xl px-4 py-2">
        <Users className="w-4 h-4 text-wacke-pink" />
        <div className="text-left">
          <p className="text-sm font-bold text-white">{formatStat(stats.totalViewers)}</p>
          <p className="text-[9px] text-gray-400 uppercase tracking-wider">{t("spectators")}</p>
        </div>
      </div>
      <div className="flex items-center space-x-2 glass rounded-xl px-4 py-2">
        <TrendingUp className="w-4 h-4 text-wacke-cyan" />
        <div className="text-left">
          <p className="text-sm font-bold text-white">{stats.liveChannels}</p>
          <p className="text-[9px] text-gray-400 uppercase tracking-wider">{t("channels")}</p>
        </div>
      </div>
      <div className="hidden sm:flex items-center space-x-2 glass rounded-xl px-4 py-2">
        <Zap className="w-4 h-4 text-yellow-400" />
        <div className="text-left">
          <p className="text-sm font-bold text-white">{formatStat(stats.boomCount)}</p>
          <p className="text-[9px] text-gray-400 uppercase tracking-wider">{t("boom")}</p>
        </div>
      </div>
    </div>
  );
}