import { apiRoute, dataResponse } from "@/lib/api";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  return apiRoute(async () => dataResponse({ user: await getCurrentUser() }));
}
