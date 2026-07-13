import { eq, desc, and, or, sql, gt } from "drizzle-orm";
import { db, isDbMocked } from "./client";
import {
  users,
  streams,
  messages,
  tokenTransactions,
  follows,
  reactions,
  heatChambers,
  heatEvents,
  resonanceChambers,
  resonanceEvents,
} from "./schema";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export const isValidUuid = (val: any): boolean => typeof val === "string" && UUID_REGEX.test(val);

// ─── Top Kick Streamers fallbacks list ──────────────────────────────────────
export const TOP_KICK_STREAMERS = [
  "odablock",
  "xqc",
  "adinross",
  "amouranth",
  "roshtein",
  "trainwreckstv",
  "westcol",
  "billybrown"
];

// Helper to determine category dynamically
const getStreamerCategory = (username: string): string => {
  if (["xqc", "adinross"].includes(username)) return "gaming";
  if (["roshtein", "trainwreckstv"].includes(username)) return "talk";
  if (username === "amouranth") return "irl";
  return "gaming";
};

// Helper to determine stream title dynamically
const getStreamerTitle = (username: string): string => {
  if (username === "odablock") return "👑 DMM ALLSTARS REVIEW !dmm | !socials | !discord";
  if (username === "xqc") return "🎮 MULTI-GAME SHENANIGANS & REACTS - Chill stream";
  if (username === "adinross") return "🔥 TALK SHOW & GUESTS - Pull up";
  return "🔴 LIVE STREAM FROM KICK.COM";
};

// ─── Global In-Memory Mock Store for Zero-Config Fallback ───────────────────
declare global {
  var mockUsers: any[] | undefined;
  var mockStreams: any[] | undefined;
  var mockMessages: any[] | undefined;
  var mockFollows: any[] | undefined;
  var mockTokenTransactions: any[] | undefined;
  var mockHeatChambers: any[] | undefined;
  var mockHeatEvents: any[] | undefined;
}

