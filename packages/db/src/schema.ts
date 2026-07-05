import {
  pgTable,
  text,
  varchar,
  uuid,
  timestamp,
  integer,
  boolean,
  pgEnum,
  index,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// ─── Enums ────────────────────────────────────────────────────────────────────

export const streamStatusEnum = pgEnum("stream_status", [
  "offline",
  "live",
  "ended",
]);

export const tokenTransactionTypeEnum = pgEnum("token_transaction_type", [
  "earn",   // Watching streams, daily login
  "spend",  // Boum! reactions, gifting
  "gift",   // Gifting tokens to a streamer
  "refund",
]);

export const streamCategoryEnum = pgEnum("stream_category", [
  "gaming",
  "musique",
  "jeu",
  "chile",
  "frette",
  "art",
  "irl",
  "talk",
]);

// ─── Users ────────────────────────────────────────────────────────────────────

export const users = pgTable(
  "users",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    username: varchar("username", { length: 32 }).notNull().unique(),
    displayName: varchar("display_name", { length: 64 }).notNull(),
    email: varchar("email", { length: 255 }).notNull().unique(),
    avatarUrl: text("avatar_url"),
    bio: text("bio"),
    // Supabase Auth integration — maps to auth.users.id
    supabaseId: uuid("supabase_id").unique(),
    // Token balance — denormalized for fast reads
    tokenBalance: integer("token_balance").notNull().default(500),
    // Streamer-specific fields
    isStreamer: boolean("is_streamer").notNull().default(false),
    muxStreamKey: text("mux_stream_key"),
    muxPlaybackId: text("mux_playback_id"),
    muxLiveStreamId: text("mux_live_stream_id"),
    // Linked accounts
    twitchUsername: text("twitch_username"),
    kickUsername: text("kick_username"),
    // Moderation
    isBanned: boolean("is_banned").notNull().default(false),
    isModerator: boolean("is_moderator").notNull().default(false),
    // Metadata
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => ({
    usernameIdx: index("users_username_idx").on(t.username),
    emailIdx: index("users_email_idx").on(t.email),
  })
);

// ─── Streams ──────────────────────────────────────────────────────────────────

export const streams = pgTable(
  "streams",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    title: varchar("title", { length: 128 }).notNull(),
    description: text("description"),
    category: streamCategoryEnum("category").notNull().default("irl"),
    status: streamStatusEnum("status").notNull().default("offline"),
    // Mux integration
    muxPlaybackId: text("mux_playback_id"),
    muxAssetId: text("mux_asset_id"),
    thumbnailUrl: text("thumbnail_url"),
    // Real-time stats (updated via webhook or polling)
    viewerCount: integer("viewer_count").notNull().default(0),
    peakViewerCount: integer("peak_viewer_count").notNull().default(0),
    // Wacké-specific: Mode Sacré flag
    sacreModeEnabled: boolean("sacre_mode_enabled").notNull().default(true),
    isMature: boolean("is_mature").notNull().default(false),
    // Timestamps
    startedAt: timestamp("started_at"),
    endedAt: timestamp("ended_at"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => ({
    userIdIdx: index("streams_user_id_idx").on(t.userId),
    statusIdx: index("streams_status_idx").on(t.status),
    categoryIdx: index("streams_category_idx").on(t.category),
  })
);

// ─── Chat Messages ────────────────────────────────────────────────────────────

export const messages = pgTable(
  "messages",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    streamId: uuid("stream_id")
      .notNull()
      .references(() => streams.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    content: text("content").notNull(),
    audioUrl: text("audio_url"),
    // Sacré mode: if true, message bypasses standard filter
    isSacre: boolean("is_sacre").notNull().default(false),
    // Moderation
    isDeleted: boolean("is_deleted").notNull().default(false),
    deletedBy: uuid("deleted_by"),
    // Metadata
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => ({
    streamIdIdx: index("messages_stream_id_idx").on(t.streamId),
    userIdIdx: index("messages_user_id_idx").on(t.userId),
    createdAtIdx: index("messages_created_at_idx").on(t.createdAt),
  })
);

// ─── Token Transactions ───────────────────────────────────────────────────────

export const tokenTransactions = pgTable(
  "token_transactions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    // The user initiating the transaction
    fromUserId: uuid("from_user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    // The user receiving tokens (null for earn/spend events)
    toUserId: uuid("to_user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    // The stream context (optional)
    streamId: uuid("stream_id").references(() => streams.id, {
      onDelete: "set null",
    }),
    type: tokenTransactionTypeEnum("type").notNull(),
    amount: integer("amount").notNull(),
    // Human-readable reason (e.g. "Boum! reaction", "Daily login bonus")
    reason: varchar("reason", { length: 128 }),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => ({
    fromUserIdx: index("token_tx_from_user_idx").on(t.fromUserId),
    toUserIdx: index("token_tx_to_user_idx").on(t.toUserId),
    streamIdx: index("token_tx_stream_idx").on(t.streamId),
  })
);

// ─── Follows ──────────────────────────────────────────────────────────────────

export const follows = pgTable(
  "follows",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    // The user who is following
    followerId: uuid("follower_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    // The streamer being followed
    followingId: uuid("following_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => ({
    followerIdx: index("follows_follower_idx").on(t.followerId),
    followingIdx: index("follows_following_idx").on(t.followingId),
  })
);

// ─── Reactions (Boum! system) ─────────────────────────────────────────────────

export const reactions = pgTable(
  "reactions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    streamId: uuid("stream_id")
      .notNull()
      .references(() => streams.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    // Reaction type: "boum" (fire), "suivre" (heart), "wacke" (skull)
    type: varchar("type", { length: 16 }).notNull().default("boum"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => ({
    streamIdIdx: index("reactions_stream_id_idx").on(t.streamId),
  })
);

// ─── Relations ────────────────────────────────────────────────────────────────

export const usersRelations = relations(users, ({ many }) => ({
  streams: many(streams),
  messages: many(messages),
  sentTransactions: many(tokenTransactions, { relationName: "fromUser" }),
  receivedTransactions: many(tokenTransactions, { relationName: "toUser" }),
  followers: many(follows, { relationName: "following" }),
  following: many(follows, { relationName: "follower" }),
  reactions: many(reactions),
}));

export const streamsRelations = relations(streams, ({ one, many }) => ({
  user: one(users, { fields: [streams.userId], references: [users.id] }),
  messages: many(messages),
  reactions: many(reactions),
  transactions: many(tokenTransactions),
}));

export const messagesRelations = relations(messages, ({ one }) => ({
  stream: one(streams, { fields: [messages.streamId], references: [streams.id] }),
  user: one(users, { fields: [messages.userId], references: [users.id] }),
}));

export const tokenTransactionsRelations = relations(tokenTransactions, ({ one }) => ({
  fromUser: one(users, {
    fields: [tokenTransactions.fromUserId],
    references: [users.id],
    relationName: "fromUser",
  }),
  toUser: one(users, {
    fields: [tokenTransactions.toUserId],
    references: [users.id],
    relationName: "toUser",
  }),
  stream: one(streams, {
    fields: [tokenTransactions.streamId],
    references: [streams.id],
  }),
}));

export const followsRelations = relations(follows, ({ one }) => ({
  follower: one(users, {
    fields: [follows.followerId],
    references: [users.id],
    relationName: "follower",
  }),
  following: one(users, {
    fields: [follows.followingId],
    references: [users.id],
    relationName: "following",
  }),
}));

export const reactionsRelations = relations(reactions, ({ one }) => ({
  stream: one(streams, { fields: [reactions.streamId], references: [streams.id] }),
  user: one(users, { fields: [reactions.userId], references: [users.id] }),
}));
