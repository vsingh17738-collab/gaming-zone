import "server-only";

import { createHash } from "node:crypto";
import { sql } from "drizzle-orm";
import { getDb } from "@/db";
import { rateLimits } from "@/db/schema";
import { AppError } from "./errors";

export async function rateLimit(request: Request, purpose: string, limit = 10, windowSeconds = 60) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const key = createHash("sha256").update(`${purpose}:${ip}`).digest("hex");
  const windowStartedAt = new Date(Math.floor(Date.now() / (windowSeconds * 1000)) * windowSeconds * 1000);
  const expiresAt = new Date(windowStartedAt.getTime() + windowSeconds * 2000);
  const rows = await getDb().insert(rateLimits).values({ key, windowStartedAt, expiresAt })
    .onConflictDoUpdate({
      target: [rateLimits.key, rateLimits.windowStartedAt],
      set: { count: sql`${rateLimits.count} + 1`, expiresAt },
    })
    .returning({ count: rateLimits.count });
  if ((rows[0]?.count ?? limit + 1) > limit) {
    throw new AppError("Too many requests. Please wait and try again.", 429, "RATE_LIMITED");
  }
}
