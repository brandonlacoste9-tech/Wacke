import { eq, desc, and, sql } from "drizzle-orm";
import { db } from "./client";
import {
  users,
  streams,
  messages,
  tokenTransactions,
  follows,
  reactions,
} from "./schema";

// ─── User Queries ─────────────────────────────────────────────────────────────

export async function getUserByUsername(username: string) {
  return db.query.users.findFirst({
    where: eq(users.username, username),
    with: { streams: true },
  });
}

export async function getUserBySupabaseId(supabaseId: string) {
  return db.query.users.findFirst({
    where: eq(users.supabaseId, supabaseId),
  });
}

// ─── Stream Queries ───────────────────────────────────────────────────────────

/**
 * Returns all currently live streams ordered by viewer count (descending).
 * Supports optional category filtering. Used for the homepage featured grid and browse page.
 */
export async function getLiveStreams(limit = 20, category?: string) {
  const conditions = [eq(streams.status, "live")];
  if (category) {
    conditions.push(eq(streams.category, category as any));
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
  return db.query.streams.findFirst({
    where: eq(streams.userId, userId),
    with: { user: true },
  });
}

// ─── Message Queries ──────────────────────────────────────────────────────────

/**
 * Fetches the last N messages for a stream (for initial chat hydration).
 * Real-time updates are handled by Supabase Realtime subscriptions.
 */
export async function getRecentMessages(streamId: string, limit = 50) {
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

// ─── Token Queries ────────────────────────────────────────────────────────────

export async function getUserTokenBalance(userId: string) {
  const result = await db
    .select({ balance: users.tokenBalance })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  return result[0]?.balance ?? 0;
}

/**
 * Atomic token transfer: deducts from sender, credits receiver,
 * and logs the transaction in a single operation.
 */
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

// ─── Follow Queries ───────────────────────────────────────────────────────────

export async function getFollowerCount(userId: string) {
  const result = await db
    .select({ count: sql<number>`count(*)` })
    .from(follows)
    .where(eq(follows.followingId, userId));
  return result[0]?.count ?? 0;
}

export async function isFollowing(followerId: string, followingId: string) {
  const result = await db.query.follows.findFirst({
    where: and(
      eq(follows.followerId, followerId),
      eq(follows.followingId, followingId)
    ),
  });
  return !!result;
}

// ─── Reaction Queries ─────────────────────────────────────────────────────────

export async function getStreamReactionCount(streamId: string) {
  const result = await db
    .select({ count: sql<number>`count(*)` })
    .from(reactions)
    .where(eq(reactions.streamId, streamId));
  return result[0]?.count ?? 0;
}
