import { apiRoute, dataResponse, readJson } from "@/lib/api";
import { rateLimit } from "@/lib/rate-limit";
import { quotePreviewSchema } from "@/lib/validation";
import { previewQuotation } from "@/server/bookings";

export async function POST(request: Request) {
  return apiRoute(async () => {
    await rateLimit(request, "quote-preview", 30, 60);
    const input = quotePreviewSchema.parse(await readJson(request));
    return dataResponse(await previewQuotation(input));
  });
}
