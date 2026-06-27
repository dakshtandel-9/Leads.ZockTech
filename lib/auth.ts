import crypto from "crypto";

export const AUTH_COOKIE = "zelvaa_auth";

/**
 * Opaque, deterministic session token derived from the password. It never
 * contains the password itself, and validating it doesn't require storing
 * session state — we just recompute and compare.
 */
export function sessionToken(): string {
  const password = process.env.APP_PASSWORD || "";
  return crypto
    .createHash("sha256")
    .update(`zelvaa:${password}`)
    .digest("hex");
}

export function isValidPassword(input: string): boolean {
  const expected = process.env.APP_PASSWORD || "";
  if (!expected) return false;
  // constant-time compare to avoid leaking length/timing
  const a = Buffer.from(input);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

export function isValidSession(token: string | undefined | null): boolean {
  if (!token) return false;
  const expected = sessionToken();
  const a = Buffer.from(token);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}
