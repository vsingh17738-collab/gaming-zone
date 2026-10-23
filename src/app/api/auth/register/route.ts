import bcrypt from "bcryptjs";
import { getDb } from "@/db";
import { users } from "@/db/schema";
import { apiRoute, dataResponse, readJson } from "@/lib/api";
import { createSession } from "@/lib/auth";
import { rateLimit } from "@/lib/rate-limit";
import { registerSchema } from "@/lib/validation";
import { sendRegistrationNotification } from "@/server/notifications";
import { writeAuditLog } from "@/lib/audit";

export const runtime = "nodejs";

export async function POST(request: Request) {
  return apiRoute(async () => {
    await rateLimit(request, "register", 5, 900);
    const input = registerSchema.parse(await readJson(request));
    const passwordHash = await bcrypt.hash(input.password, 12);
    const inserted = await getDb().insert(users).values({
      name: input.name, email: input.email, phone: input.phone, passwordHash,
    }).returning({ id: users.id, name: users.name, email: users.email, phone: users.phone, role: users.role });
    const user = inserted[0];
    if (!user) throw new Error("Registration failed");
    await createSession(user.id);
    await writeAuditLog({ actorId: user.id, action: "auth.register", entityType: "user", entityId: user.id, request });
    await sendRegistrationNotification(user.id);
    return dataResponse({ user }, 201);
  });
}
