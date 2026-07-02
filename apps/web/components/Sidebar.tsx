"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Search, Radio, ChevronLeft, ChevronRight, Users } from "lucide-react";

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
  const [channels, setChannels] = useState<SidebarChannel[]>([]);

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
    { href: "/", icon: <Home className="w-5 h-5" />, label: "Accueil", color: "text-wacke-pink" },
    { href: "/browse", icon: <Search className="w-5 h-5" />, label: "Parcourir", color: "text-wacke-cyan" },
    { href: "/dashboard/stream", icon: <Radio className="w-5 h-5" />, label: "Mon Stream", color: "text-wacke-red" },
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
            Chaînes Recommandées
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
      </div>

      {/* ── Collapse Toggle + Discord ────────────────────────────────────── */}
      <div className="p-3 border-t border-wacke-purple/10 space-y-3">
        {/* Discord Banner */}
        {!collapsed && (
          <div className="bg-white/2 border border-wacke-purple/10 rounded-xl p-3">
            <p className="text-[10px] text-gray-500 font-semibold mb-2">Rejoindre le Discord Wacké?</p>
            <a
              href="https://discord.gg"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full bg-[#5865F2] hover:bg-[#4752C4] py-1.5 rounded-lg font-bold text-[10px] text-white flex items-center justify-center space-x-1.5 transition-colors"
            >
              <span>Rejoindre</span>
              <img src="/icon_discord.png" alt="Discord" className="w-3.5 h-3.5 object-contain" />
            </a>
          </div>
        )}

        {/* Collapse button */}
        <button
          onClick={() => setCollapsed((prev) => !prev)}
          className="w-full flex items-center justify-center py-1.5 rounded-lg hover:bg-white/3 transition-colors text-gray-600 hover:text-gray-400"
          title={collapsed ? "Agrandir" : "Réduire"}
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>
    </aside>
  );
}
