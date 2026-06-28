"use client";

import { useState } from "react";
import type { Lead } from "@/lib/types";
import { fmtDateTime, dash } from "@/lib/format";
import LeadModal from "@/components/LeadModal";
import ProposalsToSend from "@/components/ProposalsToSend";

interface Props {
  leads: Lead[];
  onView: (lead: Lead) => void;
}

type Field = "meeting_datetime" | "follow_up_date";

// How many upcoming items to show in the card before the "more" button.
const SHOW_COUNT = 2;

function ts(value: string | null | undefined): number | null {
  if (!value) return null;
  const t = new Date(value).getTime();
  return isNaN(t) ? null : t;
}

// All leads at-or-after now for the given datetime field, soonest first.
function upcomingList(leads: Lead[], field: Field): Lead[] {
  const now = Date.now();
  return leads
    .map((lead) => ({ lead, t: ts(lead[field] as string | null) }))
    .filter((x): x is { lead: Lead; t: number } => x.t !== null && x.t >= now)
    .sort((a, b) => a.t - b.t)
    .map((x) => x.lead);
}

function ItemRow({
  lead,
  field,
  onView,
  separated,
}: {
  lead: Lead;
  field: Field;
  onView: (lead: Lead) => void;
  separated?: boolean;
}) {
  return (
    <div className={separated ? "upcoming-item upcoming-item-sep" : "upcoming-item"}>
      <div className="upcoming-body">
        <div className="upcoming-time">
          {fmtDateTime(lead[field] as string | null)}
        </div>
        <div className="upcoming-name">{dash(lead.customer_name)}</div>
        <div className="upcoming-phone">{dash(lead.phone_number)}</div>
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

function UpcomingCard({
  label,
  field,
  list,
  onView,
}: {
  label: string;
  field: Field;
  list: Lead[];
  onView: (lead: Lead) => void;
}) {
  const [showAll, setShowAll] = useState(false);
  const visible = list.slice(0, SHOW_COUNT);
  const extra = list.length - visible.length;

  return (
    <div className="upcoming-card">
      <div className="upcoming-head">
        <span className="upcoming-label">{label}</span>
      </div>

      {list.length > 0 ? (
        <div className="upcoming-list">
          {visible.map((lead, i) => (
            <ItemRow
              key={lead.inquiry_id}
              lead={lead}
              field={field}
              onView={onView}
              separated={i > 0}
            />
          ))}
        </div>
      ) : (
        <div className="upcoming-empty">None scheduled</div>
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
          title={`${label} — all ${list.length}`}
          onClose={() => setShowAll(false)}
        >
          <div className="upcoming-list">
            {list.map((lead, i) => (
              <ItemRow
                key={lead.inquiry_id}
                lead={lead}
                field={field}
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

export default function UpcomingCards({ leads, onView }: Props) {
  const meetings = upcomingList(leads, "meeting_datetime");
  const followUps = upcomingList(leads, "follow_up_date");

  return (
    <div className="upcoming-grid upcoming-grid-3">
      <UpcomingCard
        label="Next Meeting"
        field="meeting_datetime"
        list={meetings}
        onView={onView}
      />
      <UpcomingCard
        label="Next Follow Up"
        field="follow_up_date"
        list={followUps}
        onView={onView}
      />
      <ProposalsToSend leads={leads} onView={onView} />
    </div>
  );
}
