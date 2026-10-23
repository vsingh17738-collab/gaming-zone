import { apiRoute, dataResponse, readJson } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { rateLimit } from "@/lib/rate-limit";
import { bookingSchema } from "@/lib/validation";
import { createBooking, getCustomerBookings } from "@/server/bookings";
import { writeAuditLog } from "@/lib/audit";
import { sendBookingNotifications } from "@/server/notifications";

export const runtime = "nodejs";

export async function GET() {
  return apiRoute(async () => {
    const user = await requireUser();
    return dataResponse({ bookings: await getCustomerBookings(user.id) });
  });
}

export async function POST(request: Request) {
  return apiRoute(async () => {
    const user = await requireUser();
    await rateLimit(request, "create-booking", 6, 300);
    const input = bookingSchema.parse(await readJson(request));
    const booking = await createBooking(user.id, input);
    await writeAuditLog({ actorId: user.id, action: "booking.create", entityType: "booking", entityId: booking.id, metadata: { bookingNumber: booking.bookingNumber }, request });
    await sendBookingNotifications(booking.id);
    return dataResponse(booking, 201);
  });
}
