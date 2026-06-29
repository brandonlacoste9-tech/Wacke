import { getLiveStreams, TOP_KICK_STREAMERS } from "@wacke/db";
import Link from "next/link";

export const dynamic = "force-dynamic";

/**
 * Wacké Navigation & Recommended Sidebar
 * Displays top navigation links and live channels list, matching Kick's sidebar layout.
 */
export default async function Sidebar() {
  let liveChannels = [];
  try {
    liveChannels = await getLiveStreams(5);
  } catch (err) {
    console.error("[SIDEBAR_FETCH_ERROR]", err);
  }

  // Fallback channels to display if database has no active live streams
  const fallbackChannels = TOP_KICK_STREAMERS.slice(0, 5).map((username, index) => ({
    username,
    displayName: username.charAt(0).toUpperCase() + username.slice(1),
    category: index % 2 === 0 ? "gaming" : "talk",
    viewerCount: 12500 - index * 1800,
    isMock: true,
  }));

  const channelsToRender = liveChannels.length > 0
    ? liveChannels.map((c) => ({
        username: c.user?.username ?? "user",
        displayName: c.user?.displayName ?? "Streamer",
        category: c.category,
        viewerCount: c.viewerCount,
        isMock: false,
      }))
    : fallbackChannels;

  return (
    <aside className="w-64 bg-wacke-darker border-r border-wacke-purple/20 h-[calc(100vh-64px)] hidden lg:flex flex-col justify-between shrink-0 select-none">
      
      {/* ── Top Navigation Links ────────────────────────────────────────── */}
      <div className="p-4 space-y-1">
        <Link
          href="/"
          className="flex items-center space-x-3 px-3 py-2.5 rounded-xl text-sm font-bold text-gray-300 hover:text-white hover:bg-wacke-dark/40 transition-colors"
        >
          <span>🏠</span>
          <span>Accueil</span>
        </Link>
        <Link
          href="/browse"
          className="flex items-center space-x-3 px-3 py-2.5 rounded-xl text-sm font-bold text-gray-300 hover:text-white hover:bg-wacke-dark/40 transition-colors"
        >
          <span>🎨</span>
          <span>Parcourir</span>
        </Link>
        <Link
          href="/dashboard/stream"
          className="flex items-center space-x-3 px-3 py-2.5 rounded-xl text-sm font-bold text-gray-300 hover:text-white hover:bg-wacke-dark/40 transition-colors"
        >
          <span>🔴</span>
          <span>Mon Stream</span>
        </Link>
      </div>

      {/* ── Recommended Channels List ───────────────────────────────────── */}
      <div className="flex-1 p-4 border-t border-wacke-purple/10 overflow-y-auto">
        <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4 px-3">
          Chaînes Recommandées
        </h2>
        <div className="space-y-1">
          {channelsToRender.map((channel, i) => (
            <Link
              key={channel.username + i}
              href={`/stream/${channel.username}`}
              className="flex items-center justify-between px-3 py-2 rounded-xl hover:bg-wacke-dark/40 transition-colors group"
            >
              <div className="flex items-center space-x-3">
                {/* Avatar */}
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-wacke-pink to-wacke-purple flex items-center justify-center text-xs font-bold text-white uppercase shrink-0">
                  {channel.displayName[0]}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-200 group-hover:text-white truncate">
                    {channel.displayName}
                  </p>
                  <p className="text-xs text-gray-500 truncate capitalize">
                    {channel.category}
                  </p>
                </div>
              </div>

              {/* Live indicators */}
              <div className="flex items-center space-x-1.5 shrink-0">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                <span className="text-xs text-gray-400 font-medium">
                  {channel.viewerCount >= 1000
                    ? `${(channel.viewerCount / 1000).toFixed(1)}k`
                    : channel.viewerCount}
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* ── Squad Discord Banner ────────────────────────────────────────── */}
      <div className="p-4 border-t border-wacke-purple/10">
        <div className="bg-wacke-dark/30 border border-wacke-purple/20 rounded-2xl p-4">
          <p className="text-xs text-gray-400 font-semibold mb-2">Rejoindre le Discord Wacké?</p>
          <a
            href="https://discord.gg"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full bg-[#5865F2] hover:bg-[#4752C4] py-2 rounded-xl font-bold text-xs text-white block text-center transition-colors"
          >
            Rejoindre 🚀
          </a>
        </div>
      </div>
    </aside>
  );
}
