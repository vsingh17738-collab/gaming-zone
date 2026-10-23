import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getDb } from "@/db";
import { gallery } from "@/db/schema";
import { apiRoute, dataResponse, readJson } from "@/lib/api";
import { requireAdmin } from "@/lib/auth";
import { galleryAdminSchema } from "@/lib/validation";
import { writeAuditLog } from "@/lib/audit";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  return apiRoute(async () => {
    const admin = await requireAdmin();
    const { id } = await params;
    const input = galleryAdminSchema.parse(await readJson(request));
    const updated = await getDb().update(gallery).set(input).where(eq(gallery.id, id)).returning();
    await writeAuditLog({ actorId: admin.id, action: "gallery.update", entityType: "gallery", entityId: id, request });
    revalidatePath("/gallery");
    return dataResponse({ item: updated[0] });
  });
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  return apiRoute(async () => {
    const admin = await requireAdmin();
    const { id } = await params;
    await getDb().delete(gallery).where(eq(gallery.id, id));
    await writeAuditLog({ actorId: admin.id, action: "gallery.delete", entityType: "gallery", entityId: id, request });
    revalidatePath("/gallery");
    return dataResponse({ deleted: true });
  });
}
