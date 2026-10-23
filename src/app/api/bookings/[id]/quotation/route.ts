import { apiRoute } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { getBookingDetail } from "@/server/bookings";
import { getBusinessSettings } from "@/lib/data";
import { quotationPdf } from "@/lib/documents";
import { AppError } from "@/lib/errors";

export const runtime = "nodejs";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  return apiRoute(async () => {
    const user = await requireUser();
    const { id } = await params;
    const detail = await getBookingDetail(id, user);
    if (!detail.quotation) throw new AppError("Quotation not found", 404, "NOT_FOUND");
    const pdf = await quotationPdf(detail, await getBusinessSettings());
    return new Response(new Uint8Array(pdf), { headers: { "Content-Type": "application/pdf", "Content-Disposition": `inline; filename="${detail.quotation.quotationNumber}.pdf"`, "Cache-Control": "private, no-store" } });
  });
}
