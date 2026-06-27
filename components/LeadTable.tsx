"use client";

import Link from "next/link";
import type { Lead } from "@/lib/types";
import { fmtDate, dash, priorityClass, statusClass } from "@/lib/format";

interface Props {
  leads: Lead[];
  onView: (lead: Lead) => void;
}

export default function LeadTable({ leads, onView }: Props) {
  if (leads.length === 0) {
    return <div className="empty-state">No leads match your filters.</div>;
  }

  return (
    <div className="table-wrap">
      <table className="leads">
        <thead>
          <tr>
            <th>ID</th>
            <th>Inquiry Date</th>
            <th>Customer</th>
            <th>Business</th>
            <th>Phone</th>
            <th>Priority</th>
            <th>Call Status</th>
            <th>Call Message Detail</th>
            <th>Follow Up</th>
            <th>Retry Count</th>
            <th>Lead Person</th>
            <th>Invoice Status</th>
            <th>Proposal Status</th>
            <th>Proposal Pricing</th>
            <th>Lead Status</th>
            <th className="col-actions">Actions</th>
          </tr>
        </thead>
        <tbody>
          {leads.map((lead) => (
            <tr key={lead.inquiry_id}>
              <td>{lead.inquiry_id}</td>
              <td>{fmtDate(lead.inquiry_date)}</td>
              <td>{dash(lead.customer_name)}</td>
              <td>{dash(lead.business_name)}</td>
              <td>{dash(lead.phone_number)}</td>
              <td>
                {lead.lead_priority ? (
                  <span className={priorityClass(lead.lead_priority)}>
                    {lead.lead_priority}
                  </span>
                ) : (
                  dash(lead.lead_priority)
                )}
              </td>
              <td>{dash(lead.call_status)}</td>
              <td className="cell-wrap">{dash(lead.call_message_detail)}</td>
              <td>{fmtDate(lead.follow_up_date)}</td>
              <td>{dash(lead.retry_count)}</td>
              <td>{dash(lead.lead_person)}</td>
              <td>{dash(lead.invoice_status)}</td>
              <td>{dash(lead.proposal_status)}</td>
              <td>{dash(lead.praposal_pricing)}</td>
              <td>
                {lead.lead_status ? (
                  <span className={statusClass(lead.lead_status)}>
                    {lead.lead_status}
                  </span>
                ) : (
                  dash(lead.lead_status)
                )}
              </td>
              <td className="col-actions">
                <button
                  className="btn-ghost btn"
                  type="button"
                  onClick={() => onView(lead)}
                >
                  View
                </button>
                <Link
                  className="btn-ghost btn"
                  href={`/leads/edit/${lead.inquiry_id}`}
                >
                  Edit
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
