import { db } from "./src/index.js";
import { users } from "./src/schema.js";
import { eq } from "drizzle-orm";

async function main() {
  console.log("Testing Drizzle DB connection for update...");
  
  try {
    const supabaseId = "f47ac10b-58cc-4372-a567-0e02b2c3d479";
    console.log("Querying user by supabaseId...");
    let dbUser = await db.query.users.findFirst({
      where: eq(users.supabaseId, supabaseId),
    });
    
    console.log("User found:", dbUser);

    if (dbUser) {
      console.log("Updating user...");
      const [updatedUser] = await db
        .update(users)
        .set({
          displayName: "Test User Updated",
          updatedAt: new Date(),
        })
        .where(eq(users.id, dbUser.id))
        .returning();
      console.log("Updated user:", updatedUser);
    }
  } catch (error) {
    console.error("DB Error:", error);
  }

  process.exit(0);
}

main();
