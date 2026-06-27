import crypto from "crypto";
import type { NextRequest } from "next/server";

/**
 * Cookie that ties a browser to the challenge row it was issued. The challenge
 * itself lives in Supabase (webauthn_challenges); the cookie only holds the
 * row id so an attacker can't complete a ceremony they didn't start.
 */
export const CHALLENGE_COOKIE = "zelvaa_webauthn_chal";

/**
 * Relying Party identity. The rpID must be the registrable domain the browser
 * is on (no port, no scheme); the origin is the full scheme + host.
 *
 * Behind a proxy (Vercel, nginx) `req.url` reflects the *internal* request, not
 * the public domain — so we trust the forwarded headers the proxy sets. Order
 * of preference:
 *   1. WEBAUTHN_RP_ID / WEBAUTHN_ORIGIN env vars (explicit, always wins)
 *   2. x-forwarded-host / x-forwarded-proto (set by the proxy)
 *   3. the Host header
 *   4. req.url (local dev)
 */
export function getRpConfig(req: NextRequest): { rpID: string; origin: string; rpName: string } {
  const fallback = new URL(req.url);

  const forwardedHost =
    req.headers.get("x-forwarded-host") ||
    req.headers.get("host") ||
    fallback.host;
  const forwardedProto =
    req.headers.get("x-forwarded-proto") || fallback.protocol.replace(":", "");

  // Host can be "domain:port" — rpID is just the hostname.
  const hostname = forwardedHost.split(":")[0];

  const rpID = process.env.WEBAUTHN_RP_ID || hostname;
  const origin =
    process.env.WEBAUTHN_ORIGIN || `${forwardedProto}://${forwardedHost}`;

  return { rpID, origin, rpName: "ZockTech Leads" };
}

export function newChallengeId(): string {
  return crypto.randomBytes(32).toString("hex");
}
