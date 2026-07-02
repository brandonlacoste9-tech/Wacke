"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { TrendingUp } from "lucide-react";

interface TwitchGame {
  id: string;
  name: string;
  box_art_url: string;
  viewer_count?: number;
}

export default function TrendingGames() {
  const [games, setGames] = useState<TwitchGame[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/twitch/top-games?limit=10")
      .then((r) => r.json())
      .then((data) => {
        const gs = (data.games ?? []).map((g: any) => {
          const rawUrl = g.boxArtUrl ?? g.box_art_url ?? "";
          const box_art_url = rawUrl.includes("{width}")
            ? rawUrl.replace("{width}", "285").replace("{height}", "380")
            : rawUrl;
          return {
            id: g.id,
            name: g.name,
            box_art_url,
          };
        });
        setGames(gs);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <section>
        <h2 className="text-2xl font-bold mb-5 flex items-center space-x-2">
          <TrendingUp className="w-5 h-5 text-wacke-cyan" />
          <span className="neon-cyan graffiti-text">TENDANCES</span>
        </h2>
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-3">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="glass-card rounded-xl overflow-hidden animate-pulse">
              <div className="aspect-[3/4] bg-white/3" />
              <div className="p-2 space-y-1.5">
                <div className="h-3 bg-white/3 rounded w-3/4" />
              </div>
            </div>
          ))}
        </div>
      </section>
    );
  }

  if (games.length === 0) return null;

  return (
    <section>
      <h2 className="text-2xl font-bold mb-5 flex items-center space-x-2">
        <TrendingUp className="w-5 h-5 text-wacke-cyan drop-shadow-[0_0_5px_rgba(0,255,255,0.6)]" />
        <span className="neon-cyan graffiti-text">TENDANCES</span>
      </h2>

      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-3 stagger-children">
        {games.map((game, i) => (
          <Link
            key={game.id}
            href={`/browse?search=${encodeURIComponent(game.name)}`}
            className="group glass-card rounded-xl overflow-hidden
                       hover:border-wacke-cyan/30 hover:-translate-y-1
                       transition-all duration-300 card-glow"
          >
            <div className="aspect-[3/4] bg-black overflow-hidden relative">
              {game.box_art_url ? (
                <img
                  src={game.box_art_url}
                  alt={game.name}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  loading="lazy"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-wacke-purple/30 to-wacke-dark flex items-center justify-center">
                  <span className="text-2xl">🎮</span>
                </div>
              )}

              {/* Hover overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-2">
                <span className="text-[9px] font-bold text-wacke-cyan">Voir les streams →</span>
              </div>
            </div>

            <div className="p-2">
              <p className="text-[10px] font-bold text-gray-300 truncate group-hover:text-white transition-colors">
                {game.name}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
