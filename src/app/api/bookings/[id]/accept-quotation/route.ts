import { apiRoute, assertSameOrigin, dataResponse } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { acceptQuotation } from "@/server/bookings";
import { writeAuditLog } from "@/lib/audit";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  return apiRoute(async () => {
    assertSameOrigin(request);
    const user = await requireUser();
    const { id } = await params;
    const quotation = await acceptQuotation(id, user);
    await writeAuditLog({ actorId: user.id, action: "quotation.accept", entityType: "booking", entityId: id, request });
    return dataResponse({ quotation });
  });
}
