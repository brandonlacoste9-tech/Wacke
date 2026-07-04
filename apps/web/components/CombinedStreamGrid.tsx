"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { Users, ChevronDown } from "lucide-react";
import { useLanguage } from "./LanguageProvider";

export interface UnifiedStream {
  id: string;
  source: "kick" | "twitch";
  username: string;
  displayName: string;
  title: string;
  category: string;
  viewerCount: number;
  thumbnailUrl: string | null;
  avatarUrl: string | null;
  isLive: boolean;
}

function formatViewers(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}

const SOURCE_STYLES = {
  kick:   { bg: "bg-wacke-green/10 border-wacke-green/25 text-wacke-green", label: "KICK",   dot: "bg-wacke-green" },
  twitch: { bg: "bg-[#9146ff]/10 border-[#9146ff]/25 text-[#9146ff]", label: "TWITCH", dot: "bg-[#9146ff]" },
};

function SkeletonCard() {
  return (
    <div className="glass-card rounded-2xl overflow-hidden animate-pulse">
      <div className="aspect-video bg-white/3" />
      <div className="p-3.5 space-y-2">
        <div className="h-3.5 bg-white/3 rounded w-3/4" />
        <div className="h-3 bg-white/3 rounded w-1/2" />
      </div>
    </div>
  );
}

function StreamCard({ stream, index }: { stream: UnifiedStream; index: number }) {
  const { language } = useLanguage();
  const src = SOURCE_STYLES[stream.source];
  const initials = stream.displayName.substring(0, 2).toUpperCase();
  const href = stream.source === "twitch"
    ? `/stream/twitch-${stream.username}`
    : `/stream/${stream.username}`;

  const isMock = stream.id.includes("fallback") || stream.id.includes("mock-stream");

  return (
    <Link
      href={href}
      className="group block glass-card rounded-2xl overflow-hidden
                 hover:border-wacke-pink/30 hover:shadow-xl hover:shadow-wacke-pink/5
                 transition-all duration-300 hover:-translate-y-1 card-glow"
      style={{ animationDelay: `${index * 50}ms` }}
    >
      <div className="relative aspect-video bg-black overflow-hidden">
        {stream.thumbnailUrl ? (
          <img src={stream.thumbnailUrl} alt={stream.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-wacke-purple/30 via-wacke-pink/10 to-wacke-dark flex items-center justify-center">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-wacke-pink to-wacke-purple flex items-center justify-center text-lg font-black text-white border border-white/10 shadow-xl">
              {initials}
            </div>
          </div>
        )}

        {isMock ? (
          <div className="absolute top-2 left-2 flex items-center space-x-1 bg-purple-600/90 text-white text-[10px] font-extrabold px-2 py-0.5 rounded-md shadow-md backdrop-blur-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-white/70" />
            <span>{language === "fr" ? "REDIF" : "PAST SHOW"}</span>
          </div>
        ) : (
          <div className="absolute top-2 left-2 flex items-center space-x-1 bg-red-600/90 text-white text-[10px] font-extrabold px-2 py-0.5 rounded-md shadow-md backdrop-blur-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
            <span>LIVE</span>
          </div>
        )}

        <div className="absolute top-2 right-2 flex items-center space-x-1 bg-black/60 text-white text-[10px] font-bold px-2 py-0.5 rounded-md backdrop-blur-sm">
          <Users className="w-3 h-3 text-gray-300" />
          <span>{formatViewers(stream.viewerCount)}</span>
        </div>

        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      </div>

      <div className="p-3.5">
        <div className="flex items-center space-x-2 mb-1.5">
          {stream.avatarUrl ? (
            <img src={stream.avatarUrl} alt={stream.displayName}
              className="w-7 h-7 rounded-full border border-wacke-purple/20 shrink-0 object-cover" />
          ) : (
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-wacke-pink to-wacke-purple flex items-center justify-center text-[9px] font-black text-white shrink-0 border border-white/10">
              {initials}
            </div>
          )}
          <p className="text-sm font-bold text-white truncate group-hover:text-wacke-pink transition-colors flex-1">
            {stream.displayName}
          </p>
          <span className={`text-[8px] font-extrabold px-1.5 py-0.5 rounded border flex items-center space-x-1 shrink-0 ${src.bg}`}>
            <span className={`w-1 h-1 rounded-full ${src.dot}`} />
            <span>{src.label}</span>
          </span>
        </div>

        <p className="text-[11px] text-gray-500 line-clamp-1 leading-relaxed mb-2">{stream.title}</p>

        {stream.category && (
          <span className="text-[9px] font-bold px-2 py-0.5 rounded border bg-white/3 border-white/8 text-gray-500 uppercase tracking-wide">
            {stream.category}
          </span>
        )}
      </div>
    </Link>
  );
}

function Tab({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`px-3.5 py-1.5 rounded-xl text-xs font-bold border transition-all
                  ${active
                    ? "bg-wacke-purple/20 border-wacke-pink/30 text-white shadow-md"
                    : "border-transparent text-gray-500 hover:text-gray-300 hover:bg-white/3"}`}
    >
      {children}
    </button>
  );
}

interface CombinedStreamGridProps {
  limit?: number;
  title?: string;
}

