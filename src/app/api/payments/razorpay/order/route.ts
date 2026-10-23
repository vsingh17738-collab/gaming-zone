import { z } from "zod";
import { apiRoute, dataResponse, readJson } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { rateLimit } from "@/lib/rate-limit";
import { createRazorpayOrder } from "@/server/payments";

const schema = z.object({ bookingId: z.string().uuid(), kind: z.enum(["advance", "balance"]) });

export async function POST(request: Request) {
  return apiRoute(async () => {
    const user = await requireUser();
    await rateLimit(request, "razorpay-order", 10, 300);
    const input = schema.parse(await readJson(request));
    return dataResponse(await createRazorpayOrder(input.bookingId, input.kind, user));
  });
}
