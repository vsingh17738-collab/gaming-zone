import { apiRoute, dataResponse } from "@/lib/api";
import { rateLimit } from "@/lib/rate-limit";
import { availabilitySchema } from "@/lib/validation";
import { getAvailability } from "@/server/bookings";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  return apiRoute(async () => {
    await rateLimit(request, "availability", 60, 60);
    const url = new URL(request.url);
    const input = availabilitySchema.parse({ month: url.searchParams.get("month"), slot: url.searchParams.get("slot") || undefined });
    return dataResponse(await getAvailability(input.month, input.slot));
  });
}
