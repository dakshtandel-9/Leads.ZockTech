import { NextRequest, NextResponse } from "next/server";
import { AUTH_COOKIE, isValidPassword, sessionToken } from "@/lib/auth";

export async function POST(req: NextRequest) {
  let password = "";
  try {
    const body = await req.json();
    password = typeof body?.password === "string" ? body.password : "";
  } catch {
    password = "";
  }

  if (!isValidPassword(password)) {
    return NextResponse.json(
      { status: 401, message: "Incorrect password" },
      { status: 401 }
    );
  }

  const res = NextResponse.json({ status: 200, message: "OK" });
  res.cookies.set(AUTH_COOKIE, sessionToken(), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });
  return res;
}
