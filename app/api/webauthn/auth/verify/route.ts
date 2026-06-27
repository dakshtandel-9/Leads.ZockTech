import { NextRequest, NextResponse } from "next/server";
import { verifyAuthenticationResponse } from "@simplewebauthn/server";
import { isoBase64URL } from "@simplewebauthn/server/helpers";
import { AUTH_COOKIE, sessionToken } from "@/lib/auth";
import { CHALLENGE_COOKIE, getRpConfig } from "@/lib/webauthn";
import {
  consumeChallenge,
  getCredential,
  updateCredentialCounter,
} from "@/lib/webauthn.store";

export async function POST(req: NextRequest) {
  const challengeId = req.cookies.get(CHALLENGE_COOKIE)?.value;
  if (!challengeId) {
    return NextResponse.json({ message: "Missing challenge" }, { status: 400 });
  }
  const expectedChallenge = await consumeChallenge(
    challengeId,
    "authentication"
  );
  if (!expectedChallenge) {
    return NextResponse.json(
      { message: "Challenge expired, try again" },
      { status: 400 }
    );
  }

  const body = await req.json();
  const stored = await getCredential(body.id);
  if (!stored) {
    return NextResponse.json(
      { message: "Unknown credential" },
      { status: 400 }
    );
  }

  const { rpID, origin } = getRpConfig(req);

  let verification;
  try {
    verification = await verifyAuthenticationResponse({
      response: body,
      expectedChallenge,
      expectedOrigin: origin,
      expectedRPID: rpID,
      credential: {
        id: stored.credential_id,
        publicKey: isoBase64URL.toBuffer(stored.public_key),
        counter: Number(stored.counter),
        transports: stored.transports
          ? (stored.transports.split(",") as any)
          : undefined,
      },
    });
  } catch (err) {
    return NextResponse.json(
      { message: err instanceof Error ? err.message : "Verification failed" },
      { status: 400 }
    );
  }

  if (!verification.verified) {
    return NextResponse.json({ message: "Not verified" }, { status: 401 });
  }

  await updateCredentialCounter(
    stored.credential_id,
    verification.authenticationInfo.newCounter
  );

  // Same opaque session cookie the password login issues.
  const res = NextResponse.json({ verified: true });
  res.cookies.set(AUTH_COOKIE, sessionToken(), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
  res.cookies.delete(CHALLENGE_COOKIE);
  return res;
}
