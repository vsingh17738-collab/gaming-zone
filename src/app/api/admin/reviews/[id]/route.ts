import { eq } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/db";
import { reviews } from "@/db/schema";
import { apiRoute, dataResponse, readJson } from "@/lib/api";
import { requireAdmin } from "@/lib/auth";
import { writeAuditLog } from "@/lib/audit";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  return apiRoute(async () => {
    const admin = await requireAdmin();
    const { id } = await params;
    const input = z.object({ isApproved: z.boolean() }).parse(await readJson(request));
    const updated = await getDb().update(reviews).set({ isApproved: input.isApproved }).where(eq(reviews.id, id)).returning();
    await writeAuditLog({ actorId: admin.id, action: "review.moderate", entityType: "review", entityId: id, metadata: input, request });
    return dataResponse({ review: updated[0] });
  });
}
