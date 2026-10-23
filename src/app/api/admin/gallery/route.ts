import { asc } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getDb } from "@/db";
import { gallery } from "@/db/schema";
import { apiRoute, dataResponse, readJson } from "@/lib/api";
import { requireAdmin } from "@/lib/auth";
import { galleryAdminSchema } from "@/lib/validation";
import { writeAuditLog } from "@/lib/audit";

export async function GET() {
  return apiRoute(async () => {
    await requireAdmin();
    return dataResponse({ gallery: await getDb().select().from(gallery).orderBy(asc(gallery.sortOrder)) });
  });
}

export async function POST(request: Request) {
  return apiRoute(async () => {
    const admin = await requireAdmin();
    const input = galleryAdminSchema.parse(await readJson(request));
    const inserted = await getDb().insert(gallery).values(input).returning();
    await writeAuditLog({ actorId: admin.id, action: "gallery.create", entityType: "gallery", entityId: inserted[0]?.id, request });
    revalidatePath("/gallery");
    return dataResponse({ item: inserted[0] }, 201);
  });
}
