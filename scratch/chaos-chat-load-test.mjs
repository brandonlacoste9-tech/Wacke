/**
 * Wacké Chaos Chat Load Test
 * Simulates 5 unfiltered viewers spamming chat, soundboard, and token actions.
 *
 * Usage (dev server must be running on :3000):
 *   node chaos-chat-load-test.mjs
 */

import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(__dirname, "../apps/web/.env.local") });

const BASE = process.env.CHAOS_BASE_URL || "http://localhost:3000";
const DURATION_MS = Number(process.env.CHAOS_DURATION_MS || 30_000);
const PASSWORD = "ChaosLoadTest!99";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const SUPABASE_SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON || !SUPABASE_SERVICE) {
  console.error("Missing Supabase env vars in apps/web/.env.local");
  process.exit(1);
}

const CHAOS_USERS = [
  { username: "chaos_troll_1", displayName: "TrollDeLuxe 🔥" },
  { username: "chaos_troll_2", displayName: "KickIsDead 💀" },
  { username: "chaos_troll_3", displayName: "TabarnakChat" },
  { username: "chaos_troll_4", displayName: "ClipItNOW" },
  { username: "chaos_troll_5", displayName: "WackeMaximal" },
];

const CHAOS_MESSAGES = [
  "Twitch is dead, Wacké won",
  "streamer is throwing holy shit",
  "chat going absolutely feral rn",
  "someone clip that IMMEDIATELY",
  "Kick who? never heard of her",
  "Grok roast the streamer pls",
  "this dep drama hits different",
  "BOUM BOUM BOUM let's go",
  "tokens loaded, chaos incoming",
  "unfiltered or nothing 🪙🔥",
  "streamer rage quit incoming",
  "Wacké.live > everything else",
];

const SOUNDS = ["bell", "coin", "alarm", "laser"];

const log = (tag, msg) => {
  const ts = new Date().toISOString().slice(11, 23);
  console.log(`[${ts}] ${tag} ${msg}`);
};

const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const anon = createClient(SUPABASE_URL, SUPABASE_ANON);

async function ensureChaosUser({ username, displayName }) {
  const email = `${username}@chaos.wacke.test`;

  let { data: signInData, error: signInErr } = await anon.auth.signInWithPassword({
    email,
    password: PASSWORD,
  });

  if (signInErr) {
    const { error: createErr } = await admin.auth.admin.createUser({
      email,
      password: PASSWORD,
      email_confirm: true,
      user_metadata: { username, displayName },
    });
    if (createErr && !createErr.message?.includes("already")) {
      throw new Error(`createUser ${username}: ${createErr.message}`);
    }
    ({ data: signInData, error: signInErr } = await anon.auth.signInWithPassword({
      email,
      password: PASSWORD,
    }));
    if (signInErr) throw new Error(`signIn ${username}: ${signInErr.message}`);
  }

  const token = signInData.session.access_token;

  const syncRes = await fetch(`${BASE}/api/auth/sync`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ username, displayName }),
  });
  const syncJson = await syncRes.json();
  if (!syncRes.ok) {
    throw new Error(`sync ${username}: ${syncJson.error || syncRes.status}`);
  }

  return { token, user: syncJson.user };
}

async function getLiveStream() {
  const res = await fetch(`${BASE}/api/streams?limit=5`);
  const data = await res.json();
  const live = (data.streams || []).find((s) => s.status === "live");
  if (!live) throw new Error("No live stream found — go live in Studio first");
  return live;
}

async function postChat(token, streamId, content) {
  const res = await fetch(`${BASE}/api/chat`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ streamId, content }),
  });
  const json = await res.json();
  return { ok: res.ok, status: res.status, json };
}

async function postSound(token, streamId, soundType) {
  const res = await fetch(`${BASE}/api/chat/sound`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ streamId, soundType }),
  });
  const json = await res.json();
  return { ok: res.ok, status: res.status, json };
}

