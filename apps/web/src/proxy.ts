import { NextResponse, type NextRequest } from "next/server";

const AUTH_COOKIE = "vidora_token";
const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,POST,PATCH,DELETE,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, Range",
  "Access-Control-Expose-Headers": "Content-Range, Content-Length, Accept-Ranges",
};

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // API is shared with the native mobile app (bearer tokens), so allow cross-origin calls.
  if (pathname.startsWith("/api/")) {
    if (req.method === "OPTIONS") return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
    const res = NextResponse.next();
    for (const [k, v] of Object.entries(CORS_HEADERS)) res.headers.set(k, v);
    return res;
  }

  // Cheap gate for the upload page; the API re-verifies the token on every request.
  if (pathname.startsWith("/upload") && !req.cookies.get(AUTH_COOKIE)) {
    const url = new URL("/login", req.url);
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/api/:path*", "/upload/:path*"],
};
