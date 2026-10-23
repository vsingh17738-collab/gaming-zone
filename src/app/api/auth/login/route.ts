import bcrypt from "bcryptjs";
import { sql } from "drizzle-orm";
import { getDb } from "@/db";
import { users } from "@/db/schema";
import { apiRoute, dataResponse, readJson } from "@/lib/api";
import { createSession } from "@/lib/auth";
import { rateLimit } from "@/lib/rate-limit";
import { loginSchema } from "@/lib/validation";
import { AppError } from "@/lib/errors";

export const runtime = "nodejs";
const DUMMY_HASH = "$2b$12$W1OOzANm.ashzZH8dbOh2uMenLq/gAh8GhjhFxJoJO5XQqJYfFeGK";

export async function POST(request: Request) {
  return apiRoute(async () => {
    await rateLimit(request, "login", 8, 900);
    const input = loginSchema.parse(await readJson(request));
    const rows = await getDb().select().from(users).where(sql`lower(${users.email}) = ${input.email}`).limit(1);
    const user = rows[0];
    const valid = await bcrypt.compare(input.password, user?.passwordHash ?? DUMMY_HASH);
    if (!user || !valid) throw new AppError("Email or password is incorrect", 401, "INVALID_CREDENTIALS");
    await createSession(user.id);
    return dataResponse({ user: { id: user.id, name: user.name, email: user.email, phone: user.phone, role: user.role } });
  });
}
