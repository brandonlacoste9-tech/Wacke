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
}

interface Spender {
  id: string;
  displayName: string;
  avatarUrl: string | null;
  totalSpent: number;
}

function ToolPill({ icon, active, onClick }: { icon: string; active: boolean; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className={`px-2.5 py-2 rounded-xl text-sm transition-all shrink-0 ${active ? 'bg-wacke-purple/20 text-wacke-pink' : 'text-gray-500 hover:text-white hover:bg-white/5'}`}>
      {icon}
    </button>
  );
}

function formatViewers(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return String(n);
}

export default function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const { language, t } = useLanguage();
  const [channels, setChannels] = useState<SidebarChannel[]>([]);
  const [spenders, setSpenders] = useState<Spender[]>([]);

  useEffect(() => {
    fetch("/api/tokens/top-spenders")
      .then((r) => r.json())
      .then((data) => data.spenders && setSpenders(data.spenders))
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetch("/api/kick/livestreams?limit=8")
      .then((r) => r.json())
      .then((data) => {
        const streams = (data.streams ?? []).slice(0, 8).map((s: any) => {
          const username = s.channel?.user?.username ?? s.slug ?? "user";
          const displayName = username.charAt(0).toUpperCase() + username.slice(1);
          const category = s.category?.name ?? s.categories?.[0]?.name ?? "Live";
          return { username, displayName, category, viewerCount: s.viewer_count ?? 0 };
        });
        if (streams.length > 0) setChannels(streams);
      })
      .catch(() => {
        setChannels([
          { username: "xqc", displayName: "xQc", category: "Gaming", viewerCount: 45200 },
          { username: "adinross", displayName: "Adinross", category: "Talk", viewerCount: 32100 },
          { username: "amouranth", displayName: "Amouranth", category: "IRL", viewerCount: 18700 },
          { username: "roshtein", displayName: "Roshtein", category: "Slots", viewerCount: 12400 },
          { username: "odablock", displayName: "Odablock", category: "Gaming", viewerCount: 8900 },
        ]);
      });
  }, []);

  const SPENDER_TIERS_FR = [
    { title: "Gérant de nuit", icon: "👑" },
    { title: "Habitué", icon: "🏪" },
    { title: "Livreur", icon: "🍕" },
    { title: "Rookie", icon: "🛴" },
    { title: "Rookie", icon: "🛴" },
  ];

  const navItems = [
    { href: "/", icon: <Home className="w-5 h-5" />, label: t("home") },
    { href: "/browse", icon: <Search className="w-5 h-5" />, label: t("browse") },
    { href: "/dashboard/studio", icon: <Radio className="w-5 h-5" />, label: t("dashboardStream") },
  ];

  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));

  return (
    <aside className={`hidden md:block fixed left-4 top-20 bottom-4 z-40 ${collapsed ? 'w-16' : 'w-[280px]'} transition-all duration-300 hover:scale-[1.01]`}>
      <div className="glass rounded-2xl p-3 flex flex-col h-full overflow-hidden">
        <div className="space-y-1">
          {navItems.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                title={collapsed ? item.label : undefined}
                className={`relative flex items-center justify-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 group overflow-hidden ${active ? 'bg-white/[0.07] text-white shadow-[0_0_18px_rgba(0,240,255,0.12)]' : 'text-gray-400 hover:text-white hover:bg-white/[0.03]'}`}
              >
                <span className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.04),_transparent_70%)]" />
                {active && <span className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-[3px] rounded-r-full bg-wacke-cyan shadow-[0_0_10px_#00F0FF]" />}
                <span className={active ? 'text-wacke-cyan' : ''}>{item.icon}</span>
                {!collapsed && <span className="tracking-tight">{item.label}</span>}
              </Link>
            );
          })}
        </div>

        <div className="mt-4 flex-1 min-h-0 -mx-1 px-1 pb-4 overflow-y-auto space-y-1 custom-scrollbar">
          {!collapsed && (
            <h3 className="px-2 text-[10px] font-black text-gray-600 uppercase tracking-widest mb-2">
              {t("recommended")}
            </h3>
          )}
          <div className="space-y-1">
            {channels.map((channel, i) => (
              <Link
                key={channel.username + i}
                href={`/stream/${channel.username}`}
                className="flex items-center gap-3 px-2 py-2 rounded-xl hover:bg-white/[0.04] transition-all group"
                title={collapsed ? channel.displayName : undefined}
              >
                <div className="relative shrink-0">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-wacke-pink to-wacke-purple flex items-center justify-center text-xs font-black text-white transition-all duration-300 border-2 bg-clip-padding neon-ring">
                    {channel.displayName[0].toUpperCase()}
                  </div>
                  <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-red-500 rounded-full border-2 border-wacke-darker animate-pulse-fast" />
                </div>
                {!collapsed && (
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-gray-300 group-hover:text-white truncate transition-colors">
                      {channel.displayName}
                    </p>
                    <p className="text-[10px] text-gray-600 truncate capitalize">{channel.category}</p>
                  </div>
                )}
                {!collapsed && (
                  <span className="ml-auto text-[10px] font-mono text-gray-500 tabular-nums">
                    {formatViewers(channel.viewerCount)}
                  </span>
                )}
              </Link>
            ))}
          </div>

          <div className="mt-2 pt-2 pb-4 border-t border-wacke-cyan/20 px-1">
            <div className="text-[9px] text-wacke-cyan font-black flex items-center gap-1 mb-1">
              <Bot className="w-3 h-3" /> GROK xAI PICKS
            </div>
            {[
              { displayName: "Grok Override", username: "grok-xai", viewerCount: 42069 },
              { displayName: "Grok xAI", username: "grok-xai-live", viewerCount: 1337 },
            ].map((ch, i) => (
              <Link key={i} href={`/stream/${ch.username}`} className="block text-[10px] text-wacke-cyan/80 hover:text-white py-0.5">
                {ch.displayName} <span className="font-mono text-[8px]">{formatViewers(ch.viewerCount)}</span>
              </Link>
            ))}
          </div>
        </div>

        <div className="p-3 border-t border-wacke-purple/10 space-y-3">
          {!collapsed && (
            <Link
              href="/claims"
              className="block text-[10px] text-wacke-pink/80 hover:text-wacke-pink font-bold py-1 transition-colors"
            >
              {language === "fr" ? "Handles réservés →" : "Reserved handles →"}
            </Link>
          )}
          {!collapsed ? (
            <div className="bg-white/2 border border-wacke-purple/10 rounded-xl p-3">
              <p className="text-[10px] text-gray-500 font-semibold mb-2">{t("joinDiscord")}</p>
              <a
                href={process.env.NEXT_PUBLIC_DISCORD_INVITE ?? "https://discord.gg/wacke"}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full bg-[#5865F2] hover:bg-[#4752C4] py-1.5 rounded-lg font-bold text-[10px] text-white flex items-center justify-center transition-colors"
              >
                <span>{t("join")}</span>
              </a>
            </div>
          ) : (
            <div className="text-center" title="Discord">
              <Bot className="w-4 h-4 mx-auto text-gray-500" />
            </div>
          )}

          <button
            onClick={() => setCollapsed((prev) => !prev)}
            className="w-full flex items-center justify-center py-1.5 rounded-lg hover:bg-white/3 transition-colors text-gray-600 hover:text-gray-400"
            title={collapsed ? t("expand") : t("collapse")}
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </aside>
  );
}
