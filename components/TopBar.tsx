"use client";

import Link from "next/link";
import { useState } from "react";
import {
  isWebAuthnSupported,
  startRegistration,
} from "@/lib/webauthn.client";

export default function TopBar() {
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);

  async function onRegisterFingerprint() {
    setMsg(null);
    if (!isWebAuthnSupported()) {
      setMsg({ text: "This device doesn't support fingerprint", ok: false });
      return;
    }
    setBusy(true);
    try {
      const optRes = await fetch("/api/webauthn/register/options", {
        method: "POST",
      });
      if (!optRes.ok) {
        const d = await optRes.json().catch(() => ({}));
        setMsg({
          text: d?.message || "Couldn't start fingerprint setup",
          ok: false,
        });
        return;
      }
      const options = await optRes.json();
      const attestation = await startRegistration(options);

      const verifyRes = await fetch("/api/webauthn/register/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(attestation),
      });
      if (verifyRes.ok) {
        setMsg({ text: "Fingerprint registered on this device", ok: true });
      } else {
        const d = await verifyRes.json().catch(() => ({}));
        setMsg({ text: d?.message || "Couldn't save fingerprint", ok: false });
      }
    } catch (err) {
      if (err instanceof DOMException && err.name === "NotAllowedError") {
        setMsg({ text: "Fingerprint setup cancelled", ok: false });
      } else {
        setMsg({ text: "Couldn't set up fingerprint", ok: false });
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="topbar">
      <div className="topbar-inner">
        <Link href="/leads" className="brand">
          ZockTech <span>Leads</span>
        </Link>
        <div className="topbar-actions">
          {msg && (
            <span className={msg.ok ? "topbar-msg ok" : "topbar-msg err"}>
              {msg.text}
            </span>
          )}
          <button
            className="btn-secondary btn"
            type="button"
            onClick={onRegisterFingerprint}
            disabled={busy}
          >
            {busy ? "Registering…" : "🔒 Add fingerprint"}
          </button>
          <a className="btn-secondary btn" href="/api/logout">
            Logout
          </a>
        </div>
      </div>
    </div>
  );
}
