const postgres = require('postgres');

const connectionString = process.env.DATABASE_URL || "";
const sql = postgres(connectionString);

async function run() {
  try {
    console.log("Running manual migrations...");
    
    // Add columns to users table
    await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS cloudflare_stream_id text;`;
    await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS cloudflare_playback_id text;`;
    
    // Drop old Mux columns from users table
    await sql`ALTER TABLE users DROP COLUMN IF EXISTS mux_stream_key;`;
    await sql`ALTER TABLE users DROP COLUMN IF EXISTS mux_playback_id;`;
    await sql`ALTER TABLE users DROP COLUMN IF EXISTS mux_live_stream_id;`;
    
    // Add columns to streams table
    await sql`ALTER TABLE streams ADD COLUMN IF NOT EXISTS cloudflare_stream_id text;`;
    await sql`ALTER TABLE streams ADD COLUMN IF NOT EXISTS cloudflare_playback_id text;`;
    
    // Drop old Mux columns from streams table
    await sql`ALTER TABLE streams DROP COLUMN IF EXISTS mux_playback_id;`;
    await sql`ALTER TABLE streams DROP COLUMN IF EXISTS mux_asset_id;`;

    // Create heat_phase type if it doesn't exist
    await sql`
      DO $$ 
      BEGIN 
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'heat_phase') THEN 
          CREATE TYPE heat_phase AS ENUM ('idle', 'overload', 'cooldown'); 
        END IF; 
      END $$;
    `;

    // Create heat_chambers table
    await sql`
      CREATE TABLE IF NOT EXISTS heat_chambers (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        stream_id varchar(128) NOT NULL UNIQUE,
        level integer NOT NULL DEFAULT 0,
        phase heat_phase NOT NULL DEFAULT 'idle',
        updated_at timestamp NOT NULL DEFAULT now()
      );
    `;

    // Create heat_events table
    await sql`
      CREATE TABLE IF NOT EXISTS heat_events (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        stream_id varchar(128) NOT NULL,
        source varchar(32) NOT NULL,
        delta integer NOT NULL,
        created_at timestamp NOT NULL DEFAULT now()
      );
    `;

    // Indexes
    await sql`CREATE INDEX IF NOT EXISTS heat_chambers_stream_id_idx ON heat_chambers (stream_id);`;
    await sql`CREATE INDEX IF NOT EXISTS heat_events_stream_id_idx ON heat_events (stream_id);`;

    // ─── Resonance Chamber Migration ──────────────────────────────────────────

    // Create resonance_phase type if it doesn't exist
    await sql`
      DO $$ 
      BEGIN 
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'resonance_phase') THEN 
          CREATE TYPE resonance_phase AS ENUM ('calm', 'rising', 'critical', 'overload'); 
        END IF; 
      END $$;
    `;

    // Create resonance_chambers table
    await sql`
      CREATE TABLE IF NOT EXISTS resonance_chambers (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        slug text UNIQUE NOT NULL,
        meter_value numeric(6,2) NOT NULL DEFAULT 0.00,
        phase resonance_phase NOT NULL DEFAULT 'calm',
        decay_rate numeric(5,2) NOT NULL DEFAULT 2.00,
        peak_value numeric(6,2) NOT NULL DEFAULT 0.00,
        overload_count integer NOT NULL DEFAULT 0,
        last_event_at timestamp with time zone NOT NULL DEFAULT now(),
        updated_at timestamp with time zone NOT NULL DEFAULT now(),
        created_at timestamp with time zone NOT NULL DEFAULT now()
      );
    `;

    // Create resonance_events table (referencing public.users.id)
    await sql`
      CREATE TABLE IF NOT EXISTS resonance_events (
        id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
        chamber_id uuid NOT NULL REFERENCES resonance_chambers(id) ON DELETE CASCADE,
        user_id uuid REFERENCES users(id) ON DELETE SET NULL,
        kind text NOT NULL,
        intensity numeric(5,2) NOT NULL,
        metadata jsonb DEFAULT '{}',
        created_at timestamp with time zone NOT NULL DEFAULT now()
      );
    `;

    // Indexes
    await sql`CREATE INDEX IF NOT EXISTS resonance_chambers_slug_idx ON resonance_chambers (slug);`;
    await sql`CREATE INDEX IF NOT EXISTS resonance_events_chamber_created_idx ON resonance_events (chamber_id, created_at DESC);`;

    // apply_resonance security definer function
    await sql`
      CREATE OR REPLACE FUNCTION apply_resonance(p_chamber uuid, p_intensity numeric)
      RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
      DECLARE
        v_new numeric;
      BEGIN
        UPDATE resonance_chambers
          SET meter_value = LEAST(100.00, meter_value + p_intensity),
              last_event_at = now(),
              updated_at = now()
          WHERE id = p_chamber
          RETURNING meter_value INTO v_new;

        UPDATE resonance_chambers
          SET phase = CASE
                WHEN v_new >= 100.00 THEN 'overload'::resonance_phase
                WHEN v_new >= 75.00  THEN 'critical'::resonance_phase
                WHEN v_new >= 40.00  THEN 'rising'::resonance_phase
                ELSE 'calm'::resonance_phase END,
              peak_value = GREATEST(peak_value, v_new),
              overload_count = overload_count + (CASE WHEN v_new >= 100.00 THEN 1 ELSE 0 END)
          WHERE id = p_chamber;
      END $$;
    `;

    // Trigger function and trigger
    await sql`
      CREATE OR REPLACE FUNCTION trg_on_resonance_event_insert()
      RETURNS trigger AS $$
      BEGIN
        PERFORM apply_resonance(new.chamber_id, new.intensity);
        RETURN new;
      END;
      $$ LANGUAGE plpgsql;
    `;

    await sql`
      DROP TRIGGER IF EXISTS on_resonance_event_insert ON resonance_events;
    `;
    await sql`
      CREATE TRIGGER on_resonance_event_insert
      AFTER INSERT ON resonance_events
      FOR EACH ROW
      EXECUTE FUNCTION trg_on_resonance_event_insert();
    `;

    // decay_all_chambers function
    await sql`
      CREATE OR REPLACE FUNCTION decay_all_chambers()
      RETURNS void LANGUAGE sql AS $$
        UPDATE resonance_chambers
          SET meter_value = GREATEST(0.00, meter_value - decay_rate),
              updated_at = now()
          WHERE meter_value > 0.00 AND phase <> 'overload';
      $$;
    `;

    // RLS setup
    await sql`ALTER TABLE resonance_chambers ENABLE ROW LEVEL SECURITY;`;
    await sql`ALTER TABLE resonance_events ENABLE ROW LEVEL SECURITY;`;

    await sql`DROP POLICY IF EXISTS "allow select resonance_chambers" ON resonance_chambers;`;
    await sql`
      CREATE POLICY "allow select resonance_chambers" ON resonance_chambers
        FOR SELECT TO public
        USING (true);
    `;

    await sql`DROP POLICY IF EXISTS "allow insert resonance_events" ON resonance_events;`;
    await sql`
      CREATE POLICY "allow insert resonance_events" ON resonance_events
        FOR INSERT TO public
        WITH CHECK (
          (user_id IS NULL) OR 
          ((SELECT count(*) FROM resonance_events
            WHERE user_id = resonance_events.user_id
              AND created_at > now() - interval '2 seconds') < 15)
        );
    `;

    console.log("Migration complete!");
    process.exit(0);
  } catch (err) {
    console.error("Migration failed:", err);
    process.exit(1);
  }
}

run();
