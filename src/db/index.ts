import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";

import * as schema from "./schema";

declare global {
  // eslint-disable-next-line no-var
  var __teamup_sql: ReturnType<typeof postgres> | undefined;
}

const databaseUrl = process.env.DATABASE_URL;

const sql = databaseUrl
  ? global.__teamup_sql ??
    postgres(databaseUrl, {
      // In serverless, prepared statements can cause issues.
      prepare: false,
      // Supabase pooler works best with lower concurrency per function.
      max: 5,
    })
  : null;

if (sql && process.env.NODE_ENV !== "production") {
  global.__teamup_sql = sql;
}

export const db = sql ? drizzle(sql, { schema }) : null;

export function requireDb() {
  if (!db) throw new Error("DATABASE_URL is not set");
  return db;
}
