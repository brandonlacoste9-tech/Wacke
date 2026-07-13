/**
 * In-memory sliding-window rate limiter.
 * Works per serverless instance (good enough for beta); use Redis later for multi-instance.
 */

type Bucket = { timestamps: number[] };

const store = new Map<string, Bucket>();

export type RateLimitResult = {
  ok: boolean;
  remaining: number;
  retryAfterSec: number;
  limit: number;
};

export type RateLimitConfig = {
  /** Max requests in the window */
  limit: number;
  /** Window length in milliseconds */
  windowMs: number;
};

/** Presets for common Wacke routes */
export const RATE_LIMITS = {
  chat: { limit: 8, windowMs: 10_000 }, // 8 msgs / 10s
  chatCostly: { limit: 4, windowMs: 60_000 }, // TTS/spray/sound/sacré
  ai: { limit: 12, windowMs: 60_000 },
  claim: { limit: 3, windowMs: 60_000 },
  watchReward: { limit: 5, windowMs: 60_000 },
  bet: { limit: 10, windowMs: 60_000 },
  auth: { limit: 20, windowMs: 60_000 },
  default: { limit: 30, windowMs: 60_000 },
} as const satisfies Record<string, RateLimitConfig>;

function prune(bucket: Bucket, windowStart: number) {
  bucket.timestamps = bucket.timestamps.filter((t) => t > windowStart);
}

/**
 * @param key - unique key e.g. `chat:userId` or `ai:ip`
 */
export function rateLimit(
  key: string,
  config: RateLimitConfig = RATE_LIMITS.default
): RateLimitResult {
  const now = Date.now();
  const windowStart = now - config.windowMs;
  let bucket = store.get(key);
  if (!bucket) {
    bucket = { timestamps: [] };
    store.set(key, bucket);
  }
  prune(bucket, windowStart);

  if (bucket.timestamps.length >= config.limit) {
    const oldest = bucket.timestamps[0] ?? now;
    const retryAfterSec = Math.max(
      1,
      Math.ceil((oldest + config.windowMs - now) / 1000)
    );
    return {
      ok: false,
      remaining: 0,
      retryAfterSec,
      limit: config.limit,
    };
  }

  bucket.timestamps.push(now);
  return {
    ok: true,
    remaining: Math.max(0, config.limit - bucket.timestamps.length),
    retryAfterSec: 0,
    limit: config.limit,
  };
}

export function clientIp(req: {
  headers: { get(name: string): string | null };
}): string {
  const xf = req.headers.get("x-forwarded-for");
  if (xf) return xf.split(",")[0].trim().slice(0, 64);
  const real = req.headers.get("x-real-ip");
  if (real) return real.slice(0, 64);
  return "unknown";
}

export function rateLimitResponse(result: RateLimitResult, fr = true) {
  const msg = fr
    ? `Trop rapide — réessaie dans ${result.retryAfterSec}s`
    : `Too fast — try again in ${result.retryAfterSec}s`;
  return {
    body: { error: msg, code: "RATE_LIMITED", retryAfterSec: result.retryAfterSec },
    status: 429 as const,
    headers: {
      "Retry-After": String(result.retryAfterSec),
      "X-RateLimit-Limit": String(result.limit),
      "X-RateLimit-Remaining": String(result.remaining),
    },
  };
}

/** Occasional cleanup so the Map doesn't grow forever */
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const cutoff = Date.now() - 5 * 60_000;
    for (const [k, b] of store) {
      prune(b, cutoff);
      if (b.timestamps.length === 0) store.delete(k);
    }
  }, 120_000).unref?.();
}
