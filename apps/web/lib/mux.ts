import Mux from "@mux/mux-node";

// Mux client singleton — server-side only
let muxClient: Mux | null = null;

export function getMuxClient(): Mux {
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
  const mux = getMuxClient();

  const liveStream = await mux.video.liveStreams.create({
    playback_policy: ["public"],
    new_asset_settings: {
      playback_policy: ["public"],
    },
    reduced_latency: true, // Low-latency mode for real-time interaction
    reconnect_window: 60,  // Allow 60s reconnect window for streamer drops
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
  const mux = getMuxClient();
  await mux.video.liveStreams.delete(liveStreamId);
}

/**
 * Retrieves the current status of a Mux Live Stream.
 */
export async function getMuxStreamStatus(liveStreamId: string) {
  const mux = getMuxClient();
  const stream = await mux.video.liveStreams.retrieve(liveStreamId);
  return stream.status; // "active" | "idle" | "disabled"
}

/**
 * Generates a Mux thumbnail URL for a given playback ID.
 * Used for stream preview cards in the browse page.
 */
export function getMuxThumbnailUrl(playbackId: string, time = 0): string {
  return `https://image.mux.com/${playbackId}/thumbnail.jpg?time=${time}&width=640`;
}

/**
 * Generates the HLS stream URL for a given playback ID.
 */
export function getMuxHlsUrl(playbackId: string): string {
  return `https://stream.mux.com/${playbackId}.m3u8`;
}
