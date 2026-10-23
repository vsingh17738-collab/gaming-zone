import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { services } from "@/db/schema";
import { apiRoute, dataResponse, readJson } from "@/lib/api";
import { requireAdmin } from "@/lib/auth";
import { serviceAdminSchema } from "@/lib/validation";
import { writeAuditLog } from "@/lib/audit";
import { revalidatePath } from "next/cache";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  return apiRoute(async () => {
    const admin = await requireAdmin();
    const { id } = await params;
    const input = serviceAdminSchema.parse(await readJson(request));
    const updated = await getDb().update(services).set({ ...input, updatedAt: new Date() }).where(eq(services.id, id)).returning();
    await writeAuditLog({ actorId: admin.id, action: "service.update", entityType: "service", entityId: id, request });
    revalidatePath("/services");
    return dataResponse({ service: updated[0] });
  });
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  return apiRoute(async () => {
    const admin = await requireAdmin();
    const { id } = await params;
    await getDb().delete(services).where(eq(services.id, id));
    await writeAuditLog({ actorId: admin.id, action: "service.delete", entityType: "service", entityId: id, request });
    revalidatePath("/services");
    return dataResponse({ deleted: true });
  });
}
