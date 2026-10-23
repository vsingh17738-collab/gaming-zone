import { apiRoute, dataResponse } from "@/lib/api";
import { requireAdmin } from "@/lib/auth";
import { listAdminPayments } from "@/server/payments";

export async function GET(request: Request) {
  return apiRoute(async () => {
    await requireAdmin();
    const status = new URL(request.url).searchParams.get("status") ?? undefined;
    return dataResponse({ payments: await listAdminPayments(status) });
  });
}
