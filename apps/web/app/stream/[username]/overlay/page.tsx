import { notFound } from "next/navigation";
import { getUserByUsername, getStreamByUserId } from "@wacke/db";
import WackeObsOverlay from "@/components/WackeObsOverlay";

interface OverlayPageProps {
  params: { username: string };
}

export const dynamic = "force-dynamic";

export default async function OverlayPage({ params }: OverlayPageProps) {
  const cleanUsername = params.username.toLowerCase();
  const isTwitchStream = cleanUsername.startsWith("twitch-");

  if (isTwitchStream) {
    const twitchUsername = cleanUsername.substring(7);
    const displayName = twitchUsername.charAt(0).toUpperCase() + twitchUsername.slice(1);
    
    // For Twitch, join the mock channel chat ID used in the player/chat page
    return (
      <WackeObsOverlay
        streamId={`twitch-mock-chat-${twitchUsername}`}
        streamerName={displayName}
      />
    );
  }

  try {
    const user = await getUserByUsername(params.username);
    if (!user) notFound();

    const stream = await getStreamByUserId(user.id);
    if (!stream) notFound();

    return (
      <WackeObsOverlay
        streamId={stream.id}
        streamerName={user.displayName}
      />
    );
  } catch (dbErr) {
    console.error("[OBS_OVERLAY_DB_FAIL_FALLBACK]", dbErr);
    
    // Fallback: If DB query fails, fall back to mock stream ID so page still loads
    return (
      <WackeObsOverlay
        streamId={`kick-mock-chat-${cleanUsername}`}
        streamerName={cleanUsername.charAt(0).toUpperCase() + cleanUsername.slice(1)}
      />
    );
  }
}
