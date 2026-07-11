"use client";

import Link from "next/link";
import { MapPin } from "lucide-react";
import { useLanguage } from "./LanguageProvider";
import type { UnifiedStream } from "@/lib/stream-aggregator";

function formatViewers(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}

interface QuebecLiveRowProps {
  streams: UnifiedStream[];
}

export default function QuebecLiveRow({ streams }: QuebecLiveRowProps) {
  const { t } = useLanguage();

  const frStreams = streams
    .filter((s) => s.isLive && !s.isFallback && (s.language === "fr" || s.language?.startsWith("fr")))
    .slice(0, 8);

  if (frStreams.length === 0) return null;

  return (
    <section className="px-6 lg:px-8 pb-8 max-w-7xl mx-auto">
      <h2 className="text-xl font-black mb-4 flex items-center space-x-2 text-white">
        <MapPin className="w-5 h-5 text-wacke-pink" />
        <span className="gradient-text-cyber">{t("quebecLive")}</span>
      </h2>
      <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-thin">
        {frStreams.map((stream) => {
          const href = stream.source === "twitch"
            ? `/stream/twitch-${stream.username}`
            : `/stream/${stream.username}`;
          return (
            <Link
              key={stream.id}
              href={href}
              className="shrink-0 w-48 glass-card rounded-xl overflow-hidden hover:border-wacke-pink/30 transition-all hover:-translate-y-0.5"
            >
              <div className="relative aspect-video bg-black">
                {stream.thumbnailUrl ? (
                  <img src={stream.thumbnailUrl} alt="" className="w-full h-full object-cover" loading="lazy" />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-wacke-purple/40 to-wacke-dark" />
                )}
                <div className="absolute top-1.5 left-1.5 bg-red-600/90 text-white text-[8px] font-bold px-1.5 py-0.5 rounded">
                  LIVE
                </div>
                <div className="absolute bottom-1.5 right-1.5 text-[9px] font-bold text-white bg-black/60 px-1.5 rounded">
                  {formatViewers(stream.viewerCount)}
                </div>
              </div>
              <div className="p-2.5">
                <p className="text-xs font-bold text-white truncate">{stream.displayName}</p>
                <p className="text-[10px] text-gray-500 truncate">{stream.title}</p>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}