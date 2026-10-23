import { z } from "zod";
import { apiRoute, dataResponse, readJson } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { verifyRazorpayCheckoutSignature } from "@/lib/payment-security";
import { verifyRazorpayPayment } from "@/server/payments";
import { ConfigurationError } from "@/lib/errors";
import { writeAuditLog } from "@/lib/audit";
import { sendPaymentReceipt } from "@/server/notifications";

const schema = z.object({ orderId: z.string().min(1).max(100), paymentId: z.string().min(1).max(100), signature: z.string().regex(/^[a-f0-9]{64}$/i) });

export async function POST(request: Request) {
  return apiRoute(async () => {
    const user = await requireUser();
    const input = schema.parse(await readJson(request));
    const secret = process.env.RAZORPAY_KEY_SECRET;
    if (!secret) throw new ConfigurationError("Razorpay");
    if (!verifyRazorpayCheckoutSignature(input.orderId, input.paymentId, input.signature, secret)) {
      return dataResponse({ verified: false }, 400);
    }
    const result = await verifyRazorpayPayment({ orderId: input.orderId, paymentId: input.paymentId }, user);
    await writeAuditLog({ actorId: user.id, action: "payment.razorpay.verify", entityType: "payment", entityId: result.paymentId, request });
    if (!result.duplicate) await sendPaymentReceipt(result.paymentId);
    return dataResponse({ verified: true, ...result });
  });
}