export function getMockDbState() {
  if (!globalThis.mockUsers) {
    globalThis.mockUsers = [
      {
        id: "mock-user-1",
        username: "gabriel",
        displayName: "Gabriel 🏪",
        email: "gabriel@mock.wacke.ca",
        avatarUrl: null,
        bio: "Broadcaster Wacké de test.",
        tokenBalance: 1200,
        isStreamer: true,
        cloudflareStreamId: "mock-live-stream-id-gabriel",
        cloudflarePlaybackId: "mock_playback_id",
        twitchUsername: null,
        kickUsername: null,
        youtubeChannelId: null,
        isBanned: false,
        isModerator: false,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: "mock-user-2",
        username: "sophie",
        displayName: "Sophie 🎮",
        email: "sophie@mock.wacke.ca",
        avatarUrl: null,
        bio: "NHL 26 streamer.",
        tokenBalance: 450,
        isStreamer: true,
        cloudflareStreamId: "mock-live-stream-id-sophie",
        cloudflarePlaybackId: "mock_playback_id",
        twitchUsername: null,
        kickUsername: null,
        youtubeChannelId: null,
        isBanned: false,
        isModerator: false,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];
  }

  if (!globalThis.mockStreams) {
    globalThis.mockStreams = [
      {
        id: "mock-stream-1",
        userId: "mock-user-1",
        title: "🏪 Dépanneur drama avec les boys",
        description: "On jase de tout et de rien en direct du dep. Venez poser vos questions!",
        category: "talk",
        status: "live",
        cloudflarePlaybackId: "mock_playback_id",
        viewerCount: 142,
        peakViewerCount: 300,
        sacreModeEnabled: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: "mock-stream-2",
        userId: "mock-user-2",
        title: "🎮 Tournoi de hockey du vendredi",
        description: "NHL 26 avec les chums. Le perdant mange une poutine épicée.",
        category: "gaming",
        status: "live",
        cloudflarePlaybackId: "mock_playback_id",
        viewerCount: 89,
        peakViewerCount: 150,
        sacreModeEnabled: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];
  }

  if (!globalThis.mockMessages) {
    globalThis.mockMessages = [
      {
        id: "mock-msg-1",
        streamId: "mock-stream-1",
        userId: "mock-user-2",
        content: "Salut Gabriel, c'est ben cool ta chaîne!",
        isSacre: false,
        isDeleted: false,
        createdAt: new Date(Date.now() - 5 * 60 * 1000),
        user: {
          id: "mock-user-2",
          username: "sophie",
          displayName: "Sophie 🎮",
          avatarUrl: null
        }
      },
      {
        id: "mock-msg-2",
        streamId: "mock-stream-1",
        userId: "mock-user-1",
        content: "Osti oui, merci Sophie! 🔥 En direct du dep!",
        isSacre: true,
        isDeleted: false,
        createdAt: new Date(Date.now() - 3 * 60 * 1000),
        user: {
          id: "mock-user-1",
          username: "gabriel",
          displayName: "Gabriel 🏪",
          avatarUrl: null
        }
      }
    ];
  }

  if (!globalThis.mockFollows) {
    globalThis.mockFollows = [];
  }

  if (!globalThis.mockTokenTransactions) {
    globalThis.mockTokenTransactions = [];
  }

  return {
    users: globalThis.mockUsers,
    streams: globalThis.mockStreams,
    messages: globalThis.mockMessages,
    follows: globalThis.mockFollows,
    transactions: globalThis.mockTokenTransactions,
  };
}

// ─── User Queries ─────────────────────────────────────────────────────────────

export async function getUserByUsername(username: string) {
  const cleanUsername = username.toLowerCase().trim();

  if (isDbMocked()) {
    const state = getMockDbState();
    let user = state.users.find((u) => u.username === cleanUsername);
    
    // Auto-generate profile if it is one of the fallback Kick streamers
    if (!user && TOP_KICK_STREAMERS.includes(cleanUsername)) {
      user = {
        id: "kick-mock-streamer-" + cleanUsername,
        username: cleanUsername,
        displayName: cleanUsername.charAt(0).toUpperCase() + cleanUsername.slice(1),
        email: `${cleanUsername}@kick.com`,
        avatarUrl: null,
        bio: `Streamer officiel de Kick.com. Regarde son live ici sur Wacké!`,
        tokenBalance: 0,
        isStreamer: true,
        isBanned: false,
        isModerator: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      state.users.push(user);
    }

    if (!user) return null;
    const stream = state.streams.find((s) => s.userId === user.id);
    return { ...user, streams: stream ? [stream] : [] };
  }

  let dbUser = await db.query.users.findFirst({
    where: eq(users.username, cleanUsername),
    with: { streams: true },
  });

  // Database fallback: if user does not exist in DB but is a famous Kick channel
  if (!dbUser && TOP_KICK_STREAMERS.includes(cleanUsername)) {
    dbUser = {
      id: "kick-mock-streamer-" + cleanUsername,
      supabaseId: "kick-mock-uuid-" + cleanUsername,
      username: cleanUsername,
      displayName: cleanUsername.charAt(0).toUpperCase() + cleanUsername.slice(1),
      email: `${cleanUsername}@kick.com`,
      avatarUrl: null,
      bio: `Streamer officiel de Kick.com. Regarde son live ici sur Wacké!`,
      tokenBalance: 0,
      isStreamer: true,
      cloudflareStreamId: null,
      cloudflarePlaybackId: null,
      muxLiveStreamId: null,
      muxPlaybackId: null,
      muxStreamKey: null,
      twitchUsername: null,
      kickUsername: cleanUsername,
      youtubeChannelId: null,
      isBanned: false,
      isModerator: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      streams: [],
    };
  }

  return dbUser;
}

export async function getUserBySupabaseId(supabaseId: string) {
  if (isDbMocked()) {
    const state = getMockDbState();
    const user = state.users.find((u) => u.supabaseId === supabaseId);
    return user || null;
  }

  if (!isValidUuid(supabaseId)) {
    return null;
  }

  return db.query.users.findFirst({
    where: eq(users.supabaseId, supabaseId),
  });
}

export async function getUserByCloudflareStreamId(liveStreamId: string) {
  if (isDbMocked()) {
    const state = getMockDbState();
    return state.users.find((u) => u.cloudflareStreamId === liveStreamId) || null;
  }
  return db.query.users.findFirst({
    where: eq(users.cloudflareStreamId, liveStreamId),
  });
}

/**
 * Synchronizes the logged-in user profile from Supabase Auth into our Postgres database.
 */
export async function syncUser({
  supabaseId,
  email,
  username,
  displayName,
}: {
  supabaseId: string;
  email: string;
  username: string;
  displayName: string;
}) {
  if (isDbMocked()) {
    const state = getMockDbState();
    let user = state.users.find((u) => u.supabaseId === supabaseId);
    if (!user) {
      user = {
        id: "mock-user-id-" + Math.random().toString(36).substring(5),
        supabaseId,
        email,
        username,
        displayName,
        avatarUrl: null,
        bio: null,
        tokenBalance: 500,
        isStreamer: false,
        isBanned: false,
        isModerator: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      state.users.push(user);
    }
    return user;
  }

  // Check if exists by supabaseId OR email
  let dbUser = await db.query.users.findFirst({
    where: or(eq(users.supabaseId, supabaseId), eq(users.email, email)),
  });

  if (!dbUser) {
    // Ensure username is unique before inserting
    let finalUsername = username;
    let usernameExists = await db.query.users.findFirst({
      where: eq(users.username, finalUsername),
    });
    
    if (usernameExists) {
      finalUsername = `${username}_${Math.random().toString(36).substring(2, 6)}`;
    }

    const [newUser] = await db
      .insert(users)
      .values({
        supabaseId,
        email,
        username: finalUsername,
        displayName,
        tokenBalance: 500,
      })
      .returning();
    dbUser = newUser;
  } else if (!dbUser.supabaseId && supabaseId) {
    // Link supabaseId if it was previously null
    const [updatedUser] = await db
      .update(users)
      .set({ supabaseId })
      .where(eq(users.id, dbUser.id))
      .returning();
    dbUser = updatedUser;
  }

  return dbUser;
}

// ─── Stream Queries ───────────────────────────────────────────────────────────

export async function getStreamById(streamId: string) {
  if (isDbMocked()) {
    const state = getMockDbState();
    return state.streams.find((s) => s.id === streamId) || null;
  }

  if (!isValidUuid(streamId)) {
    return null;
  }

  return db.query.streams.findFirst({
    where: eq(streams.id, streamId),
  });
}

export async function getLiveStreams(limit = 20, category?: string, search?: string) {
  let activeStreamsList: any[] = [];

  if (isDbMocked()) {
    const state = getMockDbState();
    activeStreamsList = state.streams.filter((s) => s.status === "live");
  } else {
    const conditions = [eq(streams.status, "live")];
    if (category) {
      conditions.push(eq(streams.category, category as any));
    }
    if (search) {
      conditions.push(
        sql`lower(${streams.title}) like ${"%" + search.toLowerCase() + "%"}`
      );
    }

    try {
      activeStreamsList = await db.query.streams.findMany({
        where: and(...conditions),
        orderBy: [desc(streams.viewerCount)],
        limit,
        with: {
          user: {
            columns: {
              id: true,
              username: true,
              displayName: true,
              avatarUrl: true,
            },
          },
        },
      });
    } catch (err) {
      console.error("[GET_LIVE_STREAMS_DB_ERROR]", err);
    }
  }

  // If there are no streams online in the database, return the famous Kick streamers as live feeds
  if (activeStreamsList.length === 0) {
    const fallbackStreams = TOP_KICK_STREAMERS.map((username, index) => ({
      id: `kick-mock-stream-${username}`,
      userId: `kick-mock-streamer-${username}`,
      title: getStreamerTitle(username),
      description: `Watch ${username} stream live via direct Kick.com integration on Wacké.`,
      category: getStreamerCategory(username),
      status: "live",
      cloudflarePlaybackId: "mock_playback_id",
      viewerCount: 4200 + index * 1250,
      sacreModeEnabled: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      user: {
        id: `kick-mock-streamer-${username}`,
        username,
        displayName: username.charAt(0).toUpperCase() + username.slice(1),
        avatarUrl: null,
      },
    }));

    const filtered = category
      ? fallbackStreams.filter((s) => s.category === category)
      : fallbackStreams;

    if (search) {
      const cleanSearch = search.toLowerCase();
      return filtered.filter(
        (s) =>
          s.title.toLowerCase().includes(cleanSearch) ||
          s.user.displayName.toLowerCase().includes(cleanSearch)
      ).slice(0, limit);
    }

    return filtered.slice(0, limit);
  }

  return activeStreamsList;
}

export async function getStreamByUserId(userId: string) {
  if (isDbMocked()) {
    const state = getMockDbState();
    let stream = state.streams.find((s) => s.userId === userId);
    
    // Auto-generate stream profile if it is one of the fallback Kick streamers
    if (!stream && userId.startsWith("kick-mock-streamer-")) {
      const username = userId.replace("kick-mock-streamer-", "");
      stream = {
        id: "kick-mock-stream-" + username,
        userId,
        title: getStreamerTitle(username),
        description: `Watch ${username} stream live via direct Kick.com integration on Wacké.`,
        category: getStreamerCategory(username),
        status: "live",
        cloudflarePlaybackId: "mock_playback_id",
        viewerCount: 14200,
        sacreModeEnabled: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      state.streams.push(stream);
    }

    if (!stream) return null;
    const streamer = state.users.find((u) => u.id === userId);
    return { ...stream, user: streamer || null };
  }

  if (!isValidUuid(userId)) {
    // Database fallback: if stream does not exist in DB but belongs to a famous Kick channel
    if (userId.startsWith("kick-mock-streamer-")) {
      const username = userId.replace("kick-mock-streamer-", "");
      return {
        id: "kick-mock-stream-" + username,
        userId,
        title: getStreamerTitle(username),
        description: `Watch ${username} stream live via direct Kick.com integration on Wacké.`,
        category: getStreamerCategory(username) as any,
        status: "live",
        cloudflarePlaybackId: "mock_playback_id",
        viewerCount: 9400,
        sacreModeEnabled: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any;
    }
    return null;
  }

  let dbStream = await db.query.streams.findFirst({
    where: eq(streams.userId, userId),
    with: { user: true },
  });

  // Database fallback: if stream does not exist in DB but belongs to a famous Kick channel
  if (!dbStream && userId.startsWith("kick-mock-streamer-")) {
    const username = userId.replace("kick-mock-streamer-", "");
    dbStream = {
      id: "kick-mock-stream-" + username,
      userId,
      title: getStreamerTitle(username),
      description: `Watch ${username} stream live via direct Kick.com integration on Wacké.`,
      category: getStreamerCategory(username) as any,
      status: "live",
      cloudflarePlaybackId: "mock_playback_id",
      viewerCount: 9400,
      sacreModeEnabled: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as any;
  }

  return dbStream;
}

export async function upsertStream({
  userId,
  title,
  category,
  sacreModeEnabled,
  cloudflarePlaybackId,
}: {
  userId: string;
  title: string;
  category: string;
  sacreModeEnabled: boolean;
  cloudflarePlaybackId: string | null;
}) {
  if (isDbMocked()) {
    const state = getMockDbState();
    let stream = state.streams.find((s) => s.userId === userId);
    if (stream) {
      stream.title = title;
      stream.category = category;
      stream.sacreModeEnabled = sacreModeEnabled;
      stream.cloudflarePlaybackId = cloudflarePlaybackId;
      stream.status = "offline";
      stream.updatedAt = new Date();
    } else {
      stream = {
        id: "mock-stream-id-" + Math.random().toString(36).substring(5),
        userId,
        title,
        category,
        status: "offline",
        cloudflarePlaybackId,
        sacreModeEnabled,
        viewerCount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      state.streams.push(stream);
    }
    return stream;
  }

  const existingStream = await db.query.streams.findFirst({
    where: eq(streams.userId, userId),
  });

  if (existingStream) {
    const [updatedStream] = await db
      .update(streams)
      .set({
        title,
        category: category as any,
        cloudflarePlaybackId,
        sacreModeEnabled,
        status: "offline",
        updatedAt: new Date(),
      })
      .where(eq(streams.userId, userId))
      .returning();
    return updatedStream;
  }

  const [newStream] = await db
    .insert(streams)
    .values({
      userId,
      title,
      category: category as any,
      status: "offline",
      cloudflarePlaybackId,
      sacreModeEnabled,
    })
    .returning();

  return newStream;
}

export async function updateStreamStatus(userId: string, status: "live" | "offline" | "ended") {
  if (isDbMocked()) {
    const state = getMockDbState();
    const stream = state.streams.find((s) => s.userId === userId);
    if (stream) {
      stream.status = status;
      if (status === "live") {
        stream.startedAt = new Date();
      } else if (status === "ended") {
        stream.endedAt = new Date();
      }
      stream.updatedAt = new Date();
    }
    return;
  }

  await db
    .update(streams)
    .set({ status, updatedAt: new Date(), ...(status === "live" ? { startedAt: new Date() } : {}), ...(status === "ended" ? { endedAt: new Date() } : {}) })
    .where(eq(streams.userId, userId));
}

export async function updateStreamStatusByCloudflareId(liveStreamId: string, status: "live" | "offline" | "ended") {
  if (isDbMocked()) {
    const state = getMockDbState();
    const user = state.users.find((u) => u.cloudflareStreamId === liveStreamId);
    if (user) {
      await updateStreamStatus(user.id, status);
    }
    return;
  }

  const dbUser = await db.query.users.findFirst({
    where: eq(users.cloudflareStreamId, liveStreamId),
  });
  if (dbUser) {
    await db
      .update(streams)
      .set({ status, updatedAt: new Date(), ...(status === "live" ? { startedAt: new Date() } : {}) })
      .where(eq(streams.userId, dbUser.id));
  }
}

export async function updateUserCloudflareCredentials({
  userId,
  cloudflareStreamId,
  cloudflarePlaybackId,
}: {
  userId: string;
  cloudflareStreamId: string | null;
  cloudflarePlaybackId: string | null;
}) {
  if (isDbMocked()) {
    const state = getMockDbState();
    const user = state.users.find((u) => u.id === userId);
    if (user) {
      user.cloudflareStreamId = cloudflareStreamId;
      user.cloudflarePlaybackId = cloudflarePlaybackId;
      user.isStreamer = true;
      user.updatedAt = new Date();
    }
    return;
  }

  await db
    .update(users)
    .set({
      cloudflareStreamId,
      cloudflarePlaybackId,
      isStreamer: true,
      updatedAt: new Date(),
    })
    .where(eq(users.id, userId));
}

export async function updateUserProfile({
  userId,
  displayName,
  bio,
  avatarUrl,
  twitchUsername,
  kickUsername,
  youtubeChannelId,
}: {
  userId: string;
  displayName?: string;
  bio?: string;
  avatarUrl?: string;
  twitchUsername?: string;
  kickUsername?: string;
  youtubeChannelId?: string;
}) {
  if (isDbMocked()) {
    const state = getMockDbState();
    const user = state.users.find((u: any) => u.id === userId);
    if (user) {
      if (displayName !== undefined) user.displayName = displayName;
      if (bio !== undefined) user.bio = bio;
      if (avatarUrl !== undefined) user.avatarUrl = avatarUrl;
      if (twitchUsername !== undefined) user.twitchUsername = twitchUsername;
      if (kickUsername !== undefined) user.kickUsername = kickUsername;
      if (youtubeChannelId !== undefined) user.youtubeChannelId = youtubeChannelId;
      user.updatedAt = new Date();
    }
    return user;
  }

  const updates: Record<string, any> = { updatedAt: new Date() };
  if (displayName !== undefined) updates.displayName = displayName;
  if (bio !== undefined) updates.bio = bio;
  if (avatarUrl !== undefined) updates.avatarUrl = avatarUrl;
  if (twitchUsername !== undefined) updates.twitchUsername = twitchUsername || null;
  if (kickUsername !== undefined) updates.kickUsername = kickUsername || null;
  if (youtubeChannelId !== undefined) updates.youtubeChannelId = youtubeChannelId || null;

  const [updated] = await db
    .update(users)
    .set(updates)
    .where(eq(users.id, userId))
    .returning();
  return updated;
}

export async function endStream(userId: string) {
  if (isDbMocked()) {
    const state = getMockDbState();
    const stream = state.streams.find((s) => s.userId === userId);
    if (stream) {
      stream.status = "ended";
      stream.endedAt = new Date();
      stream.updatedAt = new Date();
    }
    const user = state.users.find((u) => u.id === userId);
    if (user) {
      user.cloudflareStreamId = null;
      user.updatedAt = new Date();
    }
    return;
  }

  await db
    .update(streams)
    .set({ status: "ended", endedAt: new Date(), updatedAt: new Date() })
    .where(eq(streams.userId, userId));

  await db
    .update(users)
    .set({
      cloudflareStreamId: null,
      updatedAt: new Date(),
    })
    .where(eq(users.id, userId));
}

// ─── Message Queries ──────────────────────────────────────────────────────────

export async function getRecentMessages(streamId: string, limit = 50) {
  if (isDbMocked()) {
    const state = getMockDbState();
    const streamMessages = state.messages.filter(
      (m) => m.streamId === streamId && !m.isDeleted
    );
    return streamMessages
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, limit);
  }

  if (!isValidUuid(streamId)) {
    return [];
  }

  return db.query.messages.findMany({
    where: and(messages.streamId ? eq(messages.streamId, streamId) : sql`true`, eq(messages.isDeleted, false)),
    orderBy: [desc(messages.createdAt)],
    limit,
    with: {
      user: {
        columns: {
          id: true,
          username: true,
          displayName: true,
          avatarUrl: true,
        },
      },
    },
  });
}

export async function createChatMessage({
  streamId,
  userId,
  content,
  isSacre,
  audioUrl,
}: {
  streamId: string;
  userId: string;
  content: string;
  isSacre: boolean;
  audioUrl?: string | null;
}) {
  if (isDbMocked()) {
    const state = getMockDbState();
    const sender = state.users.find((u) => u.id === userId);
    const newMessage = {
      id: "mock-msg-id-" + Math.random().toString(36).substring(5),
      streamId,
      userId,
      content,
      isSacre,
      audioUrl: audioUrl || null,
      isDeleted: false,
      createdAt: new Date(),
      user: sender
        ? {
            id: sender.id,
            username: sender.username,
            displayName: sender.displayName,
            avatarUrl: sender.avatarUrl,
          }
        : null,
    };
    state.messages.push(newMessage);
    return newMessage;
  }

  if (!isValidUuid(streamId) || !isValidUuid(userId)) {
    return {
      id: "mock-msg-id-" + Math.random().toString(36).substring(5),
      streamId,
      userId,
      content,
      isSacre,
      audioUrl: audioUrl || null,
      isDeleted: false,
      createdAt: new Date(),
    };
  }

  const [inserted] = await db
    .insert(messages)
    .values({
      streamId,
      userId,
      content,
      isSacre,
      audioUrl,
    })
    .returning();

  return inserted;
}

// ─── Token Queries ────────────────────────────────────────────────────────────

export async function getUserTokenBalance(userId: string) {
  if (isDbMocked()) {
    const state = getMockDbState();
    const user = state.users.find((u) => u.id === userId);
    return user?.tokenBalance ?? 0;
  }

  if (!isValidUuid(userId)) {
    return 0;
  }

  const result = await db
    .select({ balance: users.tokenBalance })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  return result[0]?.balance ?? 0;
}

export async function transferTokens({
  fromUserId,
  toUserId,
  streamId,
  amount,
  reason,
}: {
  fromUserId: string;
  toUserId: string;
  streamId?: string;
  amount: number;
  reason: string;
}) {
  if (isDbMocked()) {
    const state = getMockDbState();
    const sender = state.users.find((u) => u.id === fromUserId);
    const receiver = state.users.find((u) => u.id === toUserId);
    
    if (sender && receiver && sender.tokenBalance >= amount) {
      sender.tokenBalance -= amount;
      receiver.tokenBalance += amount;
      
      state.transactions.push({
        id: "mock-tx-" + Math.random().toString(36).substring(5),
        fromUserId,
        toUserId,
        streamId,
        type: "gift",
        amount,
        reason,
        createdAt: new Date(),
      });
      if (streamId) {
        const isReaction = reason.includes("reaction") || reason.includes("Reaction") || reason.includes("Boum") || reason.includes("Boom");
        const delta = isReaction ? 2 : Math.min(25, Math.max(1, Math.round(amount * 0.1)));
        await createResonanceEvent({ slug: streamId, userId: fromUserId, kind: isReaction ? "pulse" : "gift", intensity: delta });
      }
      return true;
    }
    throw new Error("Solde insuffisante ou utilisateurs introuvables");
  }

  if (!isValidUuid(fromUserId)) {
    throw new Error("ID de l'expéditeur invalide");
  }

  const isReceiverReal = toUserId && isValidUuid(toUserId);
  const isStreamReal = streamId && isValidUuid(streamId);

  return db.transaction(async (tx) => {
    // Deduct from sender
    await tx
      .update(users)
      .set({ tokenBalance: sql`${users.tokenBalance} - ${amount}` })
      .where(and(eq(users.id, fromUserId), sql`${users.tokenBalance} >= ${amount}`));

    if (isReceiverReal) {
      // Credit receiver
      await tx
        .update(users)
        .set({ tokenBalance: sql`${users.tokenBalance} + ${amount}` })
        .where(eq(users.id, toUserId));
    }

    // Log transaction
    await tx.insert(tokenTransactions).values({
      fromUserId,
      toUserId: isReceiverReal ? toUserId : null,
      streamId: isStreamReal ? streamId : null,
      type: "gift",
      amount,
      reason,
    });
  });
}

export async function claimDailyTokenReward(userId: string) {
  if (isDbMocked()) {
    const state = getMockDbState();
    const user = state.users.find((u) => u.id === userId);
    if (!user) throw new Error("Utilisateur introuvable");

    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const claims = state.transactions.filter(
      (tx) =>
        tx.toUserId === userId &&
        tx.type === "earn" &&
        tx.reason === "Récompense quotidienne" &&
        tx.createdAt > oneDayAgo
    );

    if (claims.length > 0) {
      const lastClaim = claims[claims.length - 1];
      return { success: false, lastClaimDate: lastClaim.createdAt };
    }

    const CLAIM_AMOUNT = 500;
    user.tokenBalance += CLAIM_AMOUNT;
    state.transactions.push({
      id: "mock-claim-" + Math.random().toString(36).substring(5),
      toUserId: userId,
      type: "earn",
      amount: CLAIM_AMOUNT,
      reason: "Récompense quotidienne",
      createdAt: new Date(),
    });

    return { success: true, newBalance: user.tokenBalance };
  }

  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const lastClaim = await db.query.tokenTransactions.findFirst({
    where: and(
      eq(tokenTransactions.toUserId, userId),
      eq(tokenTransactions.type, "earn"),
      eq(tokenTransactions.reason, "Récompense quotidienne"),
      gt(tokenTransactions.createdAt, oneDayAgo)
    ),
    orderBy: [desc(tokenTransactions.createdAt)],
  });

  if (lastClaim) {
    return { success: false, lastClaimDate: lastClaim.createdAt };
  }

  const CLAIM_AMOUNT = 500;
  await db.transaction(async (tx) => {
    await tx
      .update(users)
      .set({ tokenBalance: sql`${users.tokenBalance} + ${CLAIM_AMOUNT}` })
      .where(eq(users.id, userId));

    await tx.insert(tokenTransactions).values({
      toUserId: userId,
      type: "earn",
      amount: CLAIM_AMOUNT,
      reason: "Récompense quotidienne",
    });
  });

  const updatedBalance = await getUserTokenBalance(userId);
  return { success: true, newBalance: updatedBalance };
}

export async function deductTokens({
  userId,
  amount,
  reason,
  streamId,
}: {
  userId: string;
  amount: number;
  reason: string;
  streamId?: string;
}) {
  if (isDbMocked()) {
    const state = getMockDbState();
    const user = state.users.find((u) => u.id === userId);
    if (!user) throw new Error("Utilisateur introuvable");

    if (amount > 0 && user.tokenBalance < amount) {
      throw new Error("Solde de jetons insuffisant");
    }

    user.tokenBalance -= amount;

    state.transactions.push({
      id: "mock-tx-" + Math.random().toString(36).substring(5),
      fromUserId: amount > 0 ? userId : null,
      toUserId: amount < 0 ? userId : null,
      streamId,
      type: amount > 0 ? "spend" : "refund",
      amount: Math.abs(amount),
      reason,
      createdAt: new Date(),
    });

    if (streamId && amount > 0) {
      await createResonanceEvent({ slug: streamId, userId, kind: "chaos", intensity: Math.round(amount * 0.2) });
    }

    return true;
  }

  const isStreamReal = streamId && isValidUuid(streamId);

  return db.transaction(async (tx) => {
    if (amount > 0) {
      const [updatedUser] = await tx
        .update(users)
        .set({ tokenBalance: sql`${users.tokenBalance} - ${amount}` })
        .where(and(eq(users.id, userId), sql`${users.tokenBalance} >= ${amount}`))
        .returning();

      if (!updatedUser) {
        throw new Error("Solde de jetons insuffisant");
      }

      await tx.insert(tokenTransactions).values({
        fromUserId: userId,
        streamId: isStreamReal ? streamId : null,
        type: "spend",
        amount,
        reason,
      });

      // 30% of chaos spend → streamer earnings ledger
      await creditChaosShareToStreamer({
        streamId,
        amountSpent: amount,
        spendReason: reason,
        fromUserId: userId,
        txClient: tx,
      });
    } else {
      const absoluteAmount = Math.abs(amount);
      await tx
        .update(users)
        .set({ tokenBalance: sql`${users.tokenBalance} + ${absoluteAmount}` })
        .where(eq(users.id, userId));

      await tx.insert(tokenTransactions).values({
        toUserId: userId,
        streamId: isStreamReal ? streamId : null,
        type: "refund",
        amount: absoluteAmount,
        reason,
      });
    }
    // Heat meter charged by API routes (with realtime broadcast).
  });
}

// ─── Chaos share (streamer earnings from spend) ───────────────────────────────

/** 30% of chaos token spends credited to the streamer. */
export const CHAOS_SHARE_PERCENT = 30;

export function chaosShareAmount(amountSpent: number): number {
  if (amountSpent <= 0) return 0;
  return Math.floor((amountSpent * CHAOS_SHARE_PERCENT) / 100);
}

/**
 * Credit the streamer 30% of a chaos spend (TTS / sacre / spray / sound).
 * Gifts/Boum already transfer 100% via transferTokens — do not call this for those.
 */
export async function creditChaosShareToStreamer({
  streamId,
  amountSpent,
  spendReason,
  fromUserId,
  txClient,
}: {
  streamId?: string;
  amountSpent: number;
  spendReason: string;
  fromUserId: string;
  txClient?: any;
}) {
  if (!streamId || amountSpent <= 0) return null;

  const share = chaosShareAmount(amountSpent);
  if (share <= 0) return null;

  // Resolve streamer from real stream UUID only
  let streamerId: string | null = null;

  if (isDbMocked()) {
    const state = getMockDbState();
    const stream = state.streams.find((s: any) => s.id === streamId);
    streamerId = stream?.userId ?? null;
    if (!streamerId || streamerId === fromUserId) return null;

    const streamer = state.users.find((u: any) => u.id === streamerId);
    if (!streamer) return null;
    streamer.tokenBalance = (streamer.tokenBalance || 0) + share;
    state.transactions.push({
      id: "mock-chaos-share-" + Math.random().toString(36).slice(2, 8),
      fromUserId: null,
      toUserId: streamerId,
      streamId,
      type: "earn",
      amount: share,
      reason: `Chaos share 30%: ${spendReason}`.slice(0, 128),
      createdAt: new Date(),
    });
    return { streamerId, share };
  }

  if (!isValidUuid(streamId)) return null;

  const client = txClient || db;

  const streamRows = await client
    .select({ userId: streams.userId })
    .from(streams)
    .where(eq(streams.id, streamId))
    .limit(1);

  streamerId = streamRows[0]?.userId ?? null;
  if (!streamerId || streamerId === fromUserId) return null;

  await client
    .update(users)
    .set({ tokenBalance: sql`${users.tokenBalance} + ${share}` })
    .where(eq(users.id, streamerId));

  await client.insert(tokenTransactions).values({
    fromUserId: null,
    toUserId: streamerId,
    streamId,
    type: "earn",
    amount: share,
    reason: `Chaos share 30%: ${spendReason}`.slice(0, 128),
  });

  return { streamerId, share };
}

/** Aggregate streamer earnings from chaos share + gifts/boum. */
export async function getStreamerEarnings(userId: string, limit = 20) {
  if (isDbMocked()) {
    const state = getMockDbState();
    const incoming = state.transactions
      .filter((t: any) => t.toUserId === userId && (t.type === "earn" || t.type === "gift"))
      .sort(
        (a: any, b: any) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

    const chaosShareTotal = incoming
      .filter((t: any) => t.type === "earn" && String(t.reason || "").includes("Chaos share"))
      .reduce((s: number, t: any) => s + (t.amount || 0), 0);

    const giftTotal = incoming
      .filter((t: any) => t.type === "gift")
      .reduce((s: number, t: any) => s + (t.amount || 0), 0);

    return {
      chaosShareTotal,
      giftTotal,
      totalEarned: chaosShareTotal + giftTotal,
      recent: incoming.slice(0, limit),
      sharePercent: CHAOS_SHARE_PERCENT,
    };
  }

  if (!isValidUuid(userId)) {
    return {
      chaosShareTotal: 0,
      giftTotal: 0,
      totalEarned: 0,
      recent: [],
      sharePercent: CHAOS_SHARE_PERCENT,
    };
  }

  const recent = await db
    .select()
    .from(tokenTransactions)
    .where(
      and(
        eq(tokenTransactions.toUserId, userId),
        or(
          eq(tokenTransactions.type, "earn"),
          eq(tokenTransactions.type, "gift")
        )
      )
    )
    .orderBy(desc(tokenTransactions.createdAt))
    .limit(limit);

  const allEarn = await db
    .select({
      amount: tokenTransactions.amount,
      type: tokenTransactions.type,
      reason: tokenTransactions.reason,
    })
    .from(tokenTransactions)
    .where(
      and(
        eq(tokenTransactions.toUserId, userId),
        or(
          eq(tokenTransactions.type, "earn"),
          eq(tokenTransactions.type, "gift")
        )
      )
    );

  let chaosShareTotal = 0;
  let giftTotal = 0;
  for (const row of allEarn) {
    if (row.type === "gift") giftTotal += row.amount;
    else if (row.reason?.includes("Chaos share")) chaosShareTotal += row.amount;
  }

  return {
    chaosShareTotal,
    giftTotal,
    totalEarned: chaosShareTotal + giftTotal,
    recent,
    sharePercent: CHAOS_SHARE_PERCENT,
  };
}

// ─── Follow Queries ───────────────────────────────────────────────────────────

export async function getFollowerCount(userId: string) {
  if (isDbMocked()) {
    const state = getMockDbState();
    return state.follows.filter((f) => f.followingId === userId).length;
  }

  const result = await db
    .select({ count: sql<number>`count(*)` })
    .from(follows)
    .where(eq(follows.followingId, userId));
  return result[0]?.count ?? 0;
}

export async function isFollowing(followerId: string, followingId: string) {
  if (isDbMocked()) {
    const state = getMockDbState();
    return state.follows.some(
      (f) => f.followerId === followerId && f.followingId === followingId
    );
  }

  const result = await db.query.follows.findFirst({
    where: and(
      eq(follows.followerId, followerId),
      eq(follows.followingId, followingId)
    ),
  });
  return !!result;
}

export async function toggleFollow({
  followerId,
  followingId,
}: {
  followerId: string;
  followingId: string;
}) {
  if (isDbMocked()) {
    const state = getMockDbState();
    const idx = state.follows.findIndex(
      (f) => f.followerId === followerId && f.followingId === followingId
    );
    if (idx !== -1) {
      state.follows.splice(idx, 1);
      return { following: false, message: "Désabonné avec succès 💔" };
    } else {
      state.follows.push({
        id: "mock-follow-" + Math.random().toString(36).substring(5),
        followerId,
        followingId,
        createdAt: new Date(),
      });
      return { following: true, message: "Abonné avec succès 💜" };
    }
  }

  const existing = await db.query.follows.findFirst({
    where: and(
      eq(follows.followerId, followerId),
      eq(follows.followingId, followingId)
    ),
  });

  if (existing) {
    await db
      .delete(follows)
      .where(
        and(eq(follows.followerId, followerId), eq(follows.followingId, followingId))
      );
    return { following: false, message: "Désabonné avec succès 💔" };
  } else {
    await db.insert(follows).values({ followerId, followingId });
    return { following: true, message: "Abonné avec succès 💜" };
  }
}

// ─── Reaction Queries ─────────────────────────────────────────────────────────

export async function getStreamReactionCount(streamId: string) {
  if (isDbMocked()) {
    return 14;
  }

  if (!isValidUuid(streamId)) {
    return 0;
  }

  const result = await db
    .select({ count: sql<number>`count(*)` })
    .from(reactions)
    .where(eq(reactions.streamId, streamId));
  return result[0]?.count ?? 0;
}

// ─── Leaderboard Queries ──────────────────────────────────────────────────────

export async function getDailyTopSpenders(limit = 5) {
  if (isDbMocked()) {
    const state = getMockDbState();
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const spenderSums: Record<string, number> = {};

    state.transactions.forEach((tx) => {
      // both fromUserId must be valid, and the transaction occurred within the last 24h
      if (tx.fromUserId && tx.createdAt > oneDayAgo && (tx.type === "spend" || tx.type === "gift")) {
        spenderSums[tx.fromUserId] = (spenderSums[tx.fromUserId] || 0) + tx.amount;
      }
    });

    return Object.entries(spenderSums)
      .map(([userId, totalSpent]) => {
        const user = state.users.find((u) => u.id === userId);
        return {
          id: userId,
          username: user?.username ?? "user",
          displayName: user?.displayName ?? "User",
          avatarUrl: user?.avatarUrl ?? null,
          totalSpent,
        };
      })
      .sort((a, b) => b.totalSpent - a.totalSpent)
      .slice(0, limit);
  }

  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const result = await db
    .select({
      id: users.id,
      username: users.username,
      displayName: users.displayName,
      avatarUrl: users.avatarUrl,
      totalSpent: sql<number>`sum(${tokenTransactions.amount})`,
    })
    .from(tokenTransactions)
    .innerJoin(users, eq(tokenTransactions.fromUserId, users.id))
    .where(
      and(
        gt(tokenTransactions.createdAt, oneDayAgo),
        or(eq(tokenTransactions.type, "spend"), eq(tokenTransactions.type, "gift"))
      )
    )
    .groupBy(users.id)
    .orderBy(desc(sql`sum(${tokenTransactions.amount})`))
    .limit(limit);

  return result.map(r => ({
    id: r.id,
    username: r.username,
    displayName: r.displayName,
    avatarUrl: r.avatarUrl,
    totalSpent: Number(r.totalSpent || 0)
  }));
}

export async function addTokens({
  userId,
  amount,
  reason,
  streamId,
}: {
  userId: string;
  amount: number;
  reason: string;
  streamId?: string;
}) {
  if (isDbMocked()) {
    const state = getMockDbState();
    const user = state.users.find((u) => u.id === userId);
    if (user) {
      user.tokenBalance += amount;
    }
    state.transactions.push({
      id: crypto.randomUUID(),
      fromUserId: null,
      toUserId: userId,
      streamId: streamId ?? null,
      type: "earn",
      amount,
      reason,
      createdAt: new Date(),
    });
    return;
  }

  await db.transaction(async (tx) => {
    // 1. Credit user balance
    await tx
      .update(users)
      .set({ tokenBalance: sql`${users.tokenBalance} + ${amount}` })
      .where(eq(users.id, userId));

    // 2. Log in transactions ledger
    await tx.insert(tokenTransactions).values({
      toUserId: userId,
      type: "earn",
      amount,
      reason,
      streamId,
    });
  });
}

// ─── Resonance Chamber Query Helpers ──────────────────────────────────────────

export async function createResonanceEvent({
  slug,
  userId,
  kind,
  intensity,
  metadata = {},
  txClient = db,
}: {
  slug: string;
  userId?: string | null;
  kind: string;
  intensity: number;
  metadata?: any;
  txClient?: any;
}) {
  try {
    // Slugs are streamer handles / mock stream ids (NOT UUIDs). Only skip DB when mocked.
    if (isDbMocked()) {
      if (!(globalThis as any).mockResonanceChambers) (globalThis as any).mockResonanceChambers = [];
      if (!(globalThis as any).mockResonanceEvents) (globalThis as any).mockResonanceEvents = [];

      let chamber = (globalThis as any).mockResonanceChambers.find((c: any) => c.slug === slug);
      if (!chamber) {
        chamber = {
          id: "mock-chamber-" + crypto.randomUUID(),
          slug,
          meterValue: "0.00",
          phase: "calm",
          decayRate: "2.00",
          peakValue: "0.00",
          overloadCount: 0,
          lastEventAt: new Date(),
          updatedAt: new Date(),
          createdAt: new Date(),
        };
        (globalThis as any).mockResonanceChambers.push(chamber);
      }

      if (chamber.phase === "overload") {
        return chamber;
      }

      const currentVal = parseFloat(chamber.meterValue);
      const newVal = Math.min(100.0, currentVal + intensity);
      chamber.meterValue = newVal.toFixed(2);
      chamber.lastEventAt = new Date();
      chamber.updatedAt = new Date();
      chamber.peakValue = Math.max(parseFloat(chamber.peakValue), newVal).toFixed(2);

      const prevPhase = chamber.phase;
      chamber.phase =
        newVal >= 100 ? "overload" : newVal >= 75 ? "critical" : newVal >= 40 ? "rising" : "calm";
      if (chamber.phase === "overload" && prevPhase !== "overload") {
        chamber.overloadCount += 1;
      }

      (globalThis as any).mockResonanceEvents.push({
        id: (globalThis as any).mockResonanceEvents.length + 1,
        chamberId: chamber.id,
        userId,
        kind,
        intensity: intensity.toFixed(2),
        metadata,
        createdAt: new Date(),
      });
      return chamber;
    }

    // 1. Get or create resonance chamber (DB path)
    let chamber;
    const existing = await txClient
      .select()
      .from(resonanceChambers)
      .where(eq(resonanceChambers.slug, slug))
      .limit(1);

    if (existing.length > 0) {
      chamber = existing[0];
    } else {
      const [inserted] = await txClient
        .insert(resonanceChambers)
        .values({
          slug,
          meterValue: "0.00",
          phase: "calm",
        })
        .returning();
      chamber = inserted;
    }

    if (chamber.phase === "overload") {
      return chamber;
    }

    // 2. Application-level accumulation (works even if DB trigger is missing)
    const currentVal = parseFloat(String(chamber.meterValue));
    const newVal = Math.min(100, currentVal + intensity);
    const newPhase =
      newVal >= 100 ? "overload" : newVal >= 75 ? "critical" : newVal >= 40 ? "rising" : "calm";
    const prevPhase = chamber.phase;
    const peak = Math.max(parseFloat(String(chamber.peakValue ?? "0")), newVal);
    const overloadCount =
      newPhase === "overload" && prevPhase !== "overload"
        ? (chamber.overloadCount || 0) + 1
        : chamber.overloadCount || 0;

    await txClient
      .insert(resonanceEvents)
      .values({
        chamberId: chamber.id,
        userId: userId && isValidUuid(userId) ? userId : null,
        kind,
        intensity: intensity.toFixed(2),
        metadata,
      });

    const [updated] = await txClient
      .update(resonanceChambers)
      .set({
        meterValue: newVal.toFixed(2),
        phase: newPhase as any,
        peakValue: peak.toFixed(2),
        overloadCount,
        lastEventAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(resonanceChambers.slug, slug))
      .returning();

    return updated;
  } catch (err) {
    console.error("[CREATE_RESONANCE_EVENT_ERROR]", err);
    // Fall back to in-process mock so local UI never fully dies
    if (!(globalThis as any).mockResonanceChambers) (globalThis as any).mockResonanceChambers = [];
    let chamber = (globalThis as any).mockResonanceChambers.find((c: any) => c.slug === slug);
    if (!chamber) {
      chamber = {
        id: "mock-chamber-" + crypto.randomUUID(),
        slug,
        meterValue: "0.00",
        phase: "calm",
        decayRate: "2.00",
        peakValue: "0.00",
        overloadCount: 0,
        lastEventAt: new Date(),
        updatedAt: new Date(),
        createdAt: new Date(),
      };
      (globalThis as any).mockResonanceChambers.push(chamber);
    }
    if (chamber.phase !== "overload") {
      const currentVal = parseFloat(chamber.meterValue);
      const newVal = Math.min(100, currentVal + intensity);
      chamber.meterValue = newVal.toFixed(2);
      chamber.phase =
        newVal >= 100 ? "overload" : newVal >= 75 ? "critical" : newVal >= 40 ? "rising" : "calm";
      chamber.updatedAt = new Date();
      chamber.peakValue = Math.max(parseFloat(chamber.peakValue), newVal).toFixed(2);
      if (chamber.phase === "overload") chamber.overloadCount += 1;
    }
    return chamber;
  }
}

export async function getOrCreateResonanceChamber(slug: string) {
  if (isDbMocked()) {
    if (!(globalThis as any).mockResonanceChambers) (globalThis as any).mockResonanceChambers = [];
    let chamber = (globalThis as any).mockResonanceChambers.find((c: any) => c.slug === slug);
    if (!chamber) {
      chamber = {
        id: "mock-chamber-" + crypto.randomUUID(),
        slug,
        meterValue: "0.00",
        phase: "calm",
        decayRate: "2.00",
        peakValue: "0.00",
        overloadCount: 0,
        lastEventAt: new Date(),
        updatedAt: new Date(),
        createdAt: new Date(),
      };
      (globalThis as any).mockResonanceChambers.push(chamber);
    }
    return chamber;
  }

  try {
    const existing = await db
      .select()
      .from(resonanceChambers)
      .where(eq(resonanceChambers.slug, slug))
      .limit(1);

    if (existing.length > 0) {
      return existing[0];
    }

    const [inserted] = await db
      .insert(resonanceChambers)
      .values({
        slug,
        meterValue: "0.00",
        phase: "calm",
      })
      .returning();

    return inserted;
  } catch (err) {
    console.error("[GET_OR_CREATE_RESONANCE_ERROR]", err);
    // Soft fallback for missing tables / connection issues
    if (!(globalThis as any).mockResonanceChambers) (globalThis as any).mockResonanceChambers = [];
    let chamber = (globalThis as any).mockResonanceChambers.find((c: any) => c.slug === slug);
    if (!chamber) {
      chamber = {
        id: "mock-chamber-" + crypto.randomUUID(),
        slug,
        meterValue: "0.00",
        phase: "calm",
        decayRate: "2.00",
        peakValue: "0.00",
        overloadCount: 0,
        lastEventAt: new Date(),
        updatedAt: new Date(),
        createdAt: new Date(),
      };
      (globalThis as any).mockResonanceChambers.push(chamber);
    }
    return chamber;
  }
}

export async function transitionResonancePhase(
  slug: string,
  phase: "calm" | "rising" | "critical" | "overload"
) {
  if (isDbMocked()) {
    if (!(globalThis as any).mockResonanceChambers) (globalThis as any).mockResonanceChambers = [];
    let chamber = (globalThis as any).mockResonanceChambers.find((c: any) => c.slug === slug);
    if (!chamber) {
      chamber = {
        id: "mock-chamber-" + crypto.randomUUID(),
        slug,
        meterValue: "0.00",
        phase: "calm",
        decayRate: "2.00",
        peakValue: "0.00",
        overloadCount: 0,
        lastEventAt: new Date(),
        updatedAt: new Date(),
        createdAt: new Date(),
      };
      (globalThis as any).mockResonanceChambers.push(chamber);
    }
    chamber.phase = phase;
    if (phase === "calm") {
      chamber.meterValue = "0.00";
    }
    chamber.updatedAt = new Date();
    return chamber;
  }

  try {
    const updates: Record<string, any> = {
      phase,
      updatedAt: new Date(),
    };
    if (phase === "calm") {
      updates.meterValue = "0.00";
    }

    const [updated] = await db
      .update(resonanceChambers)
      .set(updates)
      .where(eq(resonanceChambers.slug, slug))
      .returning();

    if (updated) return updated;

    // Chamber missing — create then transition
    await getOrCreateResonanceChamber(slug);
    const [again] = await db
      .update(resonanceChambers)
      .set(updates)
      .where(eq(resonanceChambers.slug, slug))
      .returning();
    return again;
  } catch (err) {
    console.error("[TRANSITION_RESONANCE_ERROR]", err);
    if (!(globalThis as any).mockResonanceChambers) (globalThis as any).mockResonanceChambers = [];
    let chamber = (globalThis as any).mockResonanceChambers.find((c: any) => c.slug === slug);
    if (!chamber) {
      chamber = {
        id: "mock-chamber-" + crypto.randomUUID(),
        slug,
        meterValue: "0.00",
        phase: "calm",
        decayRate: "2.00",
        peakValue: "0.00",
        overloadCount: 0,
        lastEventAt: new Date(),
        updatedAt: new Date(),
        createdAt: new Date(),
      };
      (globalThis as any).mockResonanceChambers.push(chamber);
    }
    chamber.phase = phase;
    if (phase === "calm") chamber.meterValue = "0.00";
    chamber.updatedAt = new Date();
    return chamber;
  }
}
