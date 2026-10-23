import { apiRoute, dataResponse, readJson } from "@/lib/api";
import { requireAdmin } from "@/lib/auth";
import { paymentReviewSchema } from "@/lib/validation";
import { reviewManualPayment } from "@/server/payments";
import { writeAuditLog } from "@/lib/audit";
import { sendPaymentReceipt } from "@/server/notifications";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  return apiRoute(async () => {
    const admin = await requireAdmin();
    const { id } = await params;
    const input = paymentReviewSchema.parse(await readJson(request));
    const payment = await reviewManualPayment(id, admin, input.decision, input.note);
    await writeAuditLog({ actorId: admin.id, action: `payment.proof.${input.decision}`, entityType: "payment", entityId: id, metadata: { note: input.note }, request });
    if (payment?.status === "paid") await sendPaymentReceipt(payment.id);
    return dataResponse({ payment });
  });
}
