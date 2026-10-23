import "server-only";

import { neonConfig, Pool } from "@neondatabase/serverless";
import { drizzle, type NeonDatabase } from "drizzle-orm/neon-serverless";
import ws from "ws";
import * as schema from "./schema";

if (typeof WebSocket === "undefined") {
  neonConfig.webSocketConstructor = ws;
}

declare global {
  var __shaamDbPool: Pool | undefined;
  var __shaamDb: NeonDatabase<typeof schema> | undefined;
}

export class DatabaseNotConfiguredError extends Error {
  constructor() {
    super("DATABASE_URL is not configured");
    this.name = "DatabaseNotConfiguredError";
  }
}

export function isDatabaseConfigured() {
  return Boolean(process.env.DATABASE_URL);
}

export function getDb() {
  if (!process.env.DATABASE_URL) throw new DatabaseNotConfiguredError();
  if (!globalThis.__shaamDb) {
    const pool = globalThis.__shaamDbPool ?? new Pool({ connectionString: process.env.DATABASE_URL });
    globalThis.__shaamDbPool = pool;
    globalThis.__shaamDb = drizzle(pool, { schema });
  }
  return globalThis.__shaamDb;
}

export type Db = ReturnType<typeof getDb>;
export type Transaction = Parameters<Parameters<Db["transaction"]>[0]>[0];
