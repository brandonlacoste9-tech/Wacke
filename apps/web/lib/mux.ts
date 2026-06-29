import Mux from "@mux/mux-node";
import { isMuxMocked } from "./config";

// Mux client singleton — server-side only
let muxClient: Mux | null = null;

export function getMuxClient(): Mux {
  if (isMuxMocked()) {
    // Return empty shell when mocked, we won't actually call it
    return {} as Mux;
  }
  if (!muxClient) {
    muxClient = new Mux({
      tokenId: process.env.MUX_TOKEN_ID!,
      tokenSecret: process.env.MUX_TOKEN_SECRET!,
    });
  }
  return muxClient;
}

/**
 * Creates a new Mux Live Stream for a broadcaster.
 * Returns the stream key (for OBS/streaming software) and playback ID (for viewers).
 */
export async function createMuxLiveStream() {
  if (isMuxMocked()) {
    return {
      liveStreamId: "mock-live-stream-id-" + Math.random().toString(36).substring(7),
      streamKey: "mock-stream-key-123456",
      playbackId: "mock_playback_id",
    };
  }

  const mux = getMuxClient();

  const liveStream = await mux.video.liveStreams.create({
    playback_policy: ["public"],
    new_asset_settings: {
      playback_policy: ["public"],
    },
    latency_mode: "low", // Low-latency mode (LL-HLS) for real-time interaction
  });

  return {
    liveStreamId: liveStream.id,
    streamKey: liveStream.stream_key,
    playbackId: liveStream.playback_ids?.[0]?.id,
  };
}

/**
 * Deletes a Mux Live Stream (called when a streamer ends their broadcast).
 */
export async function deleteMuxLiveStream(liveStreamId: string) {
  if (isMuxMocked()) {
    console.log(`[MOCK MUX] Deleted live stream: ${liveStreamId}`);
    return;
  }
  const mux = getMuxClient();
  await mux.video.liveStreams.delete(liveStreamId);
}

/**
 * Retrieves the current status of a Mux Live Stream.
 */
export async function getMuxStreamStatus(liveStreamId: string) {
  if (isMuxMocked()) {
    return "active";
  }
  const mux = getMuxClient();
  const stream = await mux.video.liveStreams.retrieve(liveStreamId);
  return stream.status; // "active" | "idle" | "disabled"
}

/**
 * Generates a Mux thumbnail URL for a given playback ID.
 * Used for stream preview cards in the browse page.
 */
export function getMuxThumbnailUrl(playbackId: string, time = 0): string {
  if (playbackId === "mock_playback_id" || isMuxMocked()) {
    return "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=640&q=80";
  }
  return `https://image.mux.com/${playbackId}/thumbnail.jpg?time=${time}&width=640`;
}

/**
 * Generates the HLS stream URL for a given playback ID.
 */
export function getMuxHlsUrl(playbackId: string): string {
  if (playbackId === "mock_playback_id" || isMuxMocked()) {
    // Mux's official public test stream
    return "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8";
  }
  return `https://stream.mux.com/${playbackId}.m3u8`;
}

