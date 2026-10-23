import { desc, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { bookings, reviews, users } from "@/db/schema";
import { AdminPageTitle } from "@/components/admin/page-title";
import { ReviewModeration } from "@/components/admin/review-moderation";

export const dynamic = "force-dynamic";
export default async function AdminReviewsPage() { const rows = await getDb().select({ review: reviews, customerName: users.name, bookingNumber: bookings.bookingNumber }).from(reviews).innerJoin(users, eq(users.id, reviews.customerId)).innerJoin(bookings, eq(bookings.id, reviews.bookingId)).orderBy(desc(reviews.createdAt)); return <><AdminPageTitle eyebrow="Verified feedback" title="Customer reviews." copy="Only reviews tied to completed customer bookings can enter this moderation queue." /><ReviewModeration rows={rows} /></>; }
