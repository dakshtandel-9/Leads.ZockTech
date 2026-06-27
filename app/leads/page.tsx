"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { Lead } from "@/lib/types";
import { getLeads } from "@/services/leads.service";
import LeadFilters, { Filters, EMPTY_FILTERS } from "@/components/LeadFilters";
import LeadTable from "@/components/LeadTable";
import Pagination from "@/components/Pagination";
import LeadModal from "@/components/LeadModal";
import LeadView from "@/components/LeadView";

function matchesFilters(lead: Lead, f: Filters): boolean {
  if (f.search.trim()) {
    const q = f.search.trim().toLowerCase();
    const haystack = [
      lead.customer_name,
      lead.business_name,
      lead.phone_number,
      lead.email,
      lead.lead_person,
    ]
      .map((v) => (v ? String(v).toLowerCase() : ""))
      .join(" ");
    if (!haystack.includes(q)) return false;
  }
  if (f.priority && lead.lead_priority !== f.priority) return false;
  if (f.callStatus && lead.call_status !== f.callStatus) return false;
  if (f.leadStatus && lead.lead_status !== f.leadStatus) return false;
  if (f.leadPerson && lead.lead_person !== f.leadPerson) return false;
  if (f.followUpDate) {
    const fu = lead.follow_up_date ? lead.follow_up_date.slice(0, 10) : "";
    if (fu !== f.followUpDate) return false;
  }
  return true;
}

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filters, setFilters] = useState<Filters>({ ...EMPTY_FILTERS });
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [viewing, setViewing] = useState<Lead | null>(null);

  async function load() {
    setLoading(true);
    setError("");
    try {
      const data = await getLeads();
      setLeads(data);
    } catch (e: any) {
      setError(e?.message || "Failed to load leads");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  // newest first, then filter
  const filtered = useMemo(() => {
    const sorted = [...leads].sort((a, b) => b.inquiry_id - a.inquiry_id);
    return sorted.filter((l) => matchesFilters(l, filters));
  }, [leads, filters]);

  // reset to page 1 when filters or page size change
  useEffect(() => {
    setPage(1);
  }, [filters, pageSize]);

  const total = filtered.length;
  const pageItems = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, page, pageSize]);

  return (
    <>
      <div className="page-head">
        <h1>Leads</h1>
        <div className="head-actions">
          <button
            className="btn btn-secondary"
            type="button"
            onClick={load}
            disabled={loading}
          >
            Refresh
          </button>
          <Link className="btn" href="/leads/create">
            + Create Lead
          </Link>
        </div>
      </div>

      <LeadFilters filters={filters} onChange={setFilters} />

      <div className="card">
        {loading ? (
          <div className="loading">Loading leads…</div>
        ) : error ? (
          <div className="empty-state">{error}</div>
        ) : (
          <>
            <LeadTable leads={pageItems} onView={(l) => setViewing(l)} />
            {total > 0 && (
              <div className="card-pad" style={{ paddingTop: 0 }}>
                <Pagination
                  total={total}
                  page={page}
                  pageSize={pageSize}
                  onPageChange={setPage}
                  onPageSizeChange={setPageSize}
                />
              </div>
            )}
          </>
        )}
      </div>

      {viewing && (
        <LeadModal
          title={`Lead #${viewing.inquiry_id}`}
          onClose={() => setViewing(null)}
          footer={
            <>
              <button
                className="btn btn-secondary"
                type="button"
                onClick={() => setViewing(null)}
              >
                Close
              </button>
              <Link className="btn" href={`/leads/edit/${viewing.inquiry_id}`}>
                Edit Lead
              </Link>
            </>
          }
        >
          <LeadView lead={viewing} />
        </LeadModal>
      )}
    </>
  );
}
