import { requireDb } from "../src/db";
import { users, teams } from "../src/db/schema";

async function clearAccounts() {
  const db = requireDb();

  console.log("🗑️  Clearing all accounts and related data...");

  // Delete all teams (will cascade delete team members)
  const deletedTeams = await db.delete(teams);
  console.log(`✓ Deleted all teams`);

  // Delete all users (will cascade delete sessions, annual meeting registrations, contest registrations, and team members)
  const deletedUsers = await db.delete(users);
  console.log(`✓ Deleted all users`);

  console.log("✅ All accounts cleared successfully!");
  process.exit(0);
}

clearAccounts().catch((err) => {
  console.error("❌ Error clearing accounts:", err);
  process.exit(1);
});
