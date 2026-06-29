"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Lead } from "@/lib/types";
import { fmtDateTime, dash } from "@/lib/format";
import LeadModal from "@/components/LeadModal";
import ProposalsToSend from "@/components/ProposalsToSend";
import { markDone } from "@/services/leads.service";

interface Props {
  leads: Lead[];
  onView: (lead: Lead) => void;
  onChanged: () => void; // refresh leads after a "Done" toggle
}

type Field = "meeting_datetime" | "follow_up_date";
type DoneField = "meeting_done" | "follow_up_done";

const DONE_FIELD: Record<Field, DoneField> = {
  meeting_datetime: "meeting_done",
  follow_up_date: "follow_up_done",
};

// How many items to show in the card before the "more" button.
const SHOW_COUNT = 2;

function ts(value: string | null | undefined): number | null {
  if (!value) return null;
  const t = new Date(value).getTime();
  return isNaN(t) ? null : t;
}

// Human-readable "how late" label for an overdue timestamp.
function overdueLabel(t: number): string {
  const mins = Math.floor((Date.now() - t) / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins} min overdue`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hr ${mins % 60} min overdue`;
  const days = Math.floor(hrs / 24);
  return `${days} day${days > 1 ? "s" : ""} overdue`;
}

// Leads with a date set for this field that aren't marked done yet — including
// overdue ones — soonest first. Overdue items stay until the user clears them.
function pendingList(leads: Lead[], field: Field): Lead[] {
  const doneField = DONE_FIELD[field];
  return leads
    .map((lead) => ({ lead, t: ts(lead[field] as string | null) }))
    .filter(
      (x): x is { lead: Lead; t: number } =>
        x.t !== null && !x.lead[doneField]
    )
    .sort((a, b) => a.t - b.t)
    .map((x) => x.lead);
}

function ItemRow({
  lead,
  field,
  onView,
  onDone,
  busy,
  separated,
}: {
  lead: Lead;
  field: Field;
  onView: (lead: Lead) => void;
  onDone: (lead: Lead) => void;
  busy: boolean;
  separated?: boolean;
}) {
  const t = ts(lead[field] as string | null);
  const overdue = t !== null && t < Date.now();

  return (
    <div className={separated ? "upcoming-item upcoming-item-sep" : "upcoming-item"}>
      <div className="upcoming-body">
        <div className={overdue ? "upcoming-time is-overdue" : "upcoming-time"}>
          <span>{fmtDateTime(lead[field] as string | null)}</span>
          {overdue && t !== null && (
            <span className="overdue-tag">{overdueLabel(t)}</span>
          )}
        </div>
        <div className="upcoming-name">{dash(lead.customer_name)}</div>
        <div className="upcoming-phone">{dash(lead.phone_number)}</div>
        <button
          type="button"
          className="btn-done"
          disabled={busy}
          onClick={() => onDone(lead)}
        >
          {busy ? "…" : "✓ Done"}
        </button>
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
  onChanged,
}: {
  label: string;
  field: Field;
  list: Lead[];
  onView: (lead: Lead) => void;
  onChanged: () => void;
}) {
  const router = useRouter();
  const [showAll, setShowAll] = useState(false);
  const [busyId, setBusyId] = useState<number | null>(null);

  const visible = list.slice(0, SHOW_COUNT);
  const extra = list.length - visible.length;

  async function handleDone(lead: Lead) {
    setBusyId(lead.inquiry_id);
    try {
      await markDone(lead.inquiry_id, { [DONE_FIELD[field]]: true });
      onChanged();
      // Open the lead's edit page after marking the item done.
      router.push(`/leads/edit/${lead.inquiry_id}`);
    } finally {
      setBusyId(null);
    }
  }

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
              onDone={handleDone}
              busy={busyId === lead.inquiry_id}
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
                onDone={handleDone}
                busy={busyId === lead.inquiry_id}
                separated={i > 0}
              />
            ))}
          </div>
        </LeadModal>
      )}
    </div>
  );
}

export default function UpcomingCards({ leads, onView, onChanged }: Props) {
  const meetings = pendingList(leads, "meeting_datetime");
  const followUps = pendingList(leads, "follow_up_date");

  return (
    <div className="upcoming-grid upcoming-grid-3">
      <UpcomingCard
        label="Next Meeting"
        field="meeting_datetime"
        list={meetings}
        onView={onView}
        onChanged={onChanged}
      />
      <UpcomingCard
        label="Next Follow Up"
        field="follow_up_date"
        list={followUps}
        onView={onView}
        onChanged={onChanged}
      />
      <ProposalsToSend leads={leads} onView={onView} />
    </div>
  );
}
