import postgres from "postgres";

const url = "postgresql://postgres.ulbfaxhsbbckotcbmslk:SB6y6LVc9ZfGvaPm@aws-1-us-east-2.pooler.supabase.com:6543/postgres?sslmode=require";

const sql = postgres(url);

async function check() {
  const users = await sql`SELECT * FROM users WHERE username = 'mock_kick_user'`;
  console.log("Mock Kick User:", users);

  const twitchUsers = await sql`SELECT * FROM users WHERE username = 'brandonlacoste' OR username LIKE '%twitch%'`;
  console.log("Twitch Users:", twitchUsers);

  process.exit(0);
}

check();
