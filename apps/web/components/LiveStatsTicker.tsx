"use client";

import { useEffect, useState, useMemo } from "react";
import { useLanguage } from "./LanguageProvider";
import { Bot, Volume2 } from "lucide-react";
import { speakWithGrokVoice } from "@/lib/audio";

interface StatsData {
  totalViewers: number;
  totalStreams: number;
  kickCount: number;
  twitchCount: number;
  topGame: string;
}

export default function LiveStatsTicker() {
  const { t, language } = useLanguage();
  const [stats, setStats] = useState<StatsData>({
    totalViewers: 0, totalStreams: 0, kickCount: 0, twitchCount: 0, topGame: "Gaming",
  });
  const [pulse, setPulse] = useState(false);
  const [displayViewers, setDisplayViewers] = useState(0);
  const [grokFact, setGrokFact] = useState("Grok xAI dit: Le dépanneur gagne toujours.");
  const [factLoading, setFactLoading] = useState(false);

  const fetchGrokFact = async () => {
    setFactLoading(true);
    try {
      const res = await fetch("/api/grok", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: language === "fr" 
            ? "Donne un fait court, drôle et wacké sur le streaming ou le Québec en argot. Maximum 15 mots."
            : "Give a short funny wacké fact about streaming or Quebec in slang. Max 15 words.",
          maxTokens: 40,
        }),
      });
      const data = await res.json();
      if (data.content) {
        const fact = data.content.trim();
        setGrokFact(fact);
        speakWithGrokVoice(fact, language === "fr" ? "fr-FR" : "en-US");
      }
    } catch {}
    setFactLoading(false);
  };

  useEffect(() => {
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

        const categoryCounts: Record<string, number> = {};
        kStreams.forEach((s: any) => { const cat = s.categories?.[0]?.name; if (cat) categoryCounts[cat] = (categoryCounts[cat] || 0) + 1; });
        tStreams.forEach((s: any) => { const cat = s.game_name; if (cat) categoryCounts[cat] = (categoryCounts[cat] || 0) + 1; });

        let topGame = "Multi-Gaming";
        let maxCount = 0;
        Object.entries(categoryCounts).forEach(([cat, count]) => { if (count > maxCount) { maxCount = count; topGame = cat; } });

        const newStats = {
          totalViewers: totalKViewers + totalTViewers || 142850,
          totalStreams: kStreams.length + tStreams.length || 16,
          kickCount: kStreams.length || 8,
          twitchCount: tStreams.length || 8,
          topGame,
        };

        setStats(newStats);
        if (displayViewers === 0) setDisplayViewers(newStats.totalViewers);
      } catch (err) {
        console.error("Failed to load ticker stats:", err);
      }
    };

    fetchStats();
    const interval = setInterval(fetchStats, 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (stats.totalViewers === 0) return;
    const flucInterval = setInterval(() => {
      setPulse(true);
      setTimeout(() => setPulse(false), 800);
      setDisplayViewers((current) => {
        const target = stats.totalViewers;
        const diff = target - current;
        if (Math.abs(diff) < 20) return target;
        const step = Math.floor(diff * 0.2);
        const wiggle = Math.floor((Math.random() - 0.5) * 10);
        return Math.max(0, current + step + wiggle);
      });
    }, 4000);
    return () => clearInterval(flucInterval);
  }, [stats.totalViewers]);

  const formattedViewers = useMemo(() => {
    return new Intl.NumberFormat("fr-CA").format(displayViewers || stats.totalViewers);
  }, [displayViewers, stats.totalViewers]);

  return (
    <div className="bg-wacke-darker/95 backdrop-blur-sm border-b border-wacke-purple/15 py-1 px-4 text-[10px] font-semibold overflow-hidden relative shadow-lg text-gray-400">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        {/* Live Counters */}
        <div className="flex items-center space-x-3 shrink-0">
          <div className="flex items-center space-x-1.5">
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-red-600"></span>
            </span>
            <span className="text-gray-500 font-bold uppercase tracking-wider">WACKÉ:</span>
            <span className={`font-black text-white transition-all duration-700 ${pulse ? "text-wacke-pink scale-105" : ""}`}>
              {formattedViewers}
            </span>
          </div>
          <div className="hidden sm:flex items-center space-x-1.5 text-gray-500">
            <span>•</span>
            <span>{stats.totalStreams} {t("liveStatsChaines")}</span>
          </div>
        </div>

        {/* Scrolling News Ticker */}
        <div className="flex-1 overflow-hidden relative h-4 hidden md:block select-none">
          <div className="animate-marquee whitespace-nowrap absolute flex items-center space-x-12 pl-[100%]">
            <span className="flex items-center space-x-1">
              <span className="text-wacke-cyan font-bold">{t("liveStatsTop")}</span>
              <span className="text-white">{stats.topGame}</span>
            </span>
            <span className="flex items-center space-x-1 text-wacke-cyan cursor-pointer" onClick={fetchGrokFact}>
              <Bot className="w-3 h-3" />
              <span className="font-bold">GROK:</span>
              <span className="text-gray-300 hover:text-white">{factLoading ? "..." : grokFact}</span>
              <Volume2 className="w-3 h-3 hover:text-white" onClick={(e) => { e.stopPropagation(); speakWithGrokVoice(grokFact, language === "fr" ? "fr-FR" : "en-US"); }} />
            </span>
            <span className="flex items-center space-x-1">
              <span className="text-wacke-pink font-bold">Boost:</span>
              <span className="text-gray-300">{t("liveStatsBoost")}</span>
            </span>
            <span className="flex items-center space-x-2">
              <span className="flex items-center space-x-1">
                <span className="w-1.5 h-1.5 rounded-full bg-wacke-green" />
                <span className="text-wacke-green font-bold">Kick</span>
              </span>
              <span className="flex items-center space-x-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#9146ff]" />
                <span className="text-[#9146ff] font-bold">Twitch</span>
              </span>
              <span className="text-gray-400">{t("liveStatsDoubleFlux")}</span>
            </span>
          </div>
        </div>

        {/* Platform Health */}
        <div className="flex items-center space-x-1.5 shrink-0">
          <div className="flex items-center space-x-1 bg-wacke-green/8 border border-wacke-green/20 text-wacke-green px-1.5 py-0.5 rounded text-[9px] font-bold">
            <span className="w-1 h-1 rounded-full bg-wacke-green animate-pulse" />
            <span>KICK</span>
          </div>
          <div className="flex items-center space-x-1 bg-[#9146ff]/8 border border-[#9146ff]/20 text-[#9146ff] px-1.5 py-0.5 rounded text-[9px] font-bold">
            <span className="w-1 h-1 rounded-full bg-[#9146ff] animate-pulse" />
            <span>TWITCH</span>
          </div>
        </div>
      </div>
    </div>
  );
}
