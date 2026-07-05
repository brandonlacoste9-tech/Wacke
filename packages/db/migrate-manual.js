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

    console.log("Migration complete!");
    process.exit(0);
  } catch (err) {
    console.error("Migration failed:", err);
    process.exit(1);
  }
}

run();
