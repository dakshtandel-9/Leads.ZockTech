import { NextRequest, NextResponse } from "next/server";
import { generateAuthenticationOptions } from "@simplewebauthn/server";
import {
  CHALLENGE_COOKIE,
  getRpConfig,
  newChallengeId,
} from "@/lib/webauthn";
import { getCredentials, saveChallenge } from "@/lib/webauthn.store";

/** Begin fingerprint login. Public — this is how you sign in. */
export async function POST(req: NextRequest) {
  const { rpID } = getRpConfig(req);
  const creds = await getCredentials();

  if (creds.length === 0) {
    return NextResponse.json(
      { message: "No fingerprint registered on this account yet" },
      { status: 404 }
    );
  }

  const options = await generateAuthenticationOptions({
    rpID,
    userVerification: "preferred",
    allowCredentials: creds.map((c) => ({
      id: c.credential_id,
      transports: c.transports ? (c.transports.split(",") as any) : undefined,
    })),
  });

  const challengeId = newChallengeId();
  await saveChallenge(challengeId, options.challenge, "authentication");

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
