import { NextRequest, NextResponse } from "next/server";

const AUTH_COOKIE = "zelvaa_auth";

// Routes that never require auth. The fingerprint *login* endpoints are public
// because you use them precisely when you don't yet have a session. The
// fingerprint *registration* endpoints (/api/webauthn/register/*) are NOT
// listed here — they require an existing session and enforce it in-handler.
const PUBLIC_PATHS = [
  "/login",
  "/api/login",
  "/api/webauthn/status",
  "/api/webauthn/auth/options",
  "/api/webauthn/auth/verify",
];

function isPublic(pathname: string): boolean {
  return PUBLIC_PATHS.some(
    (p) => pathname === p || pathname.startsWith(p + "/")
  );
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const hasSession = Boolean(req.cookies.get(AUTH_COOKIE)?.value);

  // "/" -> /leads if authed, else /login
  if (pathname === "/") {
    const url = req.nextUrl.clone();
    url.pathname = hasSession ? "/leads" : "/login";
    return NextResponse.redirect(url);
  }

  // Already authed but visiting /login -> send to /leads
  if (pathname === "/login" && hasSession) {
    const url = req.nextUrl.clone();
    url.pathname = "/leads";
    return NextResponse.redirect(url);
  }

  if (isPublic(pathname)) {
    return NextResponse.next();
  }

  if (!hasSession) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  // Run on app routes, skip static assets.
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
