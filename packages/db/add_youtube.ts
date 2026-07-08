import postgres from "postgres";

const sql = postgres(process.env.DATABASE_URL as string);

async function main() {
  try {
    await sql`ALTER TABLE "users" ADD COLUMN "youtube_channel_id" text;`;
    console.log("Column added");
  } catch (err) {
    console.log(err);
  }
  process.exit(0);
}
main();
