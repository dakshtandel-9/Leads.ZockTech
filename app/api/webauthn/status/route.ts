import { NextResponse } from "next/server";
import { hasCredentials } from "@/lib/webauthn.store";

/** Whether any fingerprint is registered — used to show the login button. */
export async function GET() {
  try {
    const registered = await hasCredentials();
    return NextResponse.json({ registered });
  } catch {
    return NextResponse.json({ registered: false });
  }
}
