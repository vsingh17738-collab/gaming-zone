import { apiRoute, dataResponse, errorResponse } from "@/lib/api";
import { verifyRazorpayWebhookSignature } from "@/lib/payment-security";
import { processRazorpayWebhook } from "@/server/payments";
import { AppError, ConfigurationError } from "@/lib/errors";

export const runtime = "nodejs";

export async function POST(request: Request) {
  return apiRoute(async () => {
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
    if (!secret) throw new ConfigurationError("Razorpay webhooks");
    const signature = request.headers.get("x-razorpay-signature") ?? "";
    const rawBody = await request.text();
    if (!verifyRazorpayWebhookSignature(rawBody, signature, secret)) return errorResponse("Invalid webhook signature", 400, "INVALID_SIGNATURE");
    let payload: Parameters<typeof processRazorpayWebhook>[0];
    try { payload = JSON.parse(rawBody) as Parameters<typeof processRazorpayWebhook>[0]; }
    catch { throw new AppError("Invalid webhook JSON", 400, "INVALID_JSON"); }
    return dataResponse(await processRazorpayWebhook(payload));
  });
}
