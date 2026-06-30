"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { Users } from "lucide-react";

// ─── Unified stream type (works for both Kick and Twitch) ────────────────────
export interface UnifiedStream {
  id: string;
  source: "kick" | "twitch";
  username: string;        // lowercase slug/login
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

// Source badge colours
const SOURCE_STYLES = {
  kick:   { bg: "bg-[#53fc18]/15 border-[#53fc18]/30 text-[#53fc18]", label: "KICK",   dot: "bg-[#53fc18]" },
  twitch: { bg: "bg-[#9146ff]/15 border-[#9146ff]/30 text-[#9146ff]", label: "TWITCH", dot: "bg-[#9146ff]" },
};

// ─── Skeleton loader ─────────────────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div className="bg-wacke-darker rounded-2xl overflow-hidden border border-wacke-purple/10 animate-pulse">
      <div className="aspect-video bg-white/5" />
      <div className="p-3 space-y-2">
        <div className="h-3.5 bg-white/5 rounded w-3/4" />
        <div className="h-3 bg-white/5 rounded w-1/2" />
      </div>
    </div>
  );
}

// ─── Stream card ─────────────────────────────────────────────────────────────
function StreamCard({ stream }: { stream: UnifiedStream }) {
  const src = SOURCE_STYLES[stream.source];
  const initials = stream.displayName.substring(0, 2).toUpperCase();
  const href = stream.source === "twitch"
    ? `/stream/twitch-${stream.username}`
    : `/stream/${stream.username}`;

  return (
    <Link
      href={href}
      className="group block bg-wacke-darker rounded-2xl overflow-hidden border border-wacke-purple/10
                 hover:border-wacke-pink/40 hover:shadow-xl hover:shadow-wacke-pink/5
                 transition-all duration-200 hover:-translate-y-1"
    >
      {/* Thumbnail */}
      <div className="relative aspect-video bg-black overflow-hidden">
        {stream.thumbnailUrl ? (
          <img
            src={stream.thumbnailUrl}
            alt={stream.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-wacke-purple/40 via-wacke-pink/20 to-wacke-dark flex items-center justify-center">
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-wacke-pink to-wacke-purple flex items-center justify-center text-xl font-black text-white border border-white/10 shadow-xl">
              {initials}
            </div>
          </div>
        )}

        {/* LIVE badge */}
        <div className="absolute top-2 left-2 flex items-center space-x-1 bg-red-600 text-white text-[10px] font-extrabold px-2 py-0.5 rounded shadow-md">
          <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
          <span>LIVE</span>
        </div>

        {/* Viewer count */}
        <div className="absolute top-2 right-2 flex items-center space-x-1 bg-black/70 text-white text-[10px] font-bold px-2 py-0.5 rounded backdrop-blur-sm">
          <Users className="w-3 h-3 text-gray-300" />
          <span>{formatViewers(stream.viewerCount)}</span>
        </div>
      </div>

      {/* Info */}
      <div className="p-3">
        <div className="flex items-center space-x-2 mb-1.5">
          {stream.avatarUrl ? (
            <img src={stream.avatarUrl} alt={stream.displayName}
              className="w-7 h-7 rounded-full border border-wacke-purple/30 shrink-0 object-cover" />
          ) : (
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-wacke-pink to-wacke-purple flex items-center justify-center text-[10px] font-black text-white shrink-0">
              {initials}
            </div>
          )}
          <p className="text-sm font-bold text-white truncate group-hover:text-wacke-pink transition-colors flex-1">
            {stream.displayName}
          </p>
          {/* Source badge */}
          <span className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded border flex items-center space-x-1 shrink-0 ${src.bg}`}>
            <span className={`w-1 h-1 rounded-full ${src.dot}`} />
            <span>{src.label}</span>
          </span>
        </div>

        <p className="text-xs text-gray-400 line-clamp-2 leading-relaxed mb-2">
          {stream.title}
        </p>

        {stream.category && (
          <span className="text-[9px] font-bold px-2 py-0.5 rounded border bg-white/5 border-white/10 text-gray-400 uppercase tracking-wide">
            {stream.category}
          </span>
        )}
      </div>
    </Link>
  );
}

// ─── Tab button ───────────────────────────────────────────────────────────────
function Tab({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 rounded-xl text-xs font-extrabold border transition-all
                  ${active
                    ? "bg-wacke-purple/30 border-wacke-pink/50 text-white shadow-md"
                    : "border-transparent text-gray-500 hover:text-gray-300 hover:border-white/10"}`}
    >
      {children}
    </button>
  );
}

// ─── Main CombinedStreamGrid ─────────────────────────────────────────────────
interface CombinedStreamGridProps {
  limit?: number;
  title?: string;
}