export default function CombinedStreamGrid({
  limit = 20,
  title,
}: CombinedStreamGridProps) {
  const { t } = useLanguage();
  const displayTitle = title || t("liveNow");
  const [kickStreams, setKickStreams] = useState<UnifiedStream[]>([]);
  const [twitchStreams, setTwitchStreams] = useState<UnifiedStream[]>([]);
  const [loadingKick, setLoadingKick] = useState(true);
  const [loadingTwitch, setLoadingTwitch] = useState(true);
  const [activeTab, setActiveTab] = useState<"all" | "kick" | "twitch">("all");
  const [showCount, setShowCount] = useState(12);

  useEffect(() => {
    fetch(`/api/kick/livestreams?limit=${limit}`)
      .then((r) => r.json())
      .then((data) => {
        const unified: UnifiedStream[] = (data.streams ?? []).map((s: any) => {
          const username = s.channel?.user?.username ?? s.slug ?? "user";
          const displayName = username.charAt(0).toUpperCase() + username.slice(1);
          const title = s.stream_title ?? s.session_title ?? "Live Stream";
          const category = s.category?.name ?? s.categories?.[0]?.name ?? "Live";
          const thumbnailUrl = typeof s.thumbnail === "string" ? s.thumbnail : s.thumbnail?.src ?? null;
          const avatarUrl = s.profile_picture ?? s.channel?.profile_picture ?? s.channel?.user?.profile_pic ?? null;

          return {
            id: `kick-${s.id ?? username}`,
            source: "kick" as const,
            username,
            displayName,
            title,
            category,
            viewerCount: s.viewer_count ?? 0,
            thumbnailUrl,
            avatarUrl,
            isLive: true,
          };
        });
        setKickStreams(unified);
      })
      .catch(console.error)
      .finally(() => setLoadingKick(false));
  }, [limit]);

  useEffect(() => {
    fetch(`/api/twitch/livestreams?limit=${limit}`)
      .then((r) => r.json())
      .then((data) => {
        const unified: UnifiedStream[] = (data.streams ?? []).map((s: any) => ({
          id: `twitch-${s.id}`, source: "twitch" as const,
          username: s.user_login, displayName: s.user_name,
          title: s.title ?? "Live Stream", category: s.game_name ?? "Live",
          viewerCount: s.viewer_count ?? 0, thumbnailUrl: s.thumbnail_url ?? null,
          avatarUrl: s.profile_image_url ?? null, isLive: true,
        }));
        setTwitchStreams(unified);
      })
      .catch(console.error)
      .finally(() => setLoadingTwitch(false));
  }, [limit]);

  const loading = loadingKick && loadingTwitch;

  const allStreams = useMemo(
    () => [...kickStreams, ...twitchStreams].sort((a, b) => b.viewerCount - a.viewerCount),
    [kickStreams, twitchStreams]
  );

  const displayed = useMemo(() => {
    if (activeTab === "kick") return kickStreams;
    if (activeTab === "twitch") return twitchStreams;
    return allStreams;
  }, [activeTab, kickStreams, twitchStreams, allStreams]);

  const tabLoading =
    (activeTab === "kick" && loadingKick) ||
    (activeTab === "twitch" && loadingTwitch) ||
    (activeTab === "all" && loading);

  const visibleStreams = displayed.slice(0, showCount);
  const hasMore = displayed.length > showCount;

  return (
    <section>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <h2 className="text-2xl font-black tracking-tight">
          <span className="neon-pink graffiti-text">{displayTitle}</span>
        </h2>

        <div className="flex items-center space-x-2">
          <Tab active={activeTab === "all"} onClick={() => setActiveTab("all")}>
            🌐 {t("all")} ({allStreams.length})
          </Tab>
          <Tab active={activeTab === "kick"} onClick={() => setActiveTab("kick")}>
            <span className="text-wacke-green">●</span> Kick ({kickStreams.length})
          </Tab>
          <Tab active={activeTab === "twitch"} onClick={() => setActiveTab("twitch")}>
            <span className="text-[#9146ff]">●</span> Twitch ({twitchStreams.length})
          </Tab>

          <Link href="/browse" className="text-xs text-wacke-cyan hover:underline ml-2 font-medium">
            {t("seeAll")} →
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 stagger-children">
        {tabLoading
          ? Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)
          : visibleStreams.map((stream, i) => <StreamCard key={stream.id} stream={stream} index={i} />)
        }
      </div>

      {/* Load More */}
      {!tabLoading && hasMore && (
        <div className="text-center mt-8">
          <button
            onClick={() => setShowCount((c) => c + 8)}
            className="inline-flex items-center space-x-2 bg-white/3 hover:bg-white/5 border border-wacke-purple/20 hover:border-wacke-purple/40 text-gray-300 hover:text-white px-6 py-2.5 rounded-xl text-sm font-bold transition-all"
          >
            <span>{t("loadMore")}</span>
            <ChevronDown className="w-4 h-4" />
          </button>
        </div>
      )}

      {!tabLoading && displayed.length === 0 && (
        <div className="text-center py-20 text-gray-500">
          <div className="flex justify-center mb-6">
            <img src="/sleeping_server.png" alt="Sleeping Server" className="w-40 h-40 object-contain drop-shadow-[0_0_12px_rgba(255,0,255,0.2)] opacity-80" />
          </div>
          <p className="text-sm">{t("noLiveStreams")}</p>
        </div>
      )}
    </section>
  );
}
