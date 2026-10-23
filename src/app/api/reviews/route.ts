import { and, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { bookings, reviews } from "@/db/schema";
import { apiRoute, dataResponse, readJson } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { AppError } from "@/lib/errors";
import { reviewSchema } from "@/lib/validation";
import { getApprovedReviews } from "@/lib/data";

export async function GET() {
  return apiRoute(async () => dataResponse({ reviews: await getApprovedReviews() }));
}

export async function POST(request: Request) {
  return apiRoute(async () => {
    const user = await requireUser();
    const input = reviewSchema.parse(await readJson(request));
    const bookingRows = await getDb().select({ id: bookings.id }).from(bookings).where(and(eq(bookings.id, input.bookingId), eq(bookings.customerId, user.id), eq(bookings.status, "completed"))).limit(1);
    if (!bookingRows[0]) throw new AppError("Reviews are available only for your completed events", 403, "REVIEW_NOT_ALLOWED");
    const inserted = await getDb().insert(reviews).values({ ...input, customerId: user.id }).returning({ id: reviews.id, isApproved: reviews.isApproved });
    return dataResponse({ review: inserted[0], message: "Thank you. Your review will appear after moderation." }, 201);
  });
}
