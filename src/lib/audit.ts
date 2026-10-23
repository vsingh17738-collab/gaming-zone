import "server-only";

import { createHash } from "node:crypto";
import { getDb } from "@/db";
import { auditLogs } from "@/db/schema";

export async function writeAuditLog(input: {
  actorId?: string;
  action: string;
  entityType: string;
  entityId?: string;
  metadata?: Record<string, unknown>;
  request?: Request;
}) {
  const ip = input.request?.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  await getDb().insert(auditLogs).values({
    actorId: input.actorId,
    action: input.action,
    entityType: input.entityType,
    entityId: input.entityId,
    metadata: input.metadata,
    ipHash: ip ? createHash("sha256").update(ip).digest("hex") : undefined,
  });
}
