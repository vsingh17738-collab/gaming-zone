import { apiRoute, dataResponse, readJson } from "@/lib/api";
import { requireAdmin } from "@/lib/auth";
import { bookingStatusSchema } from "@/lib/validation";
import { getBookingDetail, updateBookingStatus } from "@/server/bookings";
import { writeAuditLog } from "@/lib/audit";
import { sendBookingNotifications } from "@/server/notifications";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  return apiRoute(async () => {
    const admin = await requireAdmin();
    const { id } = await params;
    return dataResponse(await getBookingDetail(id, admin));
  });
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  return apiRoute(async () => {
    const admin = await requireAdmin();
    const { id } = await params;
    const input = bookingStatusSchema.parse(await readJson(request));
    const booking = await updateBookingStatus(id, input.status, input.reason);
    await writeAuditLog({ actorId: admin.id, action: `booking.${input.status}`, entityType: "booking", entityId: id, metadata: { newStatus: input.status }, request });
    await sendBookingNotifications(id);
    return dataResponse({ booking });
  });
}
