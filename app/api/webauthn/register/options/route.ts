import { NextRequest, NextResponse } from "next/server";
import { generateRegistrationOptions } from "@simplewebauthn/server";
import { AUTH_COOKIE, isValidSession } from "@/lib/auth";
import {
  CHALLENGE_COOKIE,
  getRpConfig,
  newChallengeId,
} from "@/lib/webauthn";
import { getCredentials, saveChallenge } from "@/lib/webauthn.store";

/**
 * Begin fingerprint registration. Gated behind a valid password session — you
 * must already be logged in before you can enrol a device.
 */
export async function POST(req: NextRequest) {
  if (!isValidSession(req.cookies.get(AUTH_COOKIE)?.value)) {
    return NextResponse.json({ message: "Not authenticated" }, { status: 401 });
  }

  const { rpID, rpName } = getRpConfig(req);
  const existing = await getCredentials();

  const options = await generateRegistrationOptions({
    rpName,
    rpID,
    userName: "zelvaa-user",
    attestationType: "none",
    excludeCredentials: existing.map((c) => ({
      id: c.credential_id,
      transports: c.transports
        ? (c.transports.split(",") as any)
        : undefined,
    })),
    authenticatorSelection: {
      residentKey: "preferred",
      userVerification: "preferred",
      // Prefer the platform authenticator (Touch ID / Windows Hello / Android).
      authenticatorAttachment: "platform",
    },
  });

  const challengeId = newChallengeId();
  await saveChallenge(challengeId, options.challenge, "registration");

  const res = NextResponse.json(options);
  res.cookies.set(CHALLENGE_COOKIE, challengeId, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 300,
  });
  return res;
}
