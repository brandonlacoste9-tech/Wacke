"use client";

import { useState } from "react";
import Link from "next/link";

interface Stream {
  id: string;
  userId: string;
  title: string;
  category: string;
  viewerCount: number;
  user: {
    username: string;
    displayName: string;
    avatarUrl: string | null;
  } | null;
}

interface FeaturedCarouselProps {
  streams: Stream[];
}

export default function FeaturedCarousel({ streams }: FeaturedCarouselProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  
  if (streams.length === 0) return null;
  
  const currentStream = streams[activeIndex];
  if (!currentStream || !currentStream.user) return null;

  return (
    <div className="flex flex-col lg:flex-row gap-4 glass-card border border-wacke-purple/20 rounded-2xl p-4 shadow-2xl relative overflow-hidden select-none mb-4">
      {/* Large Player Embed */}
      <div className="flex-1 aspect-video relative rounded-xl overflow-hidden bg-black border border-wacke-purple/10">
        <iframe
          src={`https://player.kick.com/${currentStream.user.username}?autoplay=true&muted=true`}
          className="w-full h-full border-0"
          scrolling="no"
          allowFullScreen
        />
        
        {/* Info Overlay */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent p-6 flex flex-col justify-end pointer-events-none">
          <div className="flex items-center space-x-3 pointer-events-auto">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-wacke-pink to-wacke-purple flex items-center justify-center text-sm font-bold text-white uppercase shadow-lg border border-white/10">
              {currentStream.user.displayName[0]}
            </div>
            <div>
              <p className="font-bold text-white text-base truncate drop-shadow-md">
                {currentStream.user.displayName}
              </p>
              <p className="text-xs text-wacke-cyan font-semibold drop-shadow-md capitalize">
                {currentStream.category}
              </p>
            </div>
          </div>
          <p className="text-sm text-gray-200 mt-2 line-clamp-1 drop-shadow-md font-medium">
            {currentStream.title}
          </p>
          <div className="mt-4 flex items-center justify-between pointer-events-auto">
            <Link
              href={`/stream/${currentStream.user.username}`}
              className="bg-[#53fc18] hover:bg-[#45d414] text-black font-extrabold text-xs px-4 py-2 rounded-xl transition-all duration-200 hover:scale-105"
            >
              Regarder Live 🟢
            </Link>
            <div className="flex items-center space-x-1 bg-red-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-md shadow-md animate-pulse">
              <span className="w-1.5 h-1.5 rounded-full bg-white" />
              <span>LIVE</span>
            </div>
          </div>
        </div>
      </div>

      {/* Side Select Column */}
      <div className="w-full lg:w-80 flex flex-col gap-2 overflow-y-auto max-h-[360px] lg:max-h-[450px]">
        <h2 className="text-xs font-extrabold text-gray-500 uppercase tracking-wider mb-2 px-2">
          À l'affiche sur Wacké
        </h2>
        {streams.slice(0, 5).map((stream, idx) => {
          if (!stream.user) return null;
          const isActive = idx === activeIndex;
          return (
            <button
              key={stream.id}
              onClick={() => setActiveIndex(idx)}
              className={`flex items-center space-x-3 p-3 rounded-xl transition-all border text-left
                         ${isActive 
                           ? "bg-wacke-purple/20 border-wacke-pink/40 shadow-md scale-[1.02]" 
                           : "bg-wacke-dark/20 border-transparent hover:bg-wacke-dark/40"}`}
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-wacke-pink to-wacke-purple flex items-center justify-center text-sm font-bold text-white uppercase shrink-0 border border-white/5 shadow-inner">
                {stream.user.displayName[0]}
              </div>
              <div className="min-w-0 flex-1">
                <p className={`text-xs font-bold truncate ${isActive ? "text-wacke-pink" : "text-gray-300"}`}>
                  {stream.user.displayName}
                </p>
                <p className="text-[10px] text-gray-500 truncate mt-0.5 line-clamp-1">
                  {stream.title}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
