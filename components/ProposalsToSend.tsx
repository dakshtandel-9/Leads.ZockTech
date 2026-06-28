"use client";

import { useMemo, useState } from "react";
import type { Lead } from "@/lib/types";
import { dash } from "@/lib/format";
import LeadModal from "@/components/LeadModal";

interface Props {
  leads: Lead[];
  onView: (lead: Lead) => void;
}

const SHOW_COUNT = 2;

function isYes(v: string | null | undefined): boolean {
  return (v || "").trim().toLowerCase() === "yes";
}

// Leads that need a proposal sent: Send Proposal = Yes, but the proposal hasn't
// gone out yet (Proposal Status not yet Yes). Once Proposal Status is Yes, it's
// done and drops off this list.
function toSend(leads: Lead[]): Lead[] {
  return leads.filter(
    (l) => isYes(l.send_proposal) && !isYes(l.proposal_status)
  );
}

function ItemRow({
  lead,
  onView,
  separated,
}: {
  lead: Lead;
  onView: (lead: Lead) => void;
  separated?: boolean;
}) {
  return (
    <div className={separated ? "upcoming-item upcoming-item-sep" : "upcoming-item"}>
      <div className="upcoming-body">
        <div className="upcoming-name">{dash(lead.customer_name)}</div>
        <div className="upcoming-phone">{dash(lead.phone_number)}</div>
        {lead.business_name && (
          <div className="upcoming-phone">{lead.business_name}</div>
        )}
      </div>
      <button
        type="button"
        className="info-btn"
        aria-label="View details"
        title="View details"
        onClick={() => onView(lead)}
      >
        ⓘ
      </button>
    </div>
  );
}

export default function ProposalsToSend({ leads, onView }: Props) {
  const list = useMemo(() => toSend(leads), [leads]);
  const [showAll, setShowAll] = useState(false);

  const visible = list.slice(0, SHOW_COUNT);
  const extra = list.length - visible.length;

  return (
    <div className="upcoming-card">
      <div className="upcoming-head">
        <span className="upcoming-label">Proposals to Send</span>
        {list.length > 0 && (
          <span className="proposal-count">{list.length}</span>
        )}
      </div>

      {list.length > 0 ? (
        <div className="upcoming-list">
          {visible.map((lead, i) => (
            <ItemRow
              key={lead.inquiry_id}
              lead={lead}
              onView={onView}
              separated={i > 0}
            />
          ))}
        </div>
      ) : (
        <div className="upcoming-empty">Nothing pending</div>
      )}

      {extra > 0 && (
        <button
          type="button"
          className="upcoming-more"
          onClick={() => setShowAll(true)}
        >
          +{extra} more
        </button>
      )}

      {showAll && (
        <LeadModal
          title={`Proposals to Send — ${list.length}`}
          onClose={() => setShowAll(false)}
        >
          <div className="upcoming-list">
            {list.map((lead, i) => (
              <ItemRow
                key={lead.inquiry_id}
                lead={lead}
                onView={(l) => {
                  setShowAll(false);
                  onView(l);
                }}
                separated={i > 0}
              />
            ))}
          </div>
        </LeadModal>
      )}
    </div>
  );
}
