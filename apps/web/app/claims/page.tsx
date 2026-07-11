import Link from "next/link";
import { RESERVED_USERNAMES, getHoldHoursRemaining } from "@wacke/db";
import { Clock, Sparkles } from "lucide-react";
import { cookies } from "next/headers";

export const metadata = {
  title: "Reserved Handles | Wacké",
  description: "Recently reserved @handles on Wacké. Claim yours before someone snipes it.",
};

export default function ClaimsPage() {
  const cookieStore = cookies();
  const isEn = cookieStore.get("wacke_lang")?.value !== "fr";

  const reserved = RESERVED_USERNAMES.filter((r) => r.status === "reserved");
  const held = RESERVED_USERNAMES.filter((r) => r.status === "held");
  const claimed = RESERVED_USERNAMES.filter((r) => r.status === "claimed");

  return (
    <main className="min-h-screen bg-wacke-dark px-6 lg:px-8 py-12 max-w-4xl mx-auto">
      <div className="mb-10">
        <div className="flex items-center space-x-2 mb-3">
          <Sparkles className="w-5 h-5 text-wacke-pink" />
          <h1 className="text-3xl md:text-4xl font-black gradient-text-cyber font-display">
            {isEn ? "Reserved Handles" : "Handles réservés"}
          </h1>
        </div>
        <p className="text-gray-400 text-sm max-w-xl">
          {isEn
            ? "These @handles are held for invited creators. Claim yours before the hold expires."
            : "Ces @handles sont réservés pour les créateurs invités. Réclame le tien avant expiration."}
        </p>
      </div>

      <section className="mb-10">
        <h2 className="text-sm font-bold uppercase tracking-wider text-wacke-cyan mb-4">
          {isEn ? "Available to claim" : "Disponibles"} ({reserved.length})
        </h2>
        <div className="grid gap-3">
          {reserved.map((r) => {
            const hours = getHoldHoursRemaining(r);
            return (
              <Link
                key={r.username}
                href={`/${r.username}`}
                className="flex items-center justify-between glass-card rounded-xl px-5 py-4 border border-wacke-pink/20 hover:border-wacke-pink/40 transition-all hover:-translate-y-0.5"
              >
                <div>
                  <p className="font-black text-white">@{r.username}</p>
                  <p className="text-xs text-gray-400">{r.displayName} · {r.platform}</p>
                </div>
                <div className="flex items-center space-x-1 text-amber-400 text-xs font-bold">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{hours}h</span>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {held.length > 0 && (
        <section className="mb-10">
          <h2 className="text-sm font-bold uppercase tracking-wider text-amber-400 mb-4">
            {isEn ? "On hold" : "En attente"} ({held.length})
          </h2>
          <div className="grid gap-3">
            {held.map((r) => (
              <div key={r.username} className="glass-card rounded-xl px-5 py-4 border border-amber-500/20 opacity-60">
                <p className="font-black text-white">@{r.username}</p>
                <p className="text-xs text-gray-400">{r.displayName}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {claimed.length > 0 && (
        <section>
          <h2 className="text-sm font-bold uppercase tracking-wider text-green-400 mb-4">
            {isEn ? "Claimed" : "Réclamés"} ({claimed.length})
          </h2>
          <div className="grid gap-3">
            {claimed.map((r) => (
              <Link
                key={r.username}
                href={`/profile/${r.username}`}
                className="glass-card rounded-xl px-5 py-4 border border-green-500/20 hover:border-green-500/40 transition-all"
              >
                <p className="font-black text-white">@{r.username}</p>
                <p className="text-xs text-gray-400">{r.displayName}</p>
              </Link>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}