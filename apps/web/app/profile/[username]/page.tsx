import { notFound } from "next/navigation";
import Link from "next/link";
import { getUserByUsername, getStreamByUserId, getFollowerCount } from "@wacke/db";
import GrokRoastButton from "@/components/GrokRoastButton";

export const dynamic = "force-dynamic";

interface ProfilePageProps {
  params: { username: string };
}

export async function generateMetadata({ params }: ProfilePageProps) {
  const user = await getUserByUsername(params.username);
  if (!user) return { title: "Profil introuvable — Wacké" };
  return {
    title: `${user.displayName} — Profil | Wacké`,
    description: user.bio ?? `Regarde le profil de ${user.displayName} sur Wacké`,
  };
}

export default async function ProfilePage({ params }: ProfilePageProps) {
  const user = await getUserByUsername(params.username);
  if (!user) notFound();

  const stream = await getStreamByUserId(user.id);
  const followers = await getFollowerCount(user.id);
  const isLive = stream?.status === "live";
  const initials = user.displayName.substring(0, 2).toUpperCase();

  return (
    <div className="max-w-4xl mx-auto px-6 py-12 min-h-screen">
      {/* ── Profile Header ──────────────────────────────────────────────── */}
      <div className="glass-card rounded-3xl p-8 mb-8">
        <div className="flex items-center space-x-6">
          {/* Avatar */}
          {user.avatarUrl ? (
            <img
              src={user.avatarUrl}
              alt={user.displayName}
              className="w-24 h-24 rounded-2xl object-cover border-2 border-wacke-pink/40 shadow-xl"
            />
          ) : (
            <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-wacke-pink to-wacke-purple flex items-center justify-center text-3xl font-black text-white border-2 border-white/10 shadow-xl">
              {initials}
            </div>
          )}

          <div className="flex-1">
            <div className="flex items-center space-x-3 mb-1">
              <h1 className="text-3xl font-black text-white">{user.displayName}</h1>
              {isLive && (
                <Link href={`/stream/${user.username}`} className="flex items-center space-x-1 bg-red-600/80 text-white text-[10px] font-bold px-2.5 py-1 rounded-full animate-pulse">
                  <span className="w-1.5 h-1.5 rounded-full bg-white" />
                  <span>LIVE</span>
                </Link>
              )}
            </div>
            <p className="text-sm text-gray-500 mb-3">@{user.username}</p>

            {/* Stats */}
            <div className="flex items-center space-x-6">
              <div>
                <p className="text-lg font-bold text-white">{followers}</p>
                <p className="text-[10px] text-gray-500 uppercase tracking-wider">Abonnés</p>
              </div>
              <div>
                <p className="text-lg font-bold text-wacke-gold">{(user.tokenBalance ?? 0).toLocaleString("fr-CA")}</p>
                <p className="text-[10px] text-gray-500 uppercase tracking-wider">Jetons</p>
              </div>
              {stream && (
                <div>
                  <p className="text-lg font-bold text-white">{stream.viewerCount?.toLocaleString("fr-CA") ?? 0}</p>
                  <p className="text-[10px] text-gray-500 uppercase tracking-wider">Spectateurs</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Bio */}
        {user.bio && (
          <p className="mt-6 text-sm text-gray-300 leading-relaxed border-t border-wacke-purple/15 pt-5">
            {user.bio}
          </p>
        )}

        <GrokRoastButton username={user.username} />
      </div>

      {/* ── Current/Last Stream ──────────────────────────────────────────── */}
      {stream && (
        <div className="glass-card rounded-2xl p-6 mb-8">
          <h2 className="text-lg font-bold text-white mb-4 flex items-center space-x-2">
            <span>📺</span>
            <span>{isLive ? "Stream en cours" : "Dernier stream"}</span>
          </h2>

          <Link
            href={`/stream/${user.username}`}
            className="block group"
          >
            <div className="flex items-center space-x-4">
              <div className="w-32 h-20 rounded-xl bg-gradient-to-br from-wacke-purple/30 to-wacke-dark flex items-center justify-center border border-wacke-purple/20 shrink-0 overflow-hidden">
                {isLive ? (
                  <span className="text-2xl group-hover:scale-110 transition-transform">🔴</span>
                ) : (
                  <span className="text-2xl group-hover:scale-110 transition-transform">⏸️</span>
                )}
              </div>
              <div>
                <p className="font-bold text-white group-hover:text-wacke-pink transition-colors">
                  {stream.title}
                </p>
                <p className="text-xs text-gray-500 capitalize mt-1">{stream.category}</p>
                {isLive && (
                  <p className="text-xs text-wacke-cyan font-bold mt-2">
                    👁 {(stream.viewerCount ?? 0).toLocaleString("fr-CA")} spectateurs
                  </p>
                )}
              </div>
            </div>
          </Link>
        </div>
      )}

      {/* ── Actions ─────────────────────────────────────────────────────── */}
      <div className="flex items-center space-x-4">
        {isLive && (
          <Link
            href={`/stream/${user.username}`}
            className="bg-gradient-to-r from-wacke-pink to-wacke-purple px-6 py-3 rounded-xl font-bold text-sm hover:opacity-90 transition-all hover:scale-105 shadow-lg shadow-wacke-pink/20"
          >
            🔴 Regarder le live
          </Link>
        )}
        <Link
          href="/"
          className="bg-white/3 hover:bg-white/5 border border-wacke-purple/20 px-6 py-3 rounded-xl font-bold text-sm text-gray-300 hover:text-white transition-all"
        >
          ← Retour à l&apos;accueil
        </Link>
      </div>
    </div>
  );
}
