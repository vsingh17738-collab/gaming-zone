import { asc } from "drizzle-orm";
import { getDb } from "@/db";
import { services } from "@/db/schema";
import { apiRoute, dataResponse, readJson } from "@/lib/api";
import { requireAdmin } from "@/lib/auth";
import { serviceAdminSchema } from "@/lib/validation";
import { writeAuditLog } from "@/lib/audit";
import { revalidatePath } from "next/cache";

export async function GET() {
  return apiRoute(async () => {
    await requireAdmin();
    return dataResponse({ services: await getDb().select().from(services).orderBy(asc(services.sortOrder)) });
  });
}

export async function POST(request: Request) {
  return apiRoute(async () => {
    const admin = await requireAdmin();
    const input = serviceAdminSchema.parse(await readJson(request));
    const inserted = await getDb().insert(services).values(input).returning();
    await writeAuditLog({ actorId: admin.id, action: "service.create", entityType: "service", entityId: inserted[0]?.id, request });
    revalidatePath("/services");
    return dataResponse({ service: inserted[0] }, 201);
  });
}
