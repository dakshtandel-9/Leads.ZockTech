"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Lead, LeadPayload } from "@/lib/types";
import {
  LEAD_PRIORITY_OPTIONS,
  CALL_STATUS_OPTIONS,
  LEAD_STATUS_OPTIONS,
  LEAD_PERSON_OPTIONS,
  YES_NO_OPTIONS,
} from "@/lib/types";
import { createLead, updateLead } from "@/services/leads.service";
import DateTime12 from "@/components/DateTime12";

interface Props {
  mode: "create" | "edit";
  initial?: Lead;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function todayStr(): string {
  const d = new Date();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

// Format a Date as a LOCAL `YYYY-MM-DDTHH:mm` string (the picker's format).
function dateToLocalInput(d: Date): string {
  const p = (n: number) => String(n).padStart(2, "0");
  return (
    `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}` +
    `T${p(d.getHours())}:${p(d.getMinutes())}`
  );
}

// Convert the picker's LOCAL `YYYY-MM-DDTHH:mm` string into a UTC ISO string
// for storage. `new Date("YYYY-MM-DDTHH:mm")` parses as local time, so
// .toISOString() yields the correct absolute instant. Returns null if empty.
export function localInputToISO(value: string): string | null {
  const s = value.trim();
  if (!s) return null;
  const d = new Date(s);
  return isNaN(d.getTime()) ? null : d.toISOString();
}

// Normalize a stored value (UTC `timestamptz` from Postgres, or a plain date)
// into the LOCAL `YYYY-MM-DDTHH:mm` string the picker expects.
function toDateTimeLocal(value?: string | null): string {
  if (!value) return "";
  // Date only -> midnight local, no TZ math needed.
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return `${value}T00:00`;
  // Anything with a time: parse as an absolute instant and render in local time.
  const d = new Date(value);
  if (!isNaN(d.getTime())) return dateToLocalInput(d);
  return "";
}

type FormState = {
  inquiry_date: string;
  phone_number: string;
  customer_name: string;
  business_name: string;
  email: string;
  lead_priority: string;
  call_status: string;
  lead_person: string;
  lead_status: string;
  call_message_detail: string;
  additional_message: string;
  follow_up_date: string;
  meeting_datetime: string;
  retry_count: string;
  invoice_status: string;
  proposal_status: string;
  send_proposal: string;
  praposal_pricing: string;
};

function fromLead(initial?: Lead): FormState {
  return {
    inquiry_date: initial?.inquiry_date ?? todayStr(),
    phone_number: initial?.phone_number ?? "",
    customer_name: initial?.customer_name ?? "",
    business_name: initial?.business_name ?? "",
    email: initial?.email ?? "",
    lead_priority: initial?.lead_priority ?? "",
    call_status: initial?.call_status ?? "",
    lead_person: initial?.lead_person ?? "",
    lead_status: initial?.lead_status ?? "New",
    call_message_detail: initial?.call_message_detail ?? "",
    additional_message: initial?.additional_message ?? "",
    follow_up_date: toDateTimeLocal(initial?.follow_up_date),
    meeting_datetime: toDateTimeLocal(initial?.meeting_datetime),
    retry_count:
      initial?.retry_count === null || initial?.retry_count === undefined
        ? "0"
        : String(initial.retry_count),
    invoice_status: initial?.invoice_status ?? "No",
    proposal_status: initial?.proposal_status ?? "No",
    send_proposal: initial?.send_proposal ?? "No",
    praposal_pricing:
      initial?.praposal_pricing === null ||
      initial?.praposal_pricing === undefined
        ? ""
        : String(initial.praposal_pricing),
  };
}

export default function LeadForm({ mode, initial }: Props) {
  const router = useRouter();
  const [form, setForm] = useState<FormState>(() => fromLead(initial));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState("");

  function set<K extends keyof FormState>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function validate(): boolean {
    const next: Record<string, string> = {};
    if (!form.inquiry_date) next.inquiry_date = "Inquiry date is required";
    if (!form.phone_number.trim()) next.phone_number = "Phone number is required";
    if (form.email.trim() && !EMAIL_RE.test(form.email.trim())) {
      next.email = "Enter a valid email address";
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  function buildPayload(): LeadPayload {
    const str = (v: string): string | null => {
      const s = v.trim();
      return s === "" ? null : s;
    };
    const num = (v: string): number | null => {
      const s = v.trim();
      if (s === "") return null;
      const n = Number(s);
      return isNaN(n) ? null : n;
    };
    const retry = num(form.retry_count);

    const payload: LeadPayload = {
      inquiry_date: form.inquiry_date,
      phone_number: form.phone_number.trim(),
      email: str(form.email),
      customer_name: str(form.customer_name),
      business_name: str(form.business_name),
      lead_priority: str(form.lead_priority),
      call_status: str(form.call_status),
      call_message_detail: str(form.call_message_detail),
      additional_message: str(form.additional_message),
      follow_up_date: localInputToISO(form.follow_up_date),
      meeting_datetime: localInputToISO(form.meeting_datetime),
      retry_count: retry === null ? 0 : retry,
      lead_person: str(form.lead_person),
      invoice_status: str(form.invoice_status),
      proposal_status: str(form.proposal_status),
      send_proposal: str(form.send_proposal),
      praposal_pricing: num(form.praposal_pricing),
      lead_status: str(form.lead_status),
    };
    if (mode === "edit" && initial) {
      payload.inquiry_id = initial.inquiry_id;
    }
    return payload;
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setServerError("");
    if (!validate()) return;

    setSubmitting(true);
    try {
      const payload = buildPayload();
      const res =
        mode === "create"
          ? await createLead(payload)
          : await updateLead(payload);

      if (res.status === 200) {
        router.push("/leads");
        router.refresh();
      } else {
        setServerError(res.message || "Failed to save lead");
      }
    } catch (err: any) {
      setServerError(err?.message || "Failed to save lead");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className="card card-pad" onSubmit={onSubmit}>
      {serverError && <div className="alert-error">{serverError}</div>}

      <div className="form-section">
        <h3>Basic Information</h3>
        <div className="form-grid">
          <div className="field">
            <label>
              Inquiry Date <span className="req">*</span>
            </label>
            <input
              type="date"
              value={form.inquiry_date}
              onChange={(e) => set("inquiry_date", e.target.value)}
            />
            {errors.inquiry_date && (
              <span className="field-error">{errors.inquiry_date}</span>
            )}
          </div>

          <div className="field">
            <label>
              Phone Number <span className="req">*</span>
            </label>
            <input
              type="text"
              value={form.phone_number}
              placeholder="7383878540"
              onChange={(e) => set("phone_number", e.target.value)}
            />
            {errors.phone_number && (
              <span className="field-error">{errors.phone_number}</span>
            )}
          </div>

          <div className="field">
            <label>Customer Name</label>
            <input
              type="text"
              value={form.customer_name}
              onChange={(e) => set("customer_name", e.target.value)}
            />
          </div>

          <div className="field">
            <label>Business Name</label>
            <input
              type="text"
              value={form.business_name}
              onChange={(e) => set("business_name", e.target.value)}
            />
          </div>

          <div className="field">
            <label>Email</label>
            <input
              type="text"
              value={form.email}
              placeholder="test@example.com"
              onChange={(e) => set("email", e.target.value)}
            />
            {errors.email && (
              <span className="field-error">{errors.email}</span>
            )}
          </div>
        </div>
      </div>

      <div className="form-section">
        <h3>Lead Details</h3>
        <div className="form-grid">
          <div className="field">
            <label>Lead Priority</label>
            <select
              value={form.lead_priority}
              onChange={(e) => set("lead_priority", e.target.value)}
            >
              <option value="">Select…</option>
              {LEAD_PRIORITY_OPTIONS.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>

          <div className="field">
            <label>Call Status</label>
            <select
              value={form.call_status}
              onChange={(e) => set("call_status", e.target.value)}
            >
              <option value="">Select…</option>
              {CALL_STATUS_OPTIONS.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div className="field">
            <label>Lead Person</label>
            <select
              value={form.lead_person}
              onChange={(e) => set("lead_person", e.target.value)}
            >
              <option value="">Select…</option>
              {LEAD_PERSON_OPTIONS.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>

          <div className="field">
            <label>Lead Status</label>
            <select
              value={form.lead_status}
              onChange={(e) => set("lead_status", e.target.value)}
            >
              <option value="">Select…</option>
              {LEAD_STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="form-section">
        <h3>Notes</h3>
        <div className="field">
          <label>Call / Message Detail</label>
          <textarea
            rows={3}
            value={form.call_message_detail}
            onChange={(e) => set("call_message_detail", e.target.value)}
          />
        </div>
        <div className="field">
          <label>Additional Message</label>
          <textarea
            rows={3}
            value={form.additional_message}
            onChange={(e) => set("additional_message", e.target.value)}
          />
        </div>
      </div>

      <div className="form-section">
        <h3>Follow-up</h3>
        <div className="form-grid">
          <div className="field">
            <label>Follow Up Date &amp; Time</label>
            <DateTime12
              value={form.follow_up_date}
              onChange={(v) => set("follow_up_date", v)}
            />
          </div>

          <div className="field">
            <label>Meeting Fixed Date &amp; Time</label>
            <DateTime12
              value={form.meeting_datetime}
              onChange={(v) => set("meeting_datetime", v)}
            />
          </div>

          <div className="field">
            <label>Retry Count</label>
            <input
              type="number"
              min={0}
              value={form.retry_count}
              onChange={(e) => set("retry_count", e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="form-section">
        <h3>Sales</h3>
        <div className="form-grid">
          <div className="field">
            <label>Invoice Status</label>
            <select
              value={form.invoice_status}
              onChange={(e) => set("invoice_status", e.target.value)}
            >
              {YES_NO_OPTIONS.map((v) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </select>
          </div>

          <div className="field">
            <label>Proposal Status</label>
            <select
              value={form.proposal_status}
              onChange={(e) => set("proposal_status", e.target.value)}
            >
              {YES_NO_OPTIONS.map((v) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </select>
          </div>

          <div className="field">
            <label>Send Proposal</label>
            <select
              value={form.send_proposal}
              onChange={(e) => set("send_proposal", e.target.value)}
            >
              {YES_NO_OPTIONS.map((v) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </select>
          </div>

          <div className="field">
            <label>Proposal Pricing</label>
            <input
              type="number"
              min={0}
              value={form.praposal_pricing}
              placeholder="25000"
              onChange={(e) => set("praposal_pricing", e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="form-actions">
        <button
          type="button"
          className="btn btn-secondary"
          onClick={() => router.push("/leads")}
        >
          Cancel
        </button>
        <button type="submit" className="btn" disabled={submitting}>
          {submitting
            ? "Saving…"
            : mode === "create"
            ? "Create Lead"
            : "Update Lead"}
        </button>
      </div>
    </form>
  );
}
