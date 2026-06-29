"use client";

import { useEffect, useState, useMemo } from "react";

interface StatsData {
  totalViewers: number;
  totalStreams: number;
  kickCount: number;
  twitchCount: number;
  topGame: string;
}

export default function LiveStatsTicker() {
  const [stats, setStats] = useState<StatsData>({
    totalViewers: 0,
    totalStreams: 0,
    kickCount: 0,
    twitchCount: 0,
    topGame: "Gaming",
  });
  const [pulse, setPulse] = useState(false);

  // Micro-fluctuation simulation for viewer counts to make it feel alive
  const [displayViewers, setDisplayViewers] = useState(0);

  useEffect(() => {
    // Fetch stats from Kick + Twitch streams
    const fetchStats = async () => {
      try {
        const [kickRes, twitchRes] = await Promise.all([
          fetch("/api/kick/livestreams?limit=20").then((r) => r.json()).catch(() => ({ streams: [] })),
          fetch("/api/twitch/livestreams?limit=20").then((r) => r.json()).catch(() => ({ streams: [] })),
        ]);

        const kStreams = kickRes.streams ?? [];
        const tStreams = twitchRes.streams ?? [];

        const totalKViewers = kStreams.reduce((acc: number, s: any) => acc + (s.viewer_count ?? 0), 0);
        const totalTViewers = tStreams.reduce((acc: number, s: any) => acc + (s.viewer_count ?? 0), 0);

        // Find most frequent game/category
        const categoryCounts: Record<string, number> = {};
        kStreams.forEach((s: any) => {
          const cat = s.categories?.[0]?.name;
          if (cat) categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
        });
        tStreams.forEach((s: any) => {
          const cat = s.game_name;
          if (cat) categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
        });

        let topGame = "Multi-Gaming";
        let maxCount = 0;
        Object.entries(categoryCounts).forEach(([cat, count]) => {
          if (count > maxCount) {
            maxCount = count;
            topGame = cat;
          }
        });

        const newStats = {
          totalViewers: totalKViewers + totalTViewers || 142850, // default if fallback/error
          totalStreams: kStreams.length + tStreams.length || 16,
          kickCount: kStreams.length || 8,
          twitchCount: tStreams.length || 8,
          topGame,
        };

        setStats(newStats);
        if (displayViewers === 0) {
          setDisplayViewers(newStats.totalViewers);
        }
      } catch (err) {
        console.error("Failed to load ticker stats:", err);
      }
    };

    fetchStats();
    const interval = setInterval(fetchStats, 60000);
    return () => clearInterval(interval);
  }, []);

  // Soft random fluctuation to create a micro-animation effect
  useEffect(() => {
    if (stats.totalViewers === 0) return;
    const flucInterval = setInterval(() => {
      setPulse(true);
      setTimeout(() => setPulse(false), 800);

      setDisplayViewers((current) => {
        const target = stats.totalViewers;
        const diff = target - current;
        if (Math.abs(diff) < 20) return target;
        // Step closer to target with a slight random wiggle
        const step = Math.floor(diff * 0.2);
        const wiggle = Math.floor((Math.random() - 0.5) * 10);
        return Math.max(0, current + step + wiggle);
      });
    }, 4000);

    return () => clearInterval(flucInterval);
  }, [stats.totalViewers]);

  const kickPercentage = useMemo(() => {
    const total = stats.kickCount + stats.twitchCount;
    if (total === 0) return 50;
    return Math.round((stats.kickCount / total) * 100);
  }, [stats]);

  const formattedViewers = useMemo(() => {
    return new Intl.NumberFormat("fr-CA").format(displayViewers || stats.totalViewers);
  }, [displayViewers, stats.totalViewers]);

  return (
    <div className="bg-wacke-darker/95 border-b border-wacke-purple/20 py-1.5 px-4 text-xs font-semibold overflow-hidden relative shadow-lg text-gray-300">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        {/* Live Counters */}
        <div className="flex items-center space-x-4 shrink-0">
          <div className="flex items-center space-x-1.5">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-red-600"></span>
            </span>
            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">WACKÉ LIVE:</span>
            <span 
              className={`font-black text-white transition-all duration-700 ${pulse ? "text-wacke-pink scale-105" : ""}`}
            >
              {formattedViewers} spectateurs
            </span>
          </div>
          <div className="hidden sm:flex items-center space-x-2 text-gray-400">
            <span>•</span>
            <span>{stats.totalStreams} chaînes actives</span>
          </div>
        </div>

        {/* Scrolling News Ticker */}
        <div className="flex-1 overflow-hidden relative h-5 hidden md:block select-none">
          <div className="animate-marquee whitespace-nowrap absolute flex items-center space-x-12 pl-[100%]">
            <span className="flex items-center space-x-1">
              <span className="text-wacke-cyan">🎮 Catégorie Populaire:</span>
              <span className="text-white font-bold">{stats.topGame}</span>
            </span>
            <span className="flex items-center space-x-1">
              <span className="text-wacke-pink">🚀 Boostez vos créateurs:</span>
              <span className="text-white">Réclamez vos jetons Wacké toutes les 24h!</span>
            </span>
            <span className="flex items-center space-x-2">
              <span className="text-[#53fc18] font-extrabold">🟢 Kick:</span>
              <span className="text-white">{kickPercentage}% de parts</span>
              <span className="text-[#9146ff] font-extrabold">🟣 Twitch:</span>
              <span className="text-white">{100 - kickPercentage}% de parts</span>
            </span>
            <span className="flex items-center space-x-1">
              <span className="text-wacke-cyan">⚡ Nouveau:</span>
              <span className="text-white">Support double flux Kick & Twitch activé!</span>
            </span>
          </div>
        </div>

        {/* Small Platform Share Indicators */}
        <div className="flex items-center space-x-2 shrink-0 text-[10px]">
          <div className="flex items-center space-x-1 bg-[#53fc18]/10 border border-[#53fc18]/30 text-[#53fc18] px-2 py-0.5 rounded">
            <span>KICK</span>
          </div>
          <div className="flex items-center space-x-1 bg-[#9146ff]/10 border border-[#9146ff]/30 text-[#9146ff] px-2 py-0.5 rounded">
            <span>TWITCH</span>
          </div>
        </div>
      </div>
    </div>
  );
}
