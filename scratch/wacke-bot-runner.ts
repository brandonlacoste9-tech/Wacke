/**
 * scratch/wacke-bot-runner.ts
 * Standalone TypeScript runner to launch WackeBot locally for testing.
 * Run with: npx ts-node scratch/wacke-bot-runner.ts
 */
import { WackeBotManager } from "../apps/web/lib/wacke-bot";
import * as dotenv from "dotenv";
import * as path from "path";

// Load environment variables from Wacke root .env file
dotenv.config({ path: path.resolve(__dirname, "../.env") });

async function run() {
  console.log("=== WACKE BOT RUNNER ===");
  const bot = WackeBotManager.getInstance();

  // Start the bot
  await bot.start();

  console.log("Bot running. Press Ctrl+C to stop.");

  // Handle graceful exits
  process.on("SIGINT", async () => {
    console.log("\nStopping bot...");
    await bot.stop();
    process.exit(0);
  });
}

run().catch((err) => {
  console.error("Runner crash error:", err);
  process.exit(1);
});
