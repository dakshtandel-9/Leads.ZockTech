import type { Lead, LeadPayload, ApiWriteResponse } from "@/lib/types";

async function parseJson<T>(res: Response): Promise<T> {
  const text = await res.text();
  try {
    return JSON.parse(text) as T;
  } catch {
    throw new Error(text || `Request failed (${res.status})`);
  }
}

export async function getLeads(): Promise<Lead[]> {
  const res = await fetch("/api/leads", { method: "GET", cache: "no-store" });
  if (!res.ok) {
    throw new Error(`Failed to load leads (${res.status})`);
  }
  return parseJson<Lead[]>(res);
}

export async function createLead(
  payload: LeadPayload
): Promise<ApiWriteResponse> {
  const res = await fetch("/api/leads", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return parseJson<ApiWriteResponse>(res);
}

export async function updateLead(
  payload: LeadPayload
): Promise<ApiWriteResponse> {
  const res = await fetch("/api/leads", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return parseJson<ApiWriteResponse>(res);
}
