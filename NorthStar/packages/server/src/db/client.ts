import { config } from "dotenv";
import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema";

config();

export const site = process.env.SITE === "com" ? "com" : "cn";

export const databaseUrl = process.env.DATABASE_URL;

export const pool = databaseUrl
  ? new pg.Pool({
      connectionString: databaseUrl,
    })
  : null;

export const db = pool ? drizzle(pool, { schema }) : null;
