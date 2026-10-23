import { and, asc, eq, gte, inArray, lt } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/db";
import { bookings, users } from "@/db/schema";
import { apiRoute, dataResponse } from "@/lib/api";
import { requireAdmin } from "@/lib/auth";
import { monthRange } from "@/lib/dates";

export async function GET(request: Request) {
  return apiRoute(async () => {
    await requireAdmin();
    const month = z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/).parse(new URL(request.url).searchParams.get("month"));
    const { start, end } = monthRange(month);
    const events = await getDb().select({ booking: bookings, customer: { name: users.name, phone: users.phone, email: users.email } }).from(bookings)
      .innerJoin(users, eq(users.id, bookings.customerId))
      .where(and(gte(bookings.eventDate, start), lt(bookings.eventDate, end), inArray(bookings.status, ["pending", "confirmed"]))).orderBy(asc(bookings.eventDate));
    return dataResponse({ events });
  });
}
