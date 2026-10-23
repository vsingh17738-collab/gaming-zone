import { NextResponse, type NextRequest } from "next/server";

export function proxy(request: NextRequest) {
  const response = NextResponse.next();
  response.headers.set("X-Robots-Tag", request.nextUrl.pathname.startsWith("/admin") || request.nextUrl.pathname.startsWith("/account") ? "noindex, nofollow" : "index, follow");
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|images|favicon.ico).*)"],
};
