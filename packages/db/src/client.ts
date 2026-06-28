import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import * as schema from "./schema";

// Lazy singleton — only initializes when first accessed at runtime,
// not at module import time (prevents build-time "no DATABASE_URL" errors).
let _db: PostgresJsDatabase<typeof schema> | null = null;
let _client: ReturnType<typeof postgres> | null = null;

export const isDbMocked = (): boolean => {
  const url = process.env.DATABASE_URL;
  return !url || url.includes("postgresql://user:password") || url === "";
};

export function getDb(): PostgresJsDatabase<typeof schema> {
  if (isDbMocked()) {
    // Return empty proxy to avoid postgres initialization crashes
    return {} as any;
  }

  if (!_db) {
    const url = process.env.DATABASE_URL;
    if (!url) {
      throw new Error(
        "DATABASE_URL environment variable is not set. " +
          "Add it to your .env.local or Vercel environment variables."
      );
    }
    // Use postgres.js with Supabase transaction pooler (port 6543)
    // max: 1 is optimal for serverless — each invocation gets one connection
    _client = postgres(url, {
      max: 1,
      ssl: "require",
      idle_timeout: 20,
      connect_timeout: 10,
    });
    _db = drizzle(_client, { schema });
  }
  return _db;
}

// Convenience proxy — behaves like the old `db` export but initializes lazily.
export const db = new Proxy({} as PostgresJsDatabase<typeof schema>, {
  get(_target, prop) {
    if (isDbMocked()) {
      return undefined;
    }
    return (getDb() as any)[prop];
  },
});

export type DB = typeof db;

