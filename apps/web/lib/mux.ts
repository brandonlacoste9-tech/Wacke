/**
 * Mux Video API helpers for native Wacke live streams.
 * Auth: HTTP Basic with MUX_TOKEN_ID:MUX_TOKEN_SECRET
 */

export type MuxLiveStream = {
  id: string;
  streamKey: string;
  playbackId: string;
  status: string;
  rtmpUrl: string;
  rtmpsUrl: string;
};

function authHeader(): string {
  const id = process.env.MUX_TOKEN_ID?.trim();
  const secret = process.env.MUX_TOKEN_SECRET?.trim();
  if (!id || !secret) {
    throw new Error("MUX_TOKEN_ID and MUX_TOKEN_SECRET are required");
  }
  return "Basic " + Buffer.from(`${id}:${secret}`).toString("base64");
}

export function isMuxConfigured(): boolean {
  const id = process.env.MUX_TOKEN_ID?.trim();
  const secret = process.env.MUX_TOKEN_SECRET?.trim();
  return Boolean(id && secret && !id.includes("your-") && !secret.includes("your-"));
}

export function muxHlsUrl(playbackId: string): string {
  return `https://stream.mux.com/${playbackId}.m3u8`;
}

export function muxThumbnailUrl(playbackId: string, width = 640): string {
  return `https://image.mux.com/${playbackId}/thumbnail.jpg?width=${width}&fit_mode=smartcrop`;
}

/** Create a new Mux live stream (one per go-live session or reuse per user). */
export async function createMuxLiveStream(metaName: string): Promise<MuxLiveStream> {
  const res = await fetch("https://api.mux.com/video/v1/live-streams", {
    method: "POST",
    headers: {
      Authorization: authHeader(),
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      playback_policy: ["public"],
      new_asset_settings: { playback_policy: ["public"] },
      reduced_latency: true,
      reconnect_window: 60,
      passthrough: metaName.slice(0, 255),
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    console.error("[mux create]", err);
    throw new Error(`Mux create failed: ${res.status}`);
  }

  const json = (await res.json()) as {
    data: {
      id: string;
      stream_key: string;
      status: string;
      playback_ids?: { id: string; policy: string }[];
    };
  };

  const data = json.data;
  const playbackId = data.playback_ids?.[0]?.id;
  if (!playbackId) {
    throw new Error("Mux live stream missing playback_id");
  }

  return {
    id: data.id,
    streamKey: data.stream_key,
    playbackId,
    status: data.status,
    rtmpUrl: "rtmp://global-live.mux.com:5222/app",
    rtmpsUrl: "rtmps://global-live.mux.com:443/app",
  };
}

export async function getMuxLiveStream(liveStreamId: string): Promise<{
  id: string;
  status: string;
  playbackId?: string;
  streamKey?: string;
} | null> {
  const res = await fetch(
    `https://api.mux.com/video/v1/live-streams/${liveStreamId}`,
    { headers: { Authorization: authHeader() } }
  );
  if (!res.ok) return null;
  const json = (await res.json()) as {
    data: {
      id: string;
      status: string;
      stream_key?: string;
      playback_ids?: { id: string }[];
    };
  };
  return {
    id: json.data.id,
    status: json.data.status,
    streamKey: json.data.stream_key,
    playbackId: json.data.playback_ids?.[0]?.id,
  };
}

export async function disableMuxLiveStream(liveStreamId: string): Promise<void> {
  await fetch(
    `https://api.mux.com/video/v1/live-streams/${liveStreamId}/disable`,
    { method: "PUT", headers: { Authorization: authHeader() } }
  ).catch(() => {});
}

export async function enableMuxLiveStream(liveStreamId: string): Promise<void> {
  await fetch(
    `https://api.mux.com/video/v1/live-streams/${liveStreamId}/enable`,
    { method: "PUT", headers: { Authorization: authHeader() } }
  ).catch(() => {});
}

/** Verify Mux webhook signature (MUX_WEBHOOK_SECRET) */
export function verifyMuxWebhook(
  rawBody: string,
  signatureHeader: string | null
): boolean {
  const secret = process.env.MUX_WEBHOOK_SECRET?.trim();
  if (!secret) {
    // If no secret configured, accept only in non-production
    return process.env.NODE_ENV !== "production";
  }
  if (!signatureHeader) return false;
  // Mux uses webhook signature format: t=timestamp,v1=signature
  try {
    const crypto = require("crypto") as typeof import("crypto");
    const parts = Object.fromEntries(
      signatureHeader.split(",").map((p) => {
        const [k, v] = p.split("=");
        return [k.trim(), v];
      })
    );
    const timestamp = parts.t;
    const sig = parts.v1;
    if (!timestamp || !sig) return false;
    const payload = `${timestamp}.${rawBody}`;
    const expected = crypto
      .createHmac("sha256", secret)
      .update(payload)
      .digest("hex");
    return crypto.timingSafeEqual(
      Buffer.from(sig),
      Buffer.from(expected)
    );
  } catch {
    return false;
  }
}
