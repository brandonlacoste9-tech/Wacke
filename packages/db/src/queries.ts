import { eq, desc, and, sql, gt } from "drizzle-orm";
import { db, isDbMocked } from "./client";
import {
  users,
  streams,
  messages,
  tokenTransactions,
  follows,
  reactions,
} from "./schema";

// ─── Global In-Memory Mock Store for Zero-Config Fallback ───────────────────
declare global {
  var mockUsers: any[] | undefined;
  var mockStreams: any[] | undefined;
  var mockMessages: any[] | undefined;
  var mockFollows: any[] | undefined;
  var mockTokenTransactions: any[] | undefined;
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
        muxStreamKey: "mock-stream-key-gabriel",
        muxPlaybackId: "mock_playback_id",
        muxLiveStreamId: "mock-live-stream-id-gabriel",
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
        muxStreamKey: "mock-stream-key-sophie",
        muxPlaybackId: "mock_playback_id",
        muxLiveStreamId: "mock-live-stream-id-sophie",
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
        muxPlaybackId: "mock_playback_id",
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
        muxPlaybackId: "mock_playback_id",
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
  if (isDbMocked()) {
    const state = getMockDbState();
    const cleanUsername = username.toLowerCase();
    const user = state.users.find((u) => u.username === cleanUsername);
    if (!user) return null;
    const stream = state.streams.find((s) => s.userId === user.id);
    return { ...user, streams: stream ? [stream] : [] };
  }

  return db.query.users.findFirst({
    where: eq(users.username, username),
    with: { streams: true },
  });
}

export async function getUserBySupabaseId(supabaseId: string) {
  if (isDbMocked()) {
    const state = getMockDbState();
    const user = state.users.find((u) => u.supabaseId === supabaseId);
    return user || null;
  }

  return db.query.users.findFirst({
    where: eq(users.supabaseId, supabaseId),
  });
}

