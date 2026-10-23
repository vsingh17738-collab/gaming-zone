import { apiRoute, dataResponse } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { getBookingDetail } from "@/server/bookings";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  return apiRoute(async () => {
    const user = await requireUser();
    const { id } = await params;
    return dataResponse(await getBookingDetail(id, user));
  });
}
