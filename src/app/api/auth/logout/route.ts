import { apiRoute, assertSameOrigin, dataResponse } from "@/lib/api";
import { destroySession } from "@/lib/auth";

export async function POST(request: Request) {
  return apiRoute(async () => {
    assertSameOrigin(request);
    await destroySession();
    return dataResponse({ loggedOut: true });
  });
}
