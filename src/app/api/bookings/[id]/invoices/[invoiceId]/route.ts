import { apiRoute } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { getBookingDetail } from "@/server/bookings";
import { getBusinessSettings } from "@/lib/data";
import { invoicePdf } from "@/lib/documents";
import { AppError } from "@/lib/errors";

export const runtime = "nodejs";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string; invoiceId: string }> }) {
  return apiRoute(async () => {
    const user = await requireUser();
    const { id, invoiceId } = await params;
    const detail = await getBookingDetail(id, user);
    if (!detail.invoices.some((invoice) => invoice.id === invoiceId)) throw new AppError("Invoice not found", 404, "NOT_FOUND");
    const pdf = await invoicePdf(detail, await getBusinessSettings(), invoiceId);
    return new Response(new Uint8Array(pdf), { headers: { "Content-Type": "application/pdf", "Content-Disposition": `inline; filename="invoice-${invoiceId}.pdf"`, "Cache-Control": "private, no-store" } });
  });
}
