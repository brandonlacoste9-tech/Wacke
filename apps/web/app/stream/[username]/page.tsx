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
  const title = stream ? `${stream.title} — ${user.displayName} | Wacké` : `${user.displayName} | Wacké`;
  const description = stream?.description ?? (isEn ? `Watch ${user.displayName} on Wacké` : `Regarde ${user.displayName} sur Wacké`);
  const image = stream?.cloudflarePlaybackId
    ? `https://customer-${process.env.CLOUDFLARE_ACCOUNT_ID}.cloudflarestream.com/${stream.cloudflarePlaybackId}/thumbnails/thumbnail.jpg`
    : "/hero_banner.jpg";

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: stream?.status === "live" ? "video.other" : "website",
      images: [
        {
          url: image,
          width: 1200,
          height: 630,
        }
      ]
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image]
    }
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
      <div className="relative flex flex-col xl:flex-row gap-4 xl:gap-6 min-h-[calc(100vh-64px)] px-2 xl:px-6 py-4 max-w-[2000px] mx-auto">
        <main className="flex-1 min-w-0 space-y-4 xl:space-y-6 order-1">
          <WackePlayer
            playbackId="mock_playback_id"
            title={fallbackTitle}
            streamerName={displayName}
            viewerCount={15400}
            isLive={true}
            twitchUsername={twitchUsername}
          />
          <div className="glass rounded-2xl p-6 border border-wacke-purple/20 shadow-xl shadow-black/40">
            <h1 className="text-2xl font-black text-white">{fallbackTitle}</h1>
            <p className="text-wacke-cyan font-semibold capitalize mt-1">{twitchUsername}</p>
          </div>
        </main>
        <div className="w-full xl:w-[350px] shrink-0 xl:h-[calc(100vh-96px)] xl:sticky xl:top-20 order-2">
          <GraffitiChat
            streamId={`twitch-mock-chat-${twitchUsername}`}
            initialMessages={[]}
            currentUserId={undefined}
            twitchUsername={twitchUsername}
          />
        </div>
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
      <div className="relative flex flex-col xl:flex-row gap-4 xl:gap-6 min-h-[calc(100vh-64px)] px-2 xl:px-6 py-4 max-w-[2000px] mx-auto">
        <main className="flex-1 min-w-0 space-y-4 xl:space-y-6 order-1">
          <WackePlayer
            playbackId="mock_playback_id"
            title={fallbackTitle}
            streamerName={cleanUsername.charAt(0).toUpperCase() + cleanUsername.slice(1)}
            viewerCount={12400}
            isLive={true}
            kickUsername={cleanUsername}
          />
          <div className="glass rounded-2xl p-6 border border-wacke-purple/20 shadow-xl shadow-black/40">
            <h1 className="text-2xl font-black text-white">{fallbackTitle}</h1>
            <p className="text-wacke-cyan font-semibold capitalize mt-1">{cleanUsername}</p>
          </div>
        </main>
        
        {/* Right Rail: Chat */}
        <div className="w-full xl:w-[350px] shrink-0 xl:h-[calc(100vh-96px)] xl:sticky xl:top-20 order-2">
          <GraffitiChat
            streamId={`kick-mock-chat-${cleanUsername}`}
            initialMessages={[]}
            currentUserId={undefined}
            kickUsername={cleanUsername}
          />
        </div>

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

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": stream.status === "live" ? "BroadcastEvent" : "VideoObject",
    "name": stream.title || `Live stream de ${user.displayName}`,
    "description": stream.description || `Regarde ${user.displayName} sur Wacké`,
    "uploadDate": stream.createdAt,
    "thumbnailUrl": stream.cloudflarePlaybackId
      ? `https://customer-${process.env.CLOUDFLARE_ACCOUNT_ID}.cloudflarestream.com/${stream.cloudflarePlaybackId}/thumbnails/thumbnail.jpg`
      : "https://wacke.ca/hero_banner.jpg",
    "broadcaster": {
      "@type": "Person",
      "name": user.displayName,
      "url": `https://wacke.ca/profile/${user.username}`
    }
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="relative flex flex-col xl:flex-row gap-4 xl:gap-6 min-h-[calc(100vh-64px)] px-2 xl:px-6 py-4 max-w-[2000px] mx-auto">
      {/* Main Column */}
      <main className="flex-1 min-w-0 space-y-4 xl:space-y-6 order-1">
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
              {isKickUser || user.twitchUsername || user.youtubeChannelId || stream.cloudflarePlaybackId ? (
                <WackePlayer
                  playbackId={stream.cloudflarePlaybackId ?? "mock_playback_id"}
                  title={stream.title}
                  streamerName={user.displayName}
                  viewerCount={stream.viewerCount}
                  isLive={stream.status === "live"}
                  kickUsername={isKickUser ? user.username : undefined}
                  twitchUsername={user.twitchUsername || undefined}
                  youtubeChannelId={user.youtubeChannelId || undefined}
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
        <section className="glass rounded-2xl p-5 border border-wacke-purple/20 shadow-2xl shadow-black/40 backdrop-blur-xl">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between border-b border-white/5 pb-5 mb-5 gap-4">
            <div className="flex items-center space-x-4">
              {/* Avatar */}
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-wacke-pink to-wacke-purple flex items-center justify-center text-2xl font-black text-white shadow-lg shadow-wacke-purple/30 ring-2 ring-white/10">
                {user.displayName[0].toUpperCase()}
              </div>
              <div>
                <h1 className="text-2xl font-black text-white leading-tight">{stream.title}</h1>
                <p className="text-wacke-cyan font-bold text-lg mt-0.5 tracking-tight">{user.displayName}</p>
                <p className="text-gray-400 text-xs uppercase tracking-widest mt-1 font-semibold">{stream.category}</p>
              </div>
            </div>

            {/* Action buttons (client components) */}
            <div className="flex items-center space-x-3 shrink-0">
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
          <div className="mt-6 grid grid-cols-1 gap-4">
            <GrokStreamTools streamerName={user.displayName} />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <GrokCoHost streamerName={user.displayName} streamId={stream.id} />
              <GrokRoastBattle streamerName={user.displayName} />
            </div>
          </div>

          {/* LIGHT THE MATCH BOOM - GROK xAI FIRE IGNITED */}
          <div className="mt-4">
            <GrokFire />
          </div>
        </section>
      </main>

      {/* Right Rail: Graffiti Chat */}
      <div className="w-full xl:w-[350px] shrink-0 xl:h-[calc(100vh-96px)] xl:sticky xl:top-20 order-2">
        <GraffitiChat
          streamId={stream.id}
          initialMessages={initialMessages as any}
          currentUserId={viewer?.id}
          kickUsername={isKickUser ? user.username : undefined}
          twitchUsername={(user as any).twitchUsername || undefined}
        />
      </div>
    </div>

    {/* Floating Token Bar */}
    <TokenBar
      initialBalance={viewer?.tokenBalance ?? 0}
      streamerId={user.id}
      streamId={stream.id}
      authToken={token}
      />
    </>
  );
}
