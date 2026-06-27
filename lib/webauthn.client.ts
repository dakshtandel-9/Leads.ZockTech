// Browser-side WebAuthn helpers. No external dependency — we convert between
// the server's base64url JSON and the ArrayBuffers the browser API expects.

function b64urlToBuffer(value: string): ArrayBuffer {
  const pad = value.length % 4 === 0 ? "" : "=".repeat(4 - (value.length % 4));
  const base64 = (value + pad).replace(/-/g, "+").replace(/_/g, "/");
  const bin = atob(base64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes.buffer;
}

function bufferToB64url(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let bin = "";
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export function isWebAuthnSupported(): boolean {
  return (
    typeof window !== "undefined" &&
    typeof window.PublicKeyCredential !== "undefined"
  );
}

/** Run a registration ceremony from server-provided options. */
export async function startRegistration(options: any): Promise<any> {
  const publicKey: PublicKeyCredentialCreationOptions = {
    ...options,
    challenge: b64urlToBuffer(options.challenge),
    user: {
      ...options.user,
      id: b64urlToBuffer(options.user.id),
    },
    excludeCredentials: (options.excludeCredentials || []).map((c: any) => ({
      ...c,
      id: b64urlToBuffer(c.id),
    })),
  };

  const cred = (await navigator.credentials.create({
    publicKey,
  })) as PublicKeyCredential;
  return serializeCredential(cred);
}

/** Run an authentication ceremony from server-provided options. */
export async function startAuthentication(options: any): Promise<any> {
  const publicKey: PublicKeyCredentialRequestOptions = {
    ...options,
    challenge: b64urlToBuffer(options.challenge),
    allowCredentials: (options.allowCredentials || []).map((c: any) => ({
      ...c,
      id: b64urlToBuffer(c.id),
    })),
  };

  const cred = (await navigator.credentials.get({
    publicKey,
  })) as PublicKeyCredential;
  return serializeCredential(cred);
}

function serializeCredential(cred: PublicKeyCredential) {
  const response = cred.response as
    | AuthenticatorAttestationResponse
    | AuthenticatorAssertionResponse;

  const json: any = {
    id: cred.id,
    rawId: bufferToB64url(cred.rawId),
    type: cred.type,
    clientExtensionResults: cred.getClientExtensionResults(),
    response: {
      clientDataJSON: bufferToB64url(response.clientDataJSON),
    },
  };

  if ("attestationObject" in response) {
    json.response.attestationObject = bufferToB64url(
      response.attestationObject
    );
    if (typeof response.getTransports === "function") {
      json.response.transports = response.getTransports();
    }
  } else {
    json.response.authenticatorData = bufferToB64url(response.authenticatorData);
    json.response.signature = bufferToB64url(response.signature);
    if (response.userHandle) {
      json.response.userHandle = bufferToB64url(response.userHandle);
    }
  }

  return json;
}
