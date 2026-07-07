import { notFound } from "next/navigation";
import { cookies } from "next/headers";
export const dynamic = 'force-dynamic';

import { getStreamByUserId, getRecentMessages, getUserByUsername, isFollowing, getUserBySupabaseId, TOP_KICK_STREAMERS } from "@wacke/db";
import WackePlayer from "@/components/WackePlayer";
import GraffitiChat from "@/components/GraffitiChat";
import TokenBar from "@/components/TokenBar";
import FollowButton from "@/components/FollowButton";
import ReactionButton from "@/components/ReactionButton";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import type { Metadata } from "next";

import ObsOverlayButton from "@/components/ObsOverlayButton";
import GrokStreamTools from "@/components/GrokStreamTools";
import GrokCoHost from "@/components/GrokCoHost";
import GrokRoastBattle from "@/components/GrokRoastBattle";
import GrokFire from "@/components/GrokFire";

interface StreamPageProps {
  params: { username: string };
}

export async function generateMetadata({ params }: StreamPageProps): Promise<Metadata> {
  const cleanUsername = params.username.toLowerCase();
  const cookieStore = cookies();
  const lang = (cookieStore.get("wacke_lang")?.value || "fr") as "fr" | "en";
  const isEn = lang === "en";

  if (cleanUsername.startsWith("twitch-")) {
    const twitchUsername = cleanUsername.substring(7);
    const displayName = twitchUsername.charAt(0).toUpperCase() + twitchUsername.slice(1);
    return {
      title: isEn ? `🔴 ${displayName} Live | Wacké` : `🔴 Live de ${displayName} | Wacké`,
      description: isEn 
        ? `Watch ${displayName} broadcasting live on Wacké via Twitch!`
        : `Regarde ${displayName} diffuser en direct sur Wacké via Twitch!`,
    };
  }

  const isKickStream = TOP_KICK_STREAMERS.includes(cleanUsername);

  if (isKickStream) {
    const displayName = cleanUsername.charAt(0).toUpperCase() + cleanUsername.slice(1);
    return {
      title: isEn ? `🟢 ${displayName} Live | Wacké` : `🟢 Live de ${displayName} | Wacké`,
      description: isEn 
        ? `Watch ${displayName} broadcasting live on Wacké via Kick!`
        : `Regarde ${displayName} diffuser en direct sur Wacké via Kick!`,
    };
  }

  const user = await getUserByUsername(params.username);
  if (!user) return { title: isEn ? "Stream not found — Wacké" : "Stream introuvable — Wacké" };

  const stream = await getStreamByUserId(user.id);
  return {
    title: stream ? `${stream.title} — ${user.displayName} | Wacké` : `${user.displayName} | Wacké`,
    description: stream?.description ?? (isEn ? `Watch ${user.displayName} on Wacké` : `Regarde ${user.displayName} sur Wacké`),
    openGraph: {
      images: stream?.cloudflarePlaybackId
        ? [`https://customer-${process.env.CLOUDFLARE_ACCOUNT_ID}.cloudflarestream.com/${stream.cloudflarePlaybackId}/thumbnails/thumbnail.jpg`]
        : [],
    },
  };
}

