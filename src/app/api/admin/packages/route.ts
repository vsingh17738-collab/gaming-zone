import { asc } from "drizzle-orm";
import { getDb } from "@/db";
import { packages } from "@/db/schema";
import { apiRoute, dataResponse, readJson } from "@/lib/api";
import { requireAdmin } from "@/lib/auth";
import { packageAdminSchema } from "@/lib/validation";
import { writeAuditLog } from "@/lib/audit";
import { revalidatePath } from "next/cache";

export async function GET() {
  return apiRoute(async () => {
    await requireAdmin();
    return dataResponse({ packages: await getDb().select().from(packages).orderBy(asc(packages.sortOrder)) });
  });
}

export async function POST(request: Request) {
  return apiRoute(async () => {
    const admin = await requireAdmin();
    const input = packageAdminSchema.parse(await readJson(request));
    const inserted = await getDb().insert(packages).values(input).returning();
    await writeAuditLog({ actorId: admin.id, action: "package.create", entityType: "package", entityId: inserted[0]?.id, request });
    revalidatePath("/packages");
    return dataResponse({ package: inserted[0] }, 201);
  });
}