export default function CombinedStreamGrid({
  limit = 20,
  title = "🔴 LIVE MAINTENANT",
}: CombinedStreamGridProps) {
  const [kickStreams,   setKickStreams]   = useState<UnifiedStream[]>([]);
  const [twitchStreams, setTwitchStreams] = useState<UnifiedStream[]>([]);
  const [loadingKick,   setLoadingKick]   = useState(true);
  const [loadingTwitch, setLoadingTwitch] = useState(true);
  const [activeTab, setActiveTab] = useState<"all" | "kick" | "twitch">("all");

  // Fetch Kick streams
  useEffect(() => {
    fetch(`/api/kick/livestreams?limit=${limit}`)
      .then((r) => r.json())
      .then((data) => {
        const unified: UnifiedStream[] = (data.streams ?? []).map((s: any) => ({
          id:          `kick-${s.id}`,
          source:      "kick" as const,
          username:    s.channel?.user?.username ?? s.slug,
          displayName: (s.channel?.user?.username ?? s.slug).charAt(0).toUpperCase() +
                       (s.channel?.user?.username ?? s.slug).slice(1),
          title:       s.session_title ?? "Live Stream",
          category:    s.categories?.[0]?.name ?? "Live",
          viewerCount: s.viewer_count ?? 0,
          thumbnailUrl: s.thumbnail?.src ?? null,
          avatarUrl:   s.channel?.profile_picture ?? s.channel?.user?.profile_pic ?? null,
          isLive:      true,
        }));
        setKickStreams(unified);
      })
      .catch(console.error)
      .finally(() => setLoadingKick(false));
  }, [limit]);

  // Fetch Twitch streams
  useEffect(() => {
    fetch(`/api/twitch/livestreams?limit=${limit}`)
      .then((r) => r.json())
      .then((data) => {
        const unified: UnifiedStream[] = (data.streams ?? []).map((s: any) => ({
          id:          `twitch-${s.id}`,
          source:      "twitch" as const,
          username:    s.user_login,
          displayName: s.user_name,
          title:       s.title ?? "Live Stream",
          category:    s.game_name ?? "Live",
          viewerCount: s.viewer_count ?? 0,
          thumbnailUrl: s.thumbnail_url ?? null,
          avatarUrl:   s.profile_image_url ?? null,
          isLive:      true,
        }));
        setTwitchStreams(unified);
      })
      .catch(console.error)
      .finally(() => setLoadingTwitch(false));
  }, [limit]);

  const loading = loadingKick && loadingTwitch;

  // Merge + sort by viewer count descending (memoized to avoid re-sort on tab change)
  const allStreams = useMemo(
    () => [...kickStreams, ...twitchStreams].sort((a, b) => b.viewerCount - a.viewerCount),
    [kickStreams, twitchStreams]
  );

  // Which array to show — respect per-source loading state
  const displayed = useMemo(() => {
    if (activeTab === "kick")   return kickStreams;
    if (activeTab === "twitch") return twitchStreams;
    return allStreams;
  }, [activeTab, kickStreams, twitchStreams, allStreams]);

  // Show skeletons if the active tab's data is still loading
  const tabLoading =
    (activeTab === "kick"   && loadingKick) ||
    (activeTab === "twitch" && loadingTwitch) ||
    (activeTab === "all"    && loading);

  return (
    <section>
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <h2 className="text-2xl font-black tracking-tight">
          <span className="neon-pink graffiti-text">{title}</span>
        </h2>

        <div className="flex items-center space-x-2">
          {/* Filter tabs */}
          <Tab active={activeTab === "all"}    onClick={() => setActiveTab("all")}>
            🌐 Tout ({allStreams.length})
          </Tab>
          <Tab active={activeTab === "kick"}   onClick={() => setActiveTab("kick")}>
            <span className="text-[#53fc18]">●</span> Kick ({kickStreams.length})
          </Tab>
          <Tab active={activeTab === "twitch"} onClick={() => setActiveTab("twitch")}>
            <span className="text-[#9146ff]">●</span> Twitch ({twitchStreams.length})
          </Tab>

          <Link href="/browse" className="text-sm text-wacke-cyan hover:underline ml-2">
            Voir tout →
          </Link>
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        {tabLoading
          ? Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)
          : displayed.map((stream) => <StreamCard key={stream.id} stream={stream} />)
        }
      </div>

      {!tabLoading && displayed.length === 0 && (
          <div className="text-4xl mb-3 flex justify-center"><Users className="w-12 h-12 opacity-50" /></div>
          <p>Aucun stream en direct pour le moment</p>
        </div>
      )}
    </section>
  );
}
