import { apiRoute, dataResponse } from "@/lib/api";
import { requireAdmin } from "@/lib/auth";
import { listAdminBookings } from "@/server/bookings";

export async function GET(request: Request) {
  return apiRoute(async () => {
    await requireAdmin();
    const url = new URL(request.url);
    return dataResponse({ bookings: await listAdminBookings({ search: url.searchParams.get("search") ?? undefined, status: url.searchParams.get("status") ?? undefined }) });
  });
}
