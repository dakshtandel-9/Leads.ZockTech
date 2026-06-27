"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  isWebAuthnSupported,
  startAuthentication,
  startRegistration,
} from "@/lib/webauthn.client";

// "choice"  -> pick Password or Fingerprint
// "password"-> password form
// "enroll-offer" -> after password login, offer to set up fingerprint
type Mode = "choice" | "password" | "enroll-offer";

export default function LoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [mode, setMode] = useState<Mode>("choice");

  // Whether any fingerprint is registered (controls the Fingerprint button).
  const [fingerprintReady, setFingerprintReady] = useState(false);
  const [supported, setSupported] = useState(false);

  useEffect(() => {
    const ok = isWebAuthnSupported();
    setSupported(ok);
    if (!ok) {
      setMode("password");
      return;
    }
    fetch("/api/webauthn/status")
      .then((r) => r.json())
      .then((d) => setFingerprintReady(Boolean(d?.registered)))
      .catch(() => setFingerprintReady(false));
  }, []);

  function goToApp() {
    router.push("/leads");
    router.refresh();
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setInfo("");
    setSubmitting(true);
    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (!res.ok) {
        setError("Incorrect password");
        return;
      }
      // Logged in. If this device supports biometrics and none is registered
      // yet, offer to set up fingerprint login. Otherwise go straight in.
      if (supported && !fingerprintReady) {
        setMode("enroll-offer");
      } else {
        goToApp();
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  async function onFingerprintLogin() {
    setError("");
    setInfo("");
    setSubmitting(true);
    try {
      const optRes = await fetch("/api/webauthn/auth/options", {
        method: "POST",
      });
      if (!optRes.ok) {
        const d = await optRes.json().catch(() => ({}));
        setError(d?.message || "No fingerprint registered yet");
        return;
      }
      const options = await optRes.json();
      // Opens the OS biometric prompt.
      const assertion = await startAuthentication(options);

      const verifyRes = await fetch("/api/webauthn/auth/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(assertion),
      });
      if (verifyRes.ok) {
        goToApp();
      } else {
        const d = await verifyRes.json().catch(() => ({}));
        setError(d?.message || "Fingerprint not recognized");
      }
    } catch (err) {
      if (err instanceof DOMException && err.name === "NotAllowedError") {
        setError("Fingerprint prompt cancelled");
      } else {
        setError("Couldn't complete fingerprint login");
      }
    } finally {
      setSubmitting(false);
    }
  }

  async function onEnrollFingerprint() {
    setError("");
    setInfo("");
    setSubmitting(true);
    try {
      const optRes = await fetch("/api/webauthn/register/options", {
        method: "POST",
      });
      if (!optRes.ok) {
        const d = await optRes.json().catch(() => ({}));
        setError(d?.message || "Couldn't start fingerprint setup");
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
        setInfo("Fingerprint set up. You can use it to sign in next time.");
        setTimeout(goToApp, 800);
      } else {
        const d = await verifyRes.json().catch(() => ({}));
        setError(d?.message || "Couldn't save fingerprint");
      }
    } catch (err) {
      if (err instanceof DOMException && err.name === "NotAllowedError") {
        setError("Fingerprint setup cancelled");
      } else {
        setError("Couldn't set up fingerprint");
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="login-wrap">
      <div className="card login-card">
        <div className="login-brand">
          ZockTech <span>Leads</span>
        </div>
        <div className="login-sub">Sign in to continue</div>

        {error && <div className="alert-error">{error}</div>}
        {info && <div className="alert-info">{info}</div>}

        {mode === "choice" && (
          <div>
            <button
              className="btn"
              type="button"
              disabled={submitting}
              onClick={() => {
                setError("");
                setMode("password");
              }}
            >
              Login with password
            </button>
            <button
              className="btn btn-secondary"
              type="button"
              disabled={submitting || !fingerprintReady}
              onClick={onFingerprintLogin}
            >
              {submitting ? "Waiting…" : "🔒 Login with fingerprint"}
            </button>
            {!fingerprintReady && (
              <p className="login-hint">
                No fingerprint registered yet. Log in with the password once,
                then set up fingerprint.
              </p>
            )}
          </div>
        )}

        {mode === "password" && (
          <form onSubmit={onSubmit}>
            <div className="field">
              <label htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                value={password}
                autoFocus
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
              />
            </div>

            <button className="btn" type="submit" disabled={submitting}>
              {submitting ? "Signing in…" : "Login"}
            </button>

            {supported && (
              <button
                className="btn btn-secondary"
                type="button"
                disabled={submitting}
                onClick={() => {
                  setError("");
                  setMode("choice");
                }}
              >
                ← Back
              </button>
            )}
          </form>
        )}

        {mode === "enroll-offer" && (
          <div>
            <p className="login-sub">
              Set up fingerprint login on this device so you can skip the
              password next time?
            </p>
            <button
              className="btn"
              type="button"
              disabled={submitting}
              onClick={onEnrollFingerprint}
            >
              {submitting ? "Setting up…" : "🔒 Set up fingerprint"}
            </button>
            <button
              className="btn btn-secondary"
              type="button"
              disabled={submitting}
              onClick={goToApp}
            >
              Skip for now
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
