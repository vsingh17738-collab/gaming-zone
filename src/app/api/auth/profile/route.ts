import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { users } from "@/db/schema";
import { apiRoute, dataResponse, readJson } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { profileSchema } from "@/lib/validation";

export async function PATCH(request: Request) {
  return apiRoute(async () => {
    const user = await requireUser();
    const input = profileSchema.parse(await readJson(request));
    const updated = await getDb().update(users).set({ name: input.name, phone: input.phone, updatedAt: new Date() }).where(eq(users.id, user.id))
      .returning({ id: users.id, name: users.name, email: users.email, phone: users.phone, role: users.role });
    return dataResponse({ user: updated[0] });
  });
}
