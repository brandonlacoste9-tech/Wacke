import postgres from "postgres";
import { config } from "dotenv";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(__dirname, "../../apps/web/.env.local") });
config({ path: resolve(__dirname, "../../.env.local") });

const url = process.env.DATABASE_URL;
if (!url) {
  console.log("NO_DATABASE_URL — skip migrate");
  process.exit(0);
}

const sql = postgres(url, { ssl: "require", max: 1 });

try {
  await sql.unsafe(`
    DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'resonance_phase') THEN
        CREATE TYPE resonance_phase AS ENUM ('calm', 'rising', 'critical', 'overload');
      END IF;
    END $$;
  `);

  await sql.unsafe(`
    CREATE TABLE IF NOT EXISTS resonance_chambers (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      slug text NOT NULL UNIQUE,
      meter_value numeric(6,2) NOT NULL DEFAULT 0.00,
      phase resonance_phase NOT NULL DEFAULT 'calm',
      decay_rate numeric(5,2) NOT NULL DEFAULT 2.00,
      peak_value numeric(6,2) NOT NULL DEFAULT 0.00,
      overload_count integer NOT NULL DEFAULT 0,
      last_event_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now(),
      created_at timestamptz NOT NULL DEFAULT now()
    );
  `);

  await sql.unsafe(`
    CREATE TABLE IF NOT EXISTS resonance_events (
      id serial PRIMARY KEY,
      chamber_id uuid NOT NULL REFERENCES resonance_chambers(id) ON DELETE CASCADE,
      user_id uuid,
      kind text NOT NULL,
      intensity numeric(5,2) NOT NULL,
      metadata jsonb DEFAULT '{}',
      created_at timestamptz NOT NULL DEFAULT now()
    );
  `);

  await sql.unsafe(
    `CREATE INDEX IF NOT EXISTS resonance_chambers_slug_idx ON resonance_chambers(slug);`
  );
  await sql.unsafe(
    `CREATE INDEX IF NOT EXISTS resonance_events_chamber_id_created_at_idx ON resonance_events(chamber_id, created_at);`
  );

  const rows = await sql`SELECT count(*)::int AS c FROM resonance_chambers`;
  console.log("TABLES_OK resonance_chambers count=", rows[0].c);
} catch (e) {
  console.error("MIGRATE_FAIL", e.message || e);
  process.exit(1);
} finally {
  await sql.end({ timeout: 2 });
}
