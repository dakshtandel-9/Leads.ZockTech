"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import type { Lead } from "@/lib/types";
import { getLeads } from "@/services/leads.service";
import LeadForm from "@/components/LeadForm";

export default function EditLeadPage() {
  const params = useParams<{ id: string }>();
  const id = Number(params?.id);

  const [lead, setLead] = useState<Lead | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError("");
      try {
        const leads = await getLeads();
        const found = leads.find((l) => l.inquiry_id === id) ?? null;
        if (cancelled) return;
        if (!found) {
          setError("Lead not found.");
        } else {
          setLead(found);
        }
      } catch (e: any) {
        if (!cancelled) setError(e?.message || "Failed to load lead");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  return (
    <>
      <div className="page-head">
        <h1>Edit Lead{lead ? ` #${lead.inquiry_id}` : ""}</h1>
        <div className="head-actions">
          <Link className="btn btn-secondary" href="/leads">
            Back to Leads
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="card card-pad loading">Loading lead…</div>
      ) : error ? (
        <div className="card card-pad empty-state">{error}</div>
      ) : lead ? (
        <LeadForm mode="edit" initial={lead} />
      ) : null}
    </>
  );
}
