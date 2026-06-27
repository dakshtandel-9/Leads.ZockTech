import { NextRequest, NextResponse } from "next/server";

const AUTH_COOKIE = "zelvaa_auth";

// Routes that never require auth.
const PUBLIC_PATHS = ["/login", "/api/login"];

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
