import Link from "next/link";
import { Users } from "lucide-react";

interface StreamerCardProps {
  username: string;
  displayName: string;
  category: string;
  viewerCount: number;
  avatarUrl?: string | null;
  thumbnailUrl?: string | null;
  source?: "kick" | "twitch" | "wacke";
  isLive?: boolean;
}

const SOURCE_COLORS = {
  kick:   { bg: "bg-[#53fc18]/15", border: "border-[#53fc18]/30", text: "text-[#53fc18]", dot: "bg-[#53fc18]", label: "KICK" },
  twitch: { bg: "bg-[#9146ff]/15", border: "border-[#9146ff]/30", text: "text-[#9146ff]", dot: "bg-[#9146ff]", label: "TWITCH" },
  wacke:  { bg: "bg-wacke-pink/15", border: "border-wacke-pink/30", text: "text-wacke-pink", dot: "bg-wacke-pink", label: "WACKÉ" },
};

function formatViewers(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}

/**
 * StreamerCard — Reusable premium stream card with source badge,
 * live indicator, viewer count, and hover effects.
 */
export default function StreamerCard({
  username,
  displayName,
  category,
  viewerCount,
  avatarUrl,
  thumbnailUrl,
  source = "wacke",
  isLive = true,
}: StreamerCardProps) {
  const src = SOURCE_COLORS[source];
  const initials = displayName.substring(0, 2).toUpperCase();
  const href = source === "twitch"
    ? `/stream/twitch-${username}`
    : `/stream/${username}`;

  return (
    <Link
      href={href}
      className="group block glass-card rounded-2xl overflow-hidden
                 hover:border-wacke-pink/30 hover:shadow-xl hover:shadow-wacke-pink/5
                 transition-all duration-300 hover:-translate-y-1 card-glow"
    >
      {/* Thumbnail */}
      <div className="relative aspect-video bg-black overflow-hidden">
        {thumbnailUrl ? (
          <img
            src={thumbnailUrl}
            alt={displayName}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-wacke-purple/30 via-wacke-pink/10 to-wacke-dark flex items-center justify-center">
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-wacke-pink to-wacke-purple flex items-center justify-center text-xl font-black text-white border border-white/10 shadow-xl">
              {initials}
            </div>
          </div>
        )}

        {/* LIVE badge */}
        {isLive && (
          <div className="absolute top-2.5 left-2.5 flex items-center space-x-1 bg-red-600/90 text-white text-[10px] font-extrabold px-2 py-0.5 rounded-md shadow-md backdrop-blur-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
            <span>LIVE</span>
          </div>
        )}

        {/* Viewer count */}
        <div className="absolute top-2.5 right-2.5 flex items-center space-x-1 bg-black/60 text-white text-[10px] font-bold px-2 py-0.5 rounded-md backdrop-blur-sm">
          <Users className="w-3 h-3 text-gray-300" />
          <span>{formatViewers(viewerCount)}</span>
        </div>

        {/* Hover overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      </div>

      {/* Info */}
      <div className="p-3.5">
        <div className="flex items-center space-x-2.5 mb-2">
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt={displayName}
              className="w-8 h-8 rounded-full border border-wacke-purple/30 shrink-0 object-cover"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-wacke-pink to-wacke-purple flex items-center justify-center text-[10px] font-black text-white shrink-0 border border-white/10">
              {initials}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold text-white truncate group-hover:text-wacke-pink transition-colors">
              {displayName}
            </p>
            <p className="text-[10px] text-gray-500 capitalize truncate">
              {category}
            </p>
          </div>
          {/* Source badge */}
          <span className={`text-[8px] font-extrabold px-1.5 py-0.5 rounded border flex items-center space-x-1 shrink-0 ${src.bg} ${src.border} ${src.text}`}>
            <span className={`w-1 h-1 rounded-full ${src.dot}`} />
            <span>{src.label}</span>
          </span>
        </div>
      </div>
    </Link>
  );
}