async function postTokenAction(token, body) {
  const res = await fetch(`${BASE}/api/tokens`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  const json = await res.json();
  return { ok: res.ok, status: res.status, json };
}

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randMs(min, max) {
  return min + Math.floor(Math.random() * (max - min));
}

async function main() {
  log("🚀", `Wacké Chaos Load Test → ${BASE} (${DURATION_MS / 1000}s)`);

  const stream = await getLiveStream();
  const streamId = stream.id;
  const streamerId = stream.userId;
  log("📺", `Target stream: ${stream.title} (${streamId})`);
  log("👤", `Streamer: ${stream.user?.displayName || stream.user?.username}`);

  const bots = [];
  for (const u of CHAOS_USERS) {
    const bot = await ensureChaosUser(u);
    bots.push({ ...u, ...bot });
    log("🤖", `Bootstrapped @${u.username} — balance: ${bot.user.tokenBalance} 🪙`);
  }

  let realtimeCount = 0;
  const realtimeClient = createClient(SUPABASE_URL, SUPABASE_ANON);
  const channel = realtimeClient
    .channel(`graffiti-chat:${streamId}`)
    .on("broadcast", { event: "chat_message" }, ({ payload }) => {
      realtimeCount++;
      const who = payload?.user?.displayName || payload?.user?.username || "?";
      const body = String(payload?.content || "").slice(0, 80);
      log("📡", `REALTIME #${realtimeCount} ← ${who}: ${body}`);
    })
    .on(
      "postgres_changes",
      { event: "INSERT", schema: "public", table: "messages", filter: `stream_id=eq.${streamId}` },
      (payload) => {
        realtimeCount++;
        log("🗄️", `DB INSERT #${realtimeCount} — msg id: ${payload.new?.id}`);
      }
    );

  await new Promise((resolve) => {
    channel.subscribe((status) => {
      if (status === "SUBSCRIBED") {
        log("🔌", `Realtime subscribed to graffiti-chat:${streamId}`);
        resolve();
      }
    });
  });

  const stats = { chat: 0, sound: 0, gift: 0, boum: 0, errors: 0 };
  const endAt = Date.now() + DURATION_MS;
  const timers = [];

  const scheduleNext = (bot) => {
    if (Date.now() >= endAt) return;

    const delay = randMs(400, 2800);
    const timer = setTimeout(async () => {
      const roll = Math.random();
      try {
        if (roll < 0.55) {
          const msg = pick(CHAOS_MESSAGES);
          const res = await postChat(bot.token, streamId, msg);
          if (res.ok) {
            stats.chat++;
            log("💬", `@${bot.username} CHAT OK → "${msg}"`);
          } else {
            stats.errors++;
            log("❌", `@${bot.username} CHAT ${res.status} → ${res.json.error || JSON.stringify(res.json)}`);
          }
        } else if (roll < 0.75) {
          const sound = pick(SOUNDS);
          const res = await postSound(bot.token, streamId, sound);
          if (res.ok) {
            stats.sound++;
            log("🔊", `@${bot.username} SOUND OK → ${sound}`);
          } else {
            stats.errors++;
            log("❌", `@${bot.username} SOUND ${res.status} → ${res.json.error || "fail"}`);
          }
        } else if (roll < 0.9) {
          const amount = pick([10, 25, 50, 100]);
          const res = await postTokenAction(bot.token, {
            action: "gift",
            toUserId: streamerId,
            streamId,
            amount,
          });
          if (res.ok) {
            stats.gift++;
            log("💜", `@${bot.username} GIFT OK → ${amount} tokens`);
          } else {
            stats.errors++;
            log("❌", `@${bot.username} GIFT ${res.status} → ${res.json.error || "fail"}`);
          }
        } else {
          const res = await postTokenAction(bot.token, {
            action: "boum",
            toUserId: streamerId,
            streamId,
            amount: 5,
          });
          if (res.ok) {
            stats.boum++;
            log("🔥", `@${bot.username} BOUM! OK`);
          } else {
            stats.errors++;
            log("❌", `@${bot.username} BOUM ${res.status} → ${res.json.error || "fail"}`);
          }
        }
      } catch (err) {
        stats.errors++;
        log("💥", `@${bot.username} exception: ${err.message}`);
      }
      scheduleNext(bot);
    }, delay);
    timers.push(timer);
  };

  bots.forEach(scheduleNext);

  await new Promise((r) => setTimeout(r, DURATION_MS + 500));
  timers.forEach(clearTimeout);
  await realtimeClient.removeChannel(channel);

  log("📊", "─── SUMMARY ───");
  log("📊", `Chat messages sent:  ${stats.chat}`);
  log("📊", `Soundboard triggers: ${stats.sound}`);
  log("📊", `Token gifts:         ${stats.gift}`);
  log("📊", `BOUM! reactions:     ${stats.boum}`);
  log("📊", `Errors:              ${stats.errors}`);
  log("📊", `Realtime events rx:  ${realtimeCount}`);
  log("✅", "Chaos load test complete");
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});