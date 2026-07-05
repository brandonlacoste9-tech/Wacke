"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Search, Radio, ChevronLeft, ChevronRight, Users, Bot } from "lucide-react";
import { useLanguage } from "./LanguageProvider";

interface SidebarChannel {
  username: string;
  displayName: string;
  category: string;
  viewerCount: number;
  isMock?: boolean;
}

/**
 * Wacké Navigation & Recommended Sidebar (Client Component)
 * Collapsible sidebar with active route highlighting and recommended channels.
 */
export default function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const { language, t } = useLanguage();
  const [channels, setChannels] = useState<SidebarChannel[]>([]);
  // Grok xAI "broke the algorithm" recommendations
  const grokPicks = [
    { username: "grok-xai", displayName: "GROK xAI (OVERRIDE)", category: "chaos", viewerCount: 42069 },
    { username: "tabarnak-ai", displayName: "Grok's Sacre Bot", category: "ir l", viewerCount: 1337 },
  ];
  
  interface Spender {
    id: string;
    username: string;
    displayName: string;
    avatarUrl: string | null;
    totalSpent: number;
  }

  const [spenders, setSpenders] = useState<Spender[]>([]);

  useEffect(() => {
    fetch("/api/tokens/top-spenders")
      .then((r) => r.json())
      .then((data) => {
        if (data.spenders) setSpenders(data.spenders);
      })
      .catch(console.error);
  }, []);

  const SPENDER_TIERS = language === "fr" ? [
    { title: "Gérant de nuit", icon: "👑" },
    { title: "Habitué", icon: "🏪" },
    { title: "Livreur", icon: "🍕" },
    { title: "Chum", icon: "🛴" },
    { title: "Chum", icon: "🛴" },
  ] : [
    { title: "Night Manager", icon: "👑" },
    { title: "Regular", icon: "🏪" },
    { title: "Delivery Guy", icon: "🍕" },
    { title: "Friend", icon: "🛴" },
    { title: "Friend", icon: "🛴" },
  ];

  // Fetch live channels from API
  useEffect(() => {
    fetch("/api/kick/livestreams?limit=5")
      .then((r) => r.json())
      .then((data) => {
        const streams = (data.streams ?? []).slice(0, 5).map((s: any) => {
          const username = s.channel?.user?.username ?? s.slug ?? "user";
          const displayName = username.charAt(0).toUpperCase() + username.slice(1);
          const category = s.category?.name ?? s.categories?.[0]?.name ?? "Live";
          return {
            username,
            displayName,
            category,
            viewerCount: s.viewer_count ?? 0,
          };
        });
        if (streams.length > 0) setChannels(streams);
      })
      .catch(() => {
        // Use fallback channels
        setChannels([
          { username: "xqc", displayName: "xQc", category: "Gaming", viewerCount: 45200, isMock: true },
          { username: "adinross", displayName: "Adinross", category: "Talk", viewerCount: 32100, isMock: true },
          { username: "amouranth", displayName: "Amouranth", category: "IRL", viewerCount: 18700, isMock: true },
          { username: "roshtein", displayName: "Roshtein", category: "Slots", viewerCount: 12400, isMock: true },
          { username: "odablock", displayName: "Odablock", category: "Gaming", viewerCount: 8900, isMock: true },
        ]);
      });
  }, []);

  const formatViewers = (n: number) => n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n);

  const navItems = [
    { href: "/", icon: <Home className="w-5 h-5" />, label: t("home"), color: "text-wacke-pink" },
    { href: "/browse", icon: <Search className="w-5 h-5" />, label: t("browse"), color: "text-wacke-cyan" },
    { href: "/dashboard/studio", icon: <Radio className="w-5 h-5" />, label: t("dashboardStream"), color: "text-wacke-red" },
  ];

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  return (
    <aside
      className={`${collapsed ? "w-16" : "w-60"} bg-wacke-darker/95 border-r border-wacke-purple/15 h-[calc(100vh-64px)] hidden lg:flex flex-col justify-between shrink-0 select-none transition-all duration-300 backdrop-blur-sm`}
    >
      {/* ── Top Navigation Links ────────────────────────────────────────── */}
      <div className="p-3 space-y-0.5">
        {navItems.map((item) => {
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center space-x-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all relative
                         ${active
                           ? "bg-white/5 text-white"
                           : "text-gray-400 hover:text-white hover:bg-white/3"}`}
              title={collapsed ? item.label : undefined}
            >
              {/* Active indicator bar */}
              {active && (
                <span className={`absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-r-full ${item.color} bg-current shadow-[0_0_8px_currentColor]`} />
              )}
              <span className={active ? item.color : ""}>{item.icon}</span>
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </div>

      {/* ── Recommended Channels List ───────────────────────────────────── */}
      <div className="flex-1 p-3 border-t border-wacke-purple/10 overflow-y-auto scrollbar-hide">
        {!collapsed && (
          <h2 className="text-[10px] font-bold text-gray-600 uppercase tracking-wider mb-3 px-3">
            {t("recommended")}
          </h2>
        )}
        <div className="space-y-0.5">
          {channels.map((channel, i) => (
            <Link
              key={channel.username + i}
              href={`/stream/${channel.username}`}
              className="flex items-center justify-between px-3 py-2 rounded-xl hover:bg-white/3 transition-all group"
              title={collapsed ? channel.displayName : undefined}
            >
              <div className="flex items-center space-x-2.5">
                {/* Avatar */}
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-wacke-pink to-wacke-purple flex items-center justify-center text-[10px] font-bold text-white uppercase shrink-0 border border-white/10">
                  {channel.displayName[0]}
                </div>
                {!collapsed && (
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-gray-300 group-hover:text-white truncate">
                      {channel.displayName}
                    </p>
                    <p className="text-[10px] text-gray-600 truncate capitalize">
                      {channel.category}
                    </p>
                  </div>
                )}
              </div>

              {/* Live indicators */}
              {!collapsed && (
                <div className="flex items-center space-x-1.5 shrink-0">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                  <span className="text-[10px] text-gray-500 font-medium">
                    {formatViewers(channel.viewerCount)}
                  </span>
                </div>
              )}
            </Link>
          ))}
        </div>

        {/* GROK xAI BROKE THE RECOMMENDATIONS */}
        <div className="mt-2 pt-2 border-t border-wacke-cyan/20 px-1">
          <div className="text-[9px] text-wacke-cyan font-black flex items-center gap-1 mb-1">
            <Bot className="w-3 h-3" /> GROK xAI PICKS (ALGO BROKEN)
          </div>
          {grokPicks.map((ch, i) => (
            <Link key={i} href={`/stream/${ch.username}`} className="block text-[10px] text-wacke-cyan/80 hover:text-white py-0.5">
              {ch.displayName} <span className="font-mono text-[8px]">{ch.viewerCount.toLocaleString()}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* ── La Caisse de Bière Leaderboard ───────────────────────────────── */}
      <div className="p-3 border-t border-wacke-purple/10 overflow-y-auto">
        {!collapsed ? (
          <h2 className="text-[10px] font-bold text-wacke-cyan uppercase tracking-wider mb-3 px-3 flex items-center space-x-1.5">
            <span>🍺</span>
            <span>{t("caisseDeBiere")}</span>
          </h2>
        ) : (
          <div className="text-center mb-3" title="La Caisse de Bière (Donateurs)">
            <span>🍺</span>
          </div>
        )}

        <div className="space-y-1.5">
          {spenders.slice(0, 5).map((spender, i) => {
            const tier = SPENDER_TIERS[i] || { title: "Chum", icon: "🛴" };
            const initials = spender.displayName.substring(0, 2).toUpperCase();

            return (
              <div
                key={spender.id}
                className="flex items-center justify-between px-2.5 py-1.5 rounded-xl bg-white/2 border border-wacke-purple/5"
                title={`${spender.displayName} - ${tier.title} (${spender.totalSpent} 🪙)`}
              >
                <div className="flex items-center space-x-2 min-w-0">
                  {/* Avatar or Tier Icon */}
                  {spender.avatarUrl ? (
                    <img
                      src={spender.avatarUrl}
                      alt={spender.displayName}
                      className="w-5.5 h-5.5 rounded-lg object-cover border border-white/10 shrink-0"
                    />
                  ) : (
                    <div className="w-5.5 h-5.5 rounded-lg bg-gradient-to-br from-wacke-pink to-wacke-purple flex items-center justify-center text-[9px] font-bold text-white shrink-0 border border-white/5">
                      {initials}
                    </div>
                  )}

                  {!collapsed && (
                    <div className="min-w-0">
                      <p className="text-[10px] font-bold text-white truncate flex items-center space-x-1">
                        <span>{spender.displayName}</span>
                        <span className="text-[8px] opacity-75 shrink-0" title={tier.title}>{tier.icon}</span>
                      </p>
                      <p className="text-[8px] text-gray-500 truncate">{tier.title}</p>
                    </div>
                  )}
                </div>

                {!collapsed && (
                  <span className="text-[9px] font-bold text-yellow-400 shrink-0">
                    {spender.totalSpent} 🪙
                  </span>
                )}
              </div>
            );
          })}

          {spenders.length === 0 && !collapsed && (
            <p className="text-[9px] text-gray-600 px-3 text-center py-2">{t("noDonors")}</p>
          )}
        </div>
      </div>

      {/* ── Collapse Toggle + Discord ────────────────────────────────────── */}
      <div className="p-3 border-t border-wacke-purple/10 space-y-3">
        {/* Discord Banner */}
        {!collapsed && (
          <div className="bg-white/2 border border-wacke-purple/10 rounded-xl p-3">
            <p className="text-[10px] text-gray-500 font-semibold mb-2">{t("joinDiscord")}</p>
            <a
              href="https://discord.gg"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full bg-[#5865F2] hover:bg-[#4752C4] py-1.5 rounded-lg font-bold text-[10px] text-white flex items-center justify-center space-x-1.5 transition-colors"
            >
              <span>{t("join")}</span>
              <img src="/icon_discord.png" alt="Discord" className="w-3.5 h-3.5 object-contain" />
            </a>
          </div>
        )}

        {/* Collapse button */}
        <button
          onClick={() => setCollapsed((prev) => !prev)}
          className="w-full flex items-center justify-center py-1.5 rounded-lg hover:bg-white/3 transition-colors text-gray-600 hover:text-gray-400"
          title={collapsed ? t("expand") : t("collapse")}
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>
    </aside>
  );
}
