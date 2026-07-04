"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useLanguage } from "./LanguageProvider";

interface KickStream {
  id: string;
  slug: string;
  session_title: string;
  viewer_count: number;
  categories: Array<{ name: string; slug: string }>;
  thumbnail?: { src?: string } | null;
  channel: {
    slug: string;
    profile_picture?: string | null;
    user: {
      username: string;
      profile_pic?: string | null;
    };
  };
}

function formatViewers(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}

export default function KickFeaturedCarousel() {
  const { t } = useLanguage();
  const [streams, setStreams] = useState<KickStream[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    fetch("/api/kick/livestreams?limit=8")
      .then((r) => r.json())
      .then((data) => {
        const valid = (data.streams ?? []).filter(
          (s: KickStream) => s?.channel?.user?.username || s?.slug
        );
        setStreams(valid);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  // Auto-rotate carousel every 12 seconds with progress tracking
  useEffect(() => {
    if (streams.length <= 1) return;
    setProgress(0);

    const progressInterval = setInterval(() => {
      setProgress((p) => Math.min(p + 100 / 120, 100));
    }, 100);

    const timer = setInterval(() => {
      setActiveIndex((i) => (i + 1) % Math.min(streams.length, 6));
      setProgress(0);
    }, 12000);

    return () => {
      clearInterval(timer);
      clearInterval(progressInterval);
    };
  }, [streams.length, activeIndex]);

  // Keyboard navigation
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (streams.length === 0) return;
      if (e.key === "ArrowRight") {
        setActiveIndex((i) => (i + 1) % Math.min(streams.length, 6));
        setProgress(0);
      }
      if (e.key === "ArrowLeft") {
        setActiveIndex((i) => (i - 1 + Math.min(streams.length, 6)) % Math.min(streams.length, 6));
        setProgress(0);
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [streams.length]);

  if (loading) {
    return (
      <div className="flex flex-col lg:flex-row gap-4 glass-card rounded-2xl p-4 mb-4 animate-pulse">
        <div className="flex-1 aspect-video bg-white/3 rounded-xl" />
        <div className="w-full lg:w-72 space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-14 bg-white/3 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (streams.length === 0) return null;

  const current = streams[activeIndex];
  if (!current) return null;

  const username = current.channel?.user?.username ?? current.slug;
  const displayName = username.charAt(0).toUpperCase() + username.slice(1);
  const avatar = (current as any).profile_picture ?? current.channel?.profile_picture ?? current.channel?.user?.profile_pic ?? null;
  const category = (current as any).category?.name ?? current.categories?.[0]?.name ?? "Live";
  const title = (current as any).stream_title ?? current.session_title ?? "Live Stream";

  return (
    <div className="flex flex-col lg:flex-row gap-4 glass-card rounded-2xl p-4 shadow-2xl relative overflow-hidden select-none mb-4">

      {/* ── Progress bar ─────────────────────────────────────────────────── */}
      <div className="absolute top-0 left-0 right-0 h-0.5 bg-white/5 z-30">
        <div
          className="h-full bg-gradient-to-r from-wacke-pink to-wacke-cyan transition-all duration-100 ease-linear"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* ── Main Player ─────────────────────────────────────────────────── */}
      <div className="flex-1 aspect-video relative rounded-xl overflow-hidden bg-black border border-wacke-purple/10">
        <iframe
          key={username}
          src={`https://player.kick.com/${username}?autoplay=true&muted=true`}
          className="w-full h-full border-0"
          scrolling="no"
          allowFullScreen
        />

        {/* Info overlay */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent p-5 flex flex-col justify-end pointer-events-none">
          <div className="flex items-center space-x-3 pointer-events-auto">
            {avatar ? (
              <img
                src={avatar}
                alt={displayName}
                className="w-10 h-10 rounded-full border-2 border-wacke-pink/40 object-cover shadow-lg"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-wacke-pink to-wacke-purple flex items-center justify-center text-sm font-black text-white uppercase shadow-lg border border-white/10">
                {displayName.substring(0, 2)}
              </div>
            )}
            <div>
              <p className="font-bold text-white text-base truncate drop-shadow-md">{displayName}</p>
              <p className="text-xs text-wacke-cyan font-medium drop-shadow-md">{category}</p>
            </div>
            <div className="ml-auto flex items-center space-x-1 bg-black/50 border border-white/10 text-white text-xs font-bold px-2.5 py-1 rounded-xl backdrop-blur-sm emoji">
              👀 <span>{formatViewers(current.viewer_count)}</span>
            </div>
          </div>

          <p className="text-sm text-gray-200 mt-2 line-clamp-1 drop-shadow-md font-medium">
            {title}
          </p>

          <div className="mt-3 flex items-center space-x-3 pointer-events-auto">
            <Link
              href={`/stream/${username}`}
              className="bg-wacke-green hover:brightness-110 text-black font-extrabold text-xs px-5 py-2 rounded-xl transition-all duration-200 hover:scale-105 shadow-lg shadow-wacke-green/20"
            >
              {t("watchLive")}
            </Link>
            <div className="flex items-center space-x-1 bg-red-600/90 text-white text-[10px] font-bold px-2.5 py-1 rounded-lg shadow-md backdrop-blur-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
              <span>LIVE</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Sidebar selector ────────────────────────────────────────────── */}
      <div className="w-full lg:w-80 flex flex-col gap-1.5 overflow-y-auto max-h-[360px] lg:max-h-none scrollbar-hide">
        <h2 className="text-[10px] font-extrabold text-gray-600 uppercase tracking-widest mb-1 px-2">
          {t("featuredOn")}
        </h2>
        {streams.slice(0, 6).map((stream, idx) => {
          if (!stream) return null;
          const uname = stream.channel?.user?.username ?? stream.slug;
          const dname = uname.charAt(0).toUpperCase() + uname.slice(1);
          const ava = (stream as any).profile_picture ?? stream.channel?.profile_picture ?? stream.channel?.user?.profile_pic ?? null;
          const streamTitle = (stream as any).stream_title ?? stream.session_title ?? "Live Stream";
          const isActive = idx === activeIndex;

          return (
            <button
              key={stream.id}
              onClick={() => { setActiveIndex(idx); setProgress(0); }}
              className={`flex items-center space-x-3 p-2.5 rounded-xl transition-all border text-left group
                         ${isActive
                           ? "bg-wacke-purple/15 border-wacke-pink/30 shadow-lg shadow-wacke-pink/5"
                           : "bg-transparent border-transparent hover:bg-white/3 hover:border-wacke-purple/20"}`}
            >
              {ava ? (
                <img
                  src={ava}
                  alt={dname}
                  className={`w-9 h-9 rounded-xl object-cover shrink-0 border ${isActive ? "border-wacke-pink/40" : "border-white/5"}`}
                />
              ) : (
                <div className={`w-9 h-9 rounded-xl bg-gradient-to-br from-wacke-pink to-wacke-purple flex items-center justify-center text-[10px] font-black text-white uppercase shrink-0 border ${isActive ? "border-wacke-pink/40" : "border-white/5"}`}>
                  {dname.substring(0, 2)}
                </div>
              )}

              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between mb-0.5">
                  <p className={`text-xs font-bold truncate ${isActive ? "text-wacke-pink" : "text-gray-300 group-hover:text-white"}`}>
                    {dname}
                  </p>
                  <span className="text-[9px] text-gray-600 ml-1 shrink-0">
                    👁 {formatViewers(stream.viewer_count)}
                  </span>
                </div>
                <p className="text-[10px] text-gray-600 truncate line-clamp-1">
                  {streamTitle}
                </p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Pagination dots (mobile) */}
      {streams.length > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex space-x-1.5 lg:hidden">
          {streams.slice(0, 6).map((_, i) => (
            <button
              key={i}
              onClick={() => { setActiveIndex(i); setProgress(0); }}
              className={`h-1.5 rounded-full transition-all ${i === activeIndex ? "bg-wacke-pink w-5" : "bg-white/20 w-1.5"}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
