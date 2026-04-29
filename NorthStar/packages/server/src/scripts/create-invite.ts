import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import { inviteCodes } from "../db/schema.js";

const pool = new pg.Pool({ connectionString: "postgres://postgres:123456@localhost:5432/northstar" });
const db = drizzle(pool);

async function main() {
  const [row] = await db.insert(inviteCodes).values({
    code: "TEST-INVITE-001",
    site: "com",
    maxUses: 100,
    usedCount: 0,
    expiresAt: new Date("2027-12-31"),
    createdBy: null,
  }).returning();
  console.log("Invite code created:", row);
  await pool.end();
}

main().catch(e => { console.error(e); process.exit(1); });
