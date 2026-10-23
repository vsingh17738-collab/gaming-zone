import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { packages } from "@/db/schema";
import { apiRoute, dataResponse, readJson } from "@/lib/api";
import { requireAdmin } from "@/lib/auth";
import { packageAdminSchema } from "@/lib/validation";
import { writeAuditLog } from "@/lib/audit";
import { revalidatePath } from "next/cache";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  return apiRoute(async () => {
    const admin = await requireAdmin();
    const { id } = await params;
    const input = packageAdminSchema.parse(await readJson(request));
    const updated = await getDb().update(packages).set({ ...input, updatedAt: new Date() }).where(eq(packages.id, id)).returning();
    await writeAuditLog({ actorId: admin.id, action: "package.update", entityType: "package", entityId: id, request });
    revalidatePath("/packages");
    return dataResponse({ package: updated[0] });
  });
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  return apiRoute(async () => {
    const admin = await requireAdmin();
    const { id } = await params;
    await getDb().delete(packages).where(eq(packages.id, id));
    await writeAuditLog({ actorId: admin.id, action: "package.delete", entityType: "package", entityId: id, request });
    revalidatePath("/packages");
    return dataResponse({ deleted: true });
  });
}
