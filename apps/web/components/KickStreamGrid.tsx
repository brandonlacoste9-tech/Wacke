"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";

interface KickStream {
  id: string;
  slug: string;
  session_title: string;
  viewer_count: number;
  language: string;
  is_mature: boolean;
  categories: Array<{ name: string; slug: string }>;
  thumbnail?: { src?: string } | null;
  channel: {
    slug: string;
    profile_picture?: string | null;
    banner_picture?: string | null;
    user: {
      username: string;
      profile_pic?: string | null;
    };
  };
}

interface KickStreamGridProps {
  /** How many streams to fetch */
  limit?: number;
  /** Optional category slug filter */
  category?: string;
  /** Title shown above the grid */
  title?: string;
  /** Number of columns on large screens */
  columns?: 3 | 4;
}

// ─── Viewer count formatter ──────────────────────────────────────────────────
function formatViewers(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}

// ─── Color for category badge ────────────────────────────────────────────────
const CATEGORY_COLORS: Record<string, string> = {
  gaming: "bg-green-500/20 text-green-400 border-green-500/30",
  slots: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  irl: "bg-orange-500/20 text-orange-400 border-orange-500/30",
  talk: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  music: "bg-pink-500/20 text-pink-400 border-pink-500/30",
};

function categoryColor(slug: string): string {
  return CATEGORY_COLORS[slug] ?? "bg-purple-500/20 text-purple-400 border-purple-500/30";
}

// ─── Skeleton card ───────────────────────────────────────────────────────────
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

// ─── Single stream card ──────────────────────────────────────────────────────
function StreamCard({ stream }: { stream: KickStream }) {
  const username = stream.channel?.user?.username ?? stream.slug;
  const displayName = username.charAt(0).toUpperCase() + username.slice(1);
  const thumbnail = typeof stream.thumbnail === "string" ? stream.thumbnail : stream.thumbnail?.src ?? stream.channel?.banner_picture ?? null;
  const avatar = (stream as any).profile_picture ?? stream.channel?.profile_picture ?? stream.channel?.user?.profile_pic ?? null;
  const mainCategoryName = (stream as any).category?.name ?? stream.categories?.[0]?.name ?? "Live";
  const mainCategorySlug = (stream as any).category?.slug ?? stream.categories?.[0]?.slug ?? "live";
  const title = (stream as any).stream_title ?? stream.session_title ?? "Live Stream";
  const initials = displayName.substring(0, 2).toUpperCase();

  return (
    <Link
      href={`/stream/${username}`}
      className="group block bg-wacke-darker rounded-2xl overflow-hidden border border-wacke-purple/10
                 hover:border-wacke-pink/40 hover:shadow-lg hover:shadow-wacke-pink/5
                 transition-all duration-200 hover:-translate-y-1"
    >
      {/* Thumbnail */}
      <div className="relative aspect-video bg-black overflow-hidden">
        {thumbnail ? (
          <img
            src={thumbnail}
            alt={title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />
        ) : (
          /* Gradient placeholder when no real thumbnail is available */
          <div className="w-full h-full bg-gradient-to-br from-wacke-purple/40 via-wacke-pink/20 to-wacke-dark flex items-center justify-center">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-wacke-pink to-wacke-purple flex items-center justify-center text-2xl font-black text-white border border-white/10 shadow-xl">
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
        <div className="absolute top-2 right-2 flex items-center space-x-1 bg-black/70 text-white text-[10px] font-bold px-2 py-0.5 rounded">
          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
            <path d="M10 12a2 2 0 100-4 2 2 0 000 4z"/>
            <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd"/>
          </svg>
          <span>{formatViewers(stream.viewer_count)}</span>
        </div>
      </div>

      {/* Info */}
      <div className="p-3">
        <div className="flex items-center space-x-2 mb-1.5">
          {/* Avatar */}
          {avatar ? (
            <img
              src={avatar}
              alt={displayName}
              className="w-7 h-7 rounded-full border border-wacke-purple/30 shrink-0 object-cover"
            />
          ) : (
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-wacke-pink to-wacke-purple flex items-center justify-center text-[10px] font-black text-white shrink-0">
              {initials}
            </div>
          )}
          <p className="text-sm font-bold text-white truncate group-hover:text-wacke-pink transition-colors">
            {displayName}
          </p>
        </div>

        <p className="text-xs text-gray-400 line-clamp-2 leading-relaxed mb-2">
          {title}
        </p>

        {mainCategoryName && (
          <span className={`text-[9px] font-bold px-2 py-0.5 rounded border uppercase tracking-wide ${categoryColor(mainCategorySlug)}`}>
            {mainCategoryName}
          </span>
        )}
      </div>
    </Link>
  );
}

// ─── Main KickStreamGrid component ──────────────────────────────────────────
export default function KickStreamGrid({
  limit = 20,
  category,
  title = "🔴 LIVES DU MOMENT",
  columns = 4,
}: KickStreamGridProps) {
  const [streams, setStreams] = useState<KickStream[]>([]);
  const [loading, setLoading] = useState(true);
  const [source, setSource] = useState<"kick" | "fallback" | "error">("fallback");

  useEffect(() => {
    const url = `/api/kick/livestreams?limit=${limit}${category ? `&category=${category}` : ""}`;
    fetch(url)
      .then((r) => r.json())
      .then((data) => {
        setStreams(data.streams ?? []);
        setSource(data.source ?? "fallback");
      })
      .catch(() => setSource("error"))
      .finally(() => setLoading(false));
  }, [limit, category]);

  const colClass = columns === 4
    ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
    : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3";

  return (
    <section>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-black tracking-tight">
          <span className="neon-pink graffiti-text">{title}</span>
        </h2>
        <div className="flex items-center space-x-3">
          {source === "kick" && (
            <span className="flex items-center space-x-1 text-[10px] font-bold text-green-400 bg-green-500/10 border border-green-500/20 px-2 py-1 rounded-lg">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
              <span>Kick API Live</span>
            </span>
          )}
          <Link href="/browse" className="text-sm text-wacke-cyan hover:underline">
            Voir tout →
          </Link>
        </div>
      </div>

      <div className={`grid ${colClass} gap-5`}>
        {loading
          ? Array.from({ length: limit > 8 ? 8 : limit }).map((_, i) => <SkeletonCard key={i} />)
          : streams.map((stream) => <StreamCard key={stream.id} stream={stream} />)}
      </div>

      {!loading && streams.length === 0 && (
        <div className="text-center py-20 text-gray-500">
          <p className="text-4xl mb-3">😴</p>
          <p>Aucun stream en direct pour le moment</p>
        </div>
      )}
    </section>
  );
}