export async function getUserByMuxLiveStreamId(liveStreamId: string) {
  if (isDbMocked()) {
    const state = getMockDbState();
    return state.users.find((u) => u.muxLiveStreamId === liveStreamId) || null;
  }
  return db.query.users.findFirst({
    where: eq(users.muxLiveStreamId, liveStreamId),
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

  // Check if exists
  let dbUser = await db.query.users.findFirst({
    where: eq(users.supabaseId, supabaseId),
  });

  if (!dbUser) {
    const [newUser] = await db
      .insert(users)
      .values({
        supabaseId,
        email,
        username,
        displayName,
        tokenBalance: 500,
      })
      .returning();
    dbUser = newUser;
  }

  return dbUser;
}

// ─── Stream Queries ───────────────────────────────────────────────────────────

export async function getStreamById(streamId: string) {
  if (isDbMocked()) {
    const state = getMockDbState();
    return state.streams.find((s) => s.id === streamId) || null;
  }
  return db.query.streams.findFirst({
    where: eq(streams.id, streamId),
  });
}

export async function getLiveStreams(limit = 20, category?: string, search?: string) {
  if (isDbMocked()) {
    const state = getMockDbState();
    const activeStreams = state.streams.filter((s) => s.status === "live");
    let filtered = category
      ? activeStreams.filter((s) => s.category === category)
      : activeStreams;
    
    if (search) {
      const cleanSearch = search.toLowerCase();
      filtered = filtered.filter(
        (s) =>
          s.title.toLowerCase().includes(cleanSearch) ||
          s.description?.toLowerCase().includes(cleanSearch) ||
          s.category.toLowerCase().includes(cleanSearch)
      );
    }
    
    // Hydrate streamer profile
    return filtered.slice(0, limit).map((stream) => {
      const streamer = state.users.find((u) => u.id === stream.userId);
      return {
        ...stream,
        user: streamer
          ? {
              id: streamer.id,
              username: streamer.username,
              displayName: streamer.displayName,
              avatarUrl: streamer.avatarUrl,
            }
          : null,
      };
    });
  }

  const conditions = [eq(streams.status, "live")];
  if (category) {
    conditions.push(eq(streams.category, category as any));
  }
  if (search) {
    conditions.push(
      sql`lower(${streams.title}) like ${"%" + search.toLowerCase() + "%"}`
    );
  }

  return db.query.streams.findMany({
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
}

export async function getStreamByUserId(userId: string) {
  if (isDbMocked()) {
    const state = getMockDbState();
    const stream = state.streams.find((s) => s.userId === userId);
    if (!stream) return null;
    const streamer = state.users.find((u) => u.id === userId);
    return { ...stream, user: streamer || null };
  }

  return db.query.streams.findFirst({
    where: eq(streams.userId, userId),
    with: { user: true },
  });
}

export async function upsertStream({
  userId,
  title,
  category,
  sacreModeEnabled,
  muxPlaybackId,
  muxAssetId,
}: {
  userId: string;
  title: string;
  category: string;
  sacreModeEnabled: boolean;
  muxPlaybackId: string | null;
  muxAssetId: string | null;
}) {
  if (isDbMocked()) {
    const state = getMockDbState();
    let stream = state.streams.find((s) => s.userId === userId);
    if (stream) {
      stream.title = title;
      stream.category = category;
      stream.sacreModeEnabled = sacreModeEnabled;
      stream.muxPlaybackId = muxPlaybackId;
      stream.muxAssetId = muxAssetId;
      stream.status = "offline";
      stream.updatedAt = new Date();
    } else {
      stream = {
        id: "mock-stream-id-" + Math.random().toString(36).substring(5),
        userId,
        title,
        category,
        status: "offline",
        muxPlaybackId,
        muxAssetId,
        sacreModeEnabled,
        viewerCount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      state.streams.push(stream);
    }
    return stream;
  }

  const [stream] = await db
    .insert(streams)
    .values({
      userId,
      title,
      category: category as any,
      status: "offline",
      muxPlaybackId,
      muxAssetId,
      sacreModeEnabled,
    })
    .onConflictDoUpdate({
      target: streams.userId,
      set: {
        title,
        category: category as any,
        muxPlaybackId,
        muxAssetId,
        sacreModeEnabled,
        status: "offline",
        updatedAt: new Date(),
      },
    })
    .returning();

  return stream;
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

export async function updateStreamStatusByMuxId(liveStreamId: string, status: "live" | "offline" | "ended") {
  if (isDbMocked()) {
    const state = getMockDbState();
    const user = state.users.find((u) => u.muxLiveStreamId === liveStreamId);
    if (user) {
      await updateStreamStatus(user.id, status);
    }
    return;
  }

  const dbUser = await db.query.users.findFirst({
    where: eq(users.muxLiveStreamId, liveStreamId),
  });
  if (dbUser) {
    await db
      .update(streams)
      .set({ status, updatedAt: new Date(), ...(status === "live" ? { startedAt: new Date() } : {}) })
      .where(eq(streams.userId, dbUser.id));
  }
}

export async function updateUserMuxCredentials({
  userId,
  muxStreamKey,
  muxPlaybackId,
  muxLiveStreamId,
}: {
  userId: string;
  muxStreamKey: string | null;
  muxPlaybackId: string | null;
  muxLiveStreamId: string | null;
}) {
  if (isDbMocked()) {
    const state = getMockDbState();
    const user = state.users.find((u) => u.id === userId);
    if (user) {
      user.muxStreamKey = muxStreamKey;
      user.muxPlaybackId = muxPlaybackId;
      user.muxLiveStreamId = muxLiveStreamId;
      user.isStreamer = true;
      user.updatedAt = new Date();
    }
    return;
  }

  await db
    .update(users)
    .set({
      muxStreamKey,
      muxPlaybackId,
      muxLiveStreamId,
      isStreamer: true,
      updatedAt: new Date(),
    })
    .where(eq(users.id, userId));
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
      user.muxStreamKey = null;
      user.muxLiveStreamId = null;
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
      muxStreamKey: null,
      muxLiveStreamId: null,
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

  return db.query.messages.findMany({
    where: and(eq(messages.streamId, streamId), eq(messages.isDeleted, false)),
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
}: {
  streamId: string;
  userId: string;
  content: string;
  isSacre: boolean;
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

  const [inserted] = await db
    .insert(messages)
    .values({
      streamId,
      userId,
      content,
      isSacre,
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
      return true;
    }
    throw new Error("Solde insuffisant ou utilisateurs introuvables");
  }

  return db.transaction(async (tx) => {
    // Deduct from sender
    await tx
      .update(users)
      .set({ tokenBalance: sql`${users.tokenBalance} - ${amount}` })
      .where(and(eq(users.id, fromUserId), sql`${users.tokenBalance} >= ${amount}`));

    // Credit receiver
    await tx
      .update(users)
      .set({ tokenBalance: sql`${users.tokenBalance} + ${amount}` })
      .where(eq(users.id, toUserId));

    // Log transaction
    await tx.insert(tokenTransactions).values({
      fromUserId,
      toUserId,
      streamId,
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

  const result = await db
    .select({ count: sql<number>`count(*)` })
    .from(reactions)
    .where(eq(reactions.streamId, streamId));
  return result[0]?.count ?? 0;
}
