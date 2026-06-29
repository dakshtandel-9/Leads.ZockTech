"use client";

import {
  LEAD_PRIORITY_OPTIONS,
  CALL_STATUS_OPTIONS,
  LEAD_STATUS_OPTIONS,
  LEAD_PERSON_OPTIONS,
} from "@/lib/types";

export interface Filters {
  search: string;
  priority: string;
  callStatus: string;
  leadStatus: string;
  leadPerson: string;
  followUpDate: string;
}

export const EMPTY_FILTERS: Filters = {
  search: "",
  priority: "",
  callStatus: "",
  leadStatus: "",
  leadPerson: "",
  followUpDate: "",
};

const STATUS_TABS = ["All", ...LEAD_STATUS_OPTIONS];

interface Props {
  filters: Filters;
  onChange: (filters: Filters) => void;
}

export default function LeadFilters({ filters, onChange }: Props) {
  function set<K extends keyof Filters>(key: K, value: Filters[K]) {
    onChange({ ...filters, [key]: value });
  }

  function clearAll() {
    onChange({ ...EMPTY_FILTERS });
  }

  return (
    <div className="card card-pad filters">
      <div className="filters-grid">
        <div className="field">
          <label>Search</label>
          <input
            type="text"
            value={filters.search}
            placeholder="Name, business, phone, email…"
            onChange={(e) => set("search", e.target.value)}
          />
        </div>

        <div className="field">
          <label>Priority</label>
          <select
            value={filters.priority}
            onChange={(e) => set("priority", e.target.value)}
          >
            <option value="">All</option>
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
            value={filters.callStatus}
            onChange={(e) => set("callStatus", e.target.value)}
          >
            <option value="">All</option>
            <option value="__none__">None</option>
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
            value={filters.leadPerson}
            onChange={(e) => set("leadPerson", e.target.value)}
          >
            <option value="">All</option>
            {LEAD_PERSON_OPTIONS.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </div>

        <div className="field">
          <label>Follow Up Date</label>
          <input
            type="date"
            value={filters.followUpDate}
            onChange={(e) => set("followUpDate", e.target.value)}
          />
        </div>

        <div className="filters-clear">
          <button className="btn btn-secondary" onClick={clearAll} type="button">
            Clear
          </button>
        </div>
      </div>

      <div className="filters-divider" />

      <div className="filters-status">
        <span className="label">Lead Status</span>
        <div className="tab-row">
          {STATUS_TABS.map((tab) => {
            const value = tab === "All" ? "" : tab;
            const active = filters.leadStatus === value;
            return (
              <button
                key={tab}
                type="button"
                className={active ? "tab tab-active" : "tab"}
                onClick={() => set("leadStatus", value)}
              >
                {tab}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
