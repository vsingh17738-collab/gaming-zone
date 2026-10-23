import { apiRoute, dataResponse } from "@/lib/api";
import { requireAdmin } from "@/lib/auth";
import { getDashboardStats } from "@/server/bookings";

export async function GET() {
  return apiRoute(async () => {
    await requireAdmin();
    return dataResponse(await getDashboardStats());
  });
}
