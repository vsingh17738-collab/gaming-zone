import { apiRoute, assertSameOrigin, dataResponse } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { AppError } from "@/lib/errors";
import { paymentProofSchema } from "@/lib/validation";
import { uploadPersistentImage } from "@/lib/uploads-server";
import { recordManualProof } from "@/server/payments";
import { rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";

export async function POST(request: Request) {
  return apiRoute(async () => {
    assertSameOrigin(request);
    const user = await requireUser();
    await rateLimit(request, "manual-payment-proof", 8, 900);
    if (Number(request.headers.get("content-length") ?? 0) > 6 * 1024 * 1024) throw new AppError("Upload is too large", 413, "PAYLOAD_TOO_LARGE");
    const form = await request.formData();
    const input = paymentProofSchema.parse({ bookingId: form.get("bookingId"), kind: form.get("kind") });
    const file = form.get("proof");
    if (!(file instanceof File)) throw new AppError("Choose a payment screenshot", 422, "FILE_REQUIRED");
    const blob = await uploadPersistentImage(file, "payments", true);
    const payment = await recordManualProof({ ...input, customer: user, proofUrl: blob.url, proofPathname: blob.pathname, proofContentType: file.type });
    return dataResponse({ payment, message: "Proof submitted. This is not yet a verified payment; the business will review it." }, 201);
  });
}
