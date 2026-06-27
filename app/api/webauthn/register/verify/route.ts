import { NextRequest, NextResponse } from "next/server";
import { verifyRegistrationResponse } from "@simplewebauthn/server";
import { isoBase64URL } from "@simplewebauthn/server/helpers";
import { AUTH_COOKIE, isValidSession } from "@/lib/auth";
import { CHALLENGE_COOKIE, getRpConfig } from "@/lib/webauthn";
import { consumeChallenge, saveCredential } from "@/lib/webauthn.store";

export async function POST(req: NextRequest) {
  if (!isValidSession(req.cookies.get(AUTH_COOKIE)?.value)) {
    return NextResponse.json({ message: "Not authenticated" }, { status: 401 });
  }

  const challengeId = req.cookies.get(CHALLENGE_COOKIE)?.value;
  if (!challengeId) {
    return NextResponse.json({ message: "Missing challenge" }, { status: 400 });
  }
  const expectedChallenge = await consumeChallenge(challengeId, "registration");
  if (!expectedChallenge) {
    return NextResponse.json(
      { message: "Challenge expired, try again" },
      { status: 400 }
    );
  }

  const body = await req.json();
  const { rpID, origin } = getRpConfig(req);

  let verification;
  try {
    verification = await verifyRegistrationResponse({
      response: body,
      expectedChallenge,
      expectedOrigin: origin,
      expectedRPID: rpID,
    });
  } catch (err) {
    return NextResponse.json(
      { message: err instanceof Error ? err.message : "Verification failed" },
      { status: 400 }
    );
  }

  if (!verification.verified || !verification.registrationInfo) {
    return NextResponse.json({ message: "Not verified" }, { status: 400 });
  }

  const { credential } = verification.registrationInfo;
  await saveCredential({
    credentialId: credential.id,
    publicKey: isoBase64URL.fromBuffer(credential.publicKey),
    counter: credential.counter,
    transports: credential.transports?.join(",") ?? null,
  });

  const res = NextResponse.json({ verified: true });
  res.cookies.delete(CHALLENGE_COOKIE);
  return res;
}
