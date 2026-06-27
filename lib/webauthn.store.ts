import { getSupabase } from "@/lib/supabase";

export interface StoredCredential {
  credential_id: string;
  public_key: string;
  counter: number;
  transports: string | null;
}

const CHALLENGE_TTL_MS = 5 * 60 * 1000; // challenges expire after 5 minutes

export async function saveChallenge(
  id: string,
  challenge: string,
  kind: "registration" | "authentication"
): Promise<void> {
  const sb = getSupabase();
  const { error } = await sb
    .from("webauthn_challenges")
    .insert({ id, challenge, kind });
  if (error) throw new Error(error.message);
}

/**
 * Fetch a challenge by id, then delete it (single-use). Returns null if missing
 * or expired.
 */
export async function consumeChallenge(
  id: string,
  kind: "registration" | "authentication"
): Promise<string | null> {
  const sb = getSupabase();
  const { data, error } = await sb
    .from("webauthn_challenges")
    .select("challenge, kind, created_at")
    .eq("id", id)
    .maybeSingle();

  // Always attempt cleanup, even on a miss, so stale rows don't accumulate.
  await sb.from("webauthn_challenges").delete().eq("id", id);

  if (error || !data || data.kind !== kind) return null;
  const age = Date.now() - new Date(data.created_at as string).getTime();
  if (age > CHALLENGE_TTL_MS) return null;
  return data.challenge as string;
}

export async function getCredentials(): Promise<StoredCredential[]> {
  const sb = getSupabase();
  const { data, error } = await sb
    .from("webauthn_credentials")
    .select("credential_id, public_key, counter, transports");
  if (error) throw new Error(error.message);
  return (data ?? []) as StoredCredential[];
}

export async function getCredential(
  credentialId: string
): Promise<StoredCredential | null> {
  const sb = getSupabase();
  const { data, error } = await sb
    .from("webauthn_credentials")
    .select("credential_id, public_key, counter, transports")
    .eq("credential_id", credentialId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return (data as StoredCredential) ?? null;
}

export async function hasCredentials(): Promise<boolean> {
  const sb = getSupabase();
  const { count, error } = await sb
    .from("webauthn_credentials")
    .select("credential_id", { count: "exact", head: true });
  if (error) throw new Error(error.message);
  return (count ?? 0) > 0;
}

export async function saveCredential(cred: {
  credentialId: string;
  publicKey: string;
  counter: number;
  transports: string | null;
}): Promise<void> {
  const sb = getSupabase();
  const { error } = await sb.from("webauthn_credentials").upsert({
    credential_id: cred.credentialId,
    public_key: cred.publicKey,
    counter: cred.counter,
    transports: cred.transports,
  });
  if (error) throw new Error(error.message);
}

export async function updateCredentialCounter(
  credentialId: string,
  counter: number
): Promise<void> {
  const sb = getSupabase();
  await sb
    .from("webauthn_credentials")
    .update({ counter, last_used_at: new Date().toISOString() })
    .eq("credential_id", credentialId);
}