export default async function StreamPage({ params }: StreamPageProps) {
  const cleanUsername = params.username.toLowerCase();
  const isTwitchStream = cleanUsername.startsWith("twitch-");

  const cookieStore = cookies();
  const lang = (cookieStore.get("wacke_lang")?.value || "fr") as "fr" | "en";
  const isEn = lang === "en";

  if (isTwitchStream) {
    const twitchUsername = cleanUsername.substring(7); // Remove "twitch-" prefix
    const displayName = twitchUsername.charAt(0).toUpperCase() + twitchUsername.slice(1);
    const fallbackTitle = isEn 
      ? `🔴 Live stream from Twitch.tv`
      : `🔴 Diffusion en direct de Twitch.tv`;

    return (
      <div className="flex flex-col lg:flex-row min-h-[calc(100vh-160px)] lg:h-[calc(100vh-64px)] relative">
        <main className="flex-none lg:flex-1 w-full overflow-y-visible lg:overflow-y-auto p-4 lg:p-6 space-y-4 lg:space-y-6">
          <WackePlayer
            playbackId="mock_playback_id"
            title={fallbackTitle}
            streamerName={displayName}
            viewerCount={15400}
            isLive={true}
            twitchUsername={twitchUsername}
          />
          <div className="bg-wacke-darker rounded-xl p-6 border border-wacke-purple/20">
            <h1 className="text-2xl font-bold text-white">{fallbackTitle}</h1>
            <p className="text-wacke-cyan font-semibold capitalize">{twitchUsername}</p>
          </div>
        </main>
        <GraffitiChat
          streamId={`twitch-mock-chat-${twitchUsername}`}
          initialMessages={[]}
          currentUserId={undefined}
          twitchUsername={twitchUsername}
        />
        <TokenBar
          initialBalance={500}
          streamerId={`twitch-mock-streamer-${twitchUsername}`}
          streamId={`twitch-mock-chat-${twitchUsername}`}
          authToken={undefined}
        />
      </div>
    );
  }

  let user;
  let stream;
  let initialMessages: any[] = [];
  let viewer = null;
  let initialIsFollowing = false;
  let token = null;

  try {
    user = await getUserByUsername(params.username);
    if (!user) notFound();

    stream = await getStreamByUserId(user.id);
    if (!stream) notFound();

    // Hydrate chat with last 50 messages (SSR for instant load)
    initialMessages = stream.status === "live"
      ? await getRecentMessages(stream.id, 50)
      : [];

    // Read auth token from cookie and fetch database viewer info
    token = cookieStore.get("wacke_token")?.value;

    if (token) {
      try {
        const supabase = getSupabaseAdmin();
        const { data: { user: authUser } } = await supabase.auth.getUser(token);
        if (authUser) {
          viewer = await getUserBySupabaseId(authUser.id);
          if (viewer) {
            initialIsFollowing = await isFollowing(viewer.id, user.id);
          }
        }
      } catch (err) {
        console.error("[STREAM_PAGE_AUTH_ERROR]", err);
      }
    }
  } catch (dbErr) {
    console.error("[STREAM_PAGE_DB_FAIL_FALLBACK]", dbErr);
    // Graceful database fallback: render the Kick live player directly using path params
    const cleanUsername = params.username.toLowerCase();
    const fallbackTitle = isEn 
      ? `🔴 Live stream from Kick.com`
      : `🔴 Diffusion en direct de Kick.com`;
    
    return (
      <div className="flex flex-col lg:flex-row min-h-[calc(100vh-160px)] lg:h-[calc(100vh-64px)] relative">
        <main className="flex-none lg:flex-1 w-full overflow-y-visible lg:overflow-y-auto p-4 lg:p-6 space-y-4 lg:space-y-6">
          <WackePlayer
            playbackId="mock_playback_id"
            title={fallbackTitle}
            streamerName={cleanUsername.charAt(0).toUpperCase() + cleanUsername.slice(1)}
            viewerCount={12400}
            isLive={true}
            kickUsername={cleanUsername}
          />
          <div className="bg-wacke-darker rounded-xl p-6 border border-wacke-purple/20">
            <h1 className="text-2xl font-bold text-white">{fallbackTitle}</h1>
            <p className="text-wacke-cyan font-semibold capitalize">{cleanUsername}</p>
          </div>
        </main>
        <GraffitiChat
          streamId={`kick-mock-chat-${cleanUsername}`}
          initialMessages={[]}
          currentUserId={undefined}
          kickUsername={cleanUsername}
        />
        <TokenBar
          initialBalance={500}
          streamerId={`kick-mock-streamer-${cleanUsername}`}
          streamId={`kick-mock-chat-${cleanUsername}`}
          authToken={undefined}
        />
      </div>
    );
  }

  const isKickUser =
    user.supabaseId?.startsWith("kick-") ||
    user.username.startsWith("kickseur_") ||
    TOP_KICK_STREAMERS.includes(user.username.toLowerCase());


  const isOwner = viewer !== null && user !== null && viewer.id === user.id;

  return (
    <div className="relative flex flex-col lg:flex-row gap-5 lg:gap-6 max-w-[1920px] mx-auto">
      {/* Left / Main Column */}
      <main className="flex-1 min-w-0 space-y-4">
        {/* Player */}
        <section className="pt-2">
          <div className="relative group rounded-2xl overflow-hidden bg-black shadow-2xl shadow-black/60 border border-wacke-purple/15">
            {stream.status === "live" && (
              <div className="absolute top-3 left-3 z-20 flex items-center gap-2">
                <span className="px-2 py-1 rounded-lg bg-red-600/90 text-white text-[11px] font-black tracking-widest flex items-center gap-1.5 shadow-[0_0_18px_rgba(255,59,59,0.4)]">
                  <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
                  LIVE
                </span>
                <span className="px-2 py-1 rounded-lg bg-wacke-dark/70 backdrop-blur text-[11px] font-bold text-white border border-white/10 shadow-lg shadow-black/40">
                  👁 {stream.viewerCount.toLocaleString("fr-CA")}
                </span>
              </div>
            )}
            <div className="relative aspect-video">
              {isKickUser || stream.cloudflarePlaybackId ? (
                <WackePlayer
                  playbackId={stream.cloudflarePlaybackId ?? "mock_playback_id"}
                  title={stream.title}
                  streamerName={user.displayName}
                  viewerCount={stream.viewerCount}
                  isLive={stream.status === "live"}
                  kickUsername={isKickUser ? user.username : undefined}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-black">
                  <div className="text-center">
                    <p className="text-wacke-pink font-bold text-sm">Offline</p>
                    <p className="text-gray-500 text-xs mt-1">{user.displayName} is offline</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Creator info rail */}
        <section className="glass rounded-2xl p-5 border border-wacke-purple/20 shadow-2xl shadow-black/40">
          <div className="flex items-start justify-between border-b border-white/5 pb-5 mb-5">
            <div className="flex items-center space-x-4">
              {/* Avatar */}
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-wacke-pink to-wacke-purple flex items-center justify-center text-2xl font-bold">
                {user.displayName[0].toUpperCase()}
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">{stream.title}</h1>
                <p className="text-wacke-cyan font-semibold">{user.displayName}</p>
                <p className="text-gray-400 text-sm capitalize mt-1">{stream.category}</p>
              </div>
            </div>

            {/* Action buttons (client components) */}
            <div className="flex items-center space-x-3">
              <ReactionButton
                streamerId={user.id}
                streamId={stream.id}
                authToken={token}
              />
              <FollowButton
                streamerId={user.id}
                initialIsFollowing={initialIsFollowing}
                authToken={token}
              />
            </div>
          </div>

          {stream.description && (
            <p className="text-gray-300 mt-4 text-sm leading-relaxed">{stream.description}</p>
          )}

          {/* Grok xAI Live Tools */}
          <GrokStreamTools streamerName={user.displayName} />

          {/* Grok xAI Co-Host - real Grok jumps into the stream */}
          <GrokCoHost streamerName={user.displayName} streamId={stream.id} />

          {/* Grok Roast Battle - pure chaos */}
          <GrokRoastBattle streamerName={user.displayName} />

          {/* LIGHT THE MATCH BOOM - GROK xAI FIRE IGNITED */}
          <div className="mt-4">
            <GrokFire />
          </div>
        </div>
      </main>

      {/* Right Rail: Floating HUD Chat */}
      <div className="w-full lg:w-[380px] shrink-0">
        <div className="glass-hud sticky top-20 rounded-2xl overflow-hidden border border-wacke-cyan/15 shadow-2xl shadow-black/50 h-[calc(100vh-84px)] flex flex-col">
          <div className="px-4 py-3 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-wacke-cyan rounded-full shadow-[0_0_8px_#00F0FF]" />
              <span className="text-[11px] font-black text-white/90 uppercase tracking-[0.15em]">
                Graffiti HUD
              </span>
            </div>
            <span className="text-[10px] font-mono text-gray-500">v2.0</span>
          </div>
          <GraffitiChat
            streamId={stream.id}
            initialMessages={initialMessages as any}
            currentUserId={viewer?.id}
            kickUsername={isKickUser ? user.username : undefined}
            twitchUsername={(user as any).twitchUsername || undefined}
          />
        </div>
      </div>
    </div>

    {/* Floating Token Bar */}
    <TokenBar
      initialBalance={viewer?.tokenBalance ?? 0}
      streamerId={user.id}
      streamId={stream.id}
      authToken={token}
    />
  );
}
