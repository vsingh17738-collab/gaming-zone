import { desc, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { reviews, users, bookings } from "@/db/schema";
import { apiRoute, dataResponse } from "@/lib/api";
import { requireAdmin } from "@/lib/auth";

export async function GET() {
  return apiRoute(async () => {
    await requireAdmin();
    const items = await getDb().select({ review: reviews, customerName: users.name, bookingNumber: bookings.bookingNumber }).from(reviews)
      .innerJoin(users, eq(users.id, reviews.customerId)).innerJoin(bookings, eq(bookings.id, reviews.bookingId)).orderBy(desc(reviews.createdAt));
    return dataResponse({ reviews: items });
  });
}
