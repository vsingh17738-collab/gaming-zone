import { revalidatePath } from "next/cache";
import { getDb } from "@/db";
import { businessSettings } from "@/db/schema";
import { apiRoute, dataResponse, readJson } from "@/lib/api";
import { requireAdmin } from "@/lib/auth";
import { getBusinessSettings } from "@/lib/data";
import { settingsSchema } from "@/lib/validation";
import { writeAuditLog } from "@/lib/audit";

export async function GET() {
  return apiRoute(async () => {
    await requireAdmin();
    return dataResponse({ settings: await getBusinessSettings() });
  });
}

export async function PUT(request: Request) {
  return apiRoute(async () => {
    const admin = await requireAdmin();
    const input = settingsSchema.parse(await readJson(request));
    const values = {
      ...input,
      phone: input.phone || null,
      whatsappNumber: input.whatsappNumber || null,
      email: input.email || null,
      instagramUrl: input.instagramUrl || null,
      mapUrl: input.mapUrl || null,
      logoUrl: input.logoUrl || null,
      paymentQrUrl: input.paymentQrUrl || null,
      paymentInstructions: input.paymentInstructions || null,
      upiId: input.upiId || null,
      bankDetails: input.bankDetails || null,
      taxDetails: input.taxDetails || null,
      updatedAt: new Date(),
    };
    const saved = await getDb().insert(businessSettings).values({ ...values, id: 1 }).onConflictDoUpdate({ target: businessSettings.id, set: values }).returning();
    await writeAuditLog({ actorId: admin.id, action: "settings.update", entityType: "business_settings", entityId: "1", metadata: { advancePercent: input.advancePercent }, request });
    revalidatePath("/", "layout");
    return dataResponse({ settings: saved[0] });
  });
}
