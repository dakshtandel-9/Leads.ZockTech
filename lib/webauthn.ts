import crypto from "crypto";
import type { NextRequest } from "next/server";

/**
 * Cookie that ties a browser to the challenge row it was issued. The challenge
 * itself lives in Supabase (webauthn_challenges); the cookie only holds the
 * row id so an attacker can't complete a ceremony they didn't start.
 */
export const CHALLENGE_COOKIE = "zelvaa_webauthn_chal";

/**
 * Relying Party identity, derived from the request so it works on localhost and
 * in production without extra env vars. The rpID must be the registrable domain
 * (no port, no scheme); the origin is the full scheme + host the browser sees.
 *
 * Override WEBAUTHN_RP_ID / WEBAUTHN_ORIGIN if you deploy behind a proxy whose
 * host header differs from the public URL.
 */
export function getRpConfig(req: NextRequest): { rpID: string; origin: string; rpName: string } {
  const url = new URL(req.url);
  const rpID = process.env.WEBAUTHN_RP_ID || url.hostname;
  const origin = process.env.WEBAUTHN_ORIGIN || url.origin;
  return { rpID, origin, rpName: "Zelvaa Leads" };
}

export function newChallengeId(): string {
  return crypto.randomBytes(32).toString("hex");
}
