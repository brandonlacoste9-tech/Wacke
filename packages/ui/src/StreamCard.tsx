import React from "react";
import { LiveBadge } from "./LiveBadge";

interface StreamCardProps {
  playbackId?: string;
  title: string;
  streamerName: string;
  viewerCount: number;
  category: string;
  href: string;
}

export function StreamCard({
  playbackId,
  title,
  streamerName,
  viewerCount,
  category,
  href,
}: StreamCardProps) {
  const thumbnailUrl = playbackId
    ? (playbackId === "mock_playback_id"
        ? "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=640&q=80"
        : `https://image.mux.com/${playbackId}/thumbnail.jpg?width=640`)
    : null;


  return (
    <a
      href={href}
      className="block bg-wacke-darker rounded-xl overflow-hidden hover:scale-105
                 transition-transform cursor-pointer border border-wacke-purple/20
                 hover:border-wacke-pink/40 hover:shadow-[0_0_20px_rgba(255,20,147,0.2)]"
    >
      {/* Thumbnail */}
      <div className="aspect-video relative overflow-hidden">
        {thumbnailUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={thumbnailUrl}
            alt={title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-wacke-purple/40 to-wacke-cyan/40" />
        )}
        <div className="absolute top-2 left-2">
          <LiveBadge viewerCount={viewerCount} />
        </div>
      </div>

      {/* Info */}
      <div className="p-4">
        <p className="font-semibold text-sm text-white truncate">{title}</p>
        <p className="text-xs text-wacke-cyan mt-0.5">{streamerName}</p>
        <p className="text-xs text-gray-500 mt-0.5 capitalize">{category}</p>
      </div>
    </a>
  );
}
