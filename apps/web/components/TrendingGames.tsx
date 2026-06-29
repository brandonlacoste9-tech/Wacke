"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface GameData {
  id: string;
  name: string;
  boxArtUrl: string | null;
}

export default function TrendingGames() {
  const [games, setGames] = useState<GameData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/twitch/top-games?limit=6")
      .then((r) => r.json())
      .then((data) => setGames(data.games ?? []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <section className="mt-4">
        <h2 className="text-2xl font-bold mb-6">
          🎮 <span className="neon-cyan graffiti-text">CATÉGORIES POPULAIRES (TWITCH)</span>
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="aspect-[3/4] bg-wacke-darker/60 rounded-xl border border-wacke-purple/10 animate-pulse flex flex-col justify-end p-4">
              <div className="h-4 bg-white/5 rounded w-3/4 mb-2" />
            </div>
          ))}
        </div>
      </section>
    );
  }

  if (games.length === 0) return null;

  return (
    <section className="mt-4">
      <h2 className="text-2xl font-bold mb-6">
        🎮 <span className="neon-cyan graffiti-text">CATÉGORIES POPULAIRES (TWITCH)</span>
      </h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
        {games.map((game) => (
          <Link
            key={game.id}
            href={`/browse?search=${encodeURIComponent(game.name)}`}
            className="group relative aspect-[3/4] rounded-xl overflow-hidden border border-wacke-purple/20 bg-wacke-darker hover:border-wacke-cyan/40 hover:shadow-lg hover:shadow-wacke-cyan/5 transition-all duration-200 hover:-translate-y-1"
          >
            {/* Box Art */}
            {game.boxArtUrl ? (
              <img
                src={game.boxArtUrl}
                alt={game.name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                loading="lazy"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-wacke-dark via-wacke-purple/10 to-wacke-darker flex items-center justify-center p-4 text-center">
                <span className="text-xs font-bold text-gray-400">{game.name}</span>
              </div>
            )}

            {/* Title Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent flex flex-col justify-end p-3 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              <p className="text-xs font-black text-white truncate drop-shadow-md">{game.name}</p>
              <p className="text-[9px] font-bold text-wacke-cyan uppercase tracking-wider mt-0.5">Explorer →</p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
