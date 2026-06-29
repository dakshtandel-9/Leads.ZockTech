"use client";

import type { Lead } from "@/lib/types";
import { fmtDate, fmtDateTime, dash, priorityClass, statusClass } from "@/lib/format";

export default function LeadView({ lead }: { lead: Lead }) {
  return (
    <dl className="detail-list">
      <dt>ID</dt>
      <dd>{lead.inquiry_id}</dd>

      <dt>Inquiry Date</dt>
      <dd>{fmtDate(lead.inquiry_date)}</dd>

      <dt>Customer Name</dt>
      <dd>{dash(lead.customer_name)}</dd>

      <dt>Business Name</dt>
      <dd>{dash(lead.business_name)}</dd>

      <dt>Phone</dt>
      <dd>{dash(lead.phone_number)}</dd>

      <dt>Email</dt>
      <dd>{dash(lead.email)}</dd>

      <dt>Priority</dt>
      <dd>
        {lead.lead_priority ? (
          <span className={priorityClass(lead.lead_priority)}>
            {lead.lead_priority}
          </span>
        ) : (
          dash(lead.lead_priority)
        )}
      </dd>

      <dt>Call Status</dt>
      <dd>{dash(lead.call_status)}</dd>

      <dt>Call / Message Detail</dt>
      <dd>{dash(lead.call_message_detail)}</dd>

      <dt>Additional Message</dt>
      <dd>{dash(lead.additional_message)}</dd>

      <dt>Follow Up Date</dt>
      <dd>{fmtDateTime(lead.follow_up_date)}</dd>

      <dt>Meeting Fixed Date &amp; Time</dt>
      <dd>{fmtDateTime(lead.meeting_datetime)}</dd>

      <dt>Retry Count</dt>
      <dd>{dash(lead.retry_count)}</dd>

      <dt>Lead Person</dt>
      <dd>{dash(lead.lead_person)}</dd>

      <dt>Invoice Status</dt>
      <dd>{dash(lead.invoice_status)}</dd>

      <dt>Proposal Status</dt>
      <dd>{dash(lead.proposal_status)}</dd>

      <dt>Send Proposal</dt>
      <dd>{dash(lead.send_proposal)}</dd>

      <dt>Proposal Pricing</dt>
      <dd>{dash(lead.praposal_pricing)}</dd>

      <dt>Lead Status</dt>
      <dd>
        {lead.lead_status ? (
          <span className={statusClass(lead.lead_status)}>
            {lead.lead_status}
          </span>
        ) : (
          dash(lead.lead_status)
        )}
      </dd>

      <dt>Created At</dt>
      <dd>{fmtDateTime(lead.created_at)}</dd>

      <dt>Updated At</dt>
      <dd>{fmtDateTime(lead.updated_at)}</dd>
    </dl>
  );
}
