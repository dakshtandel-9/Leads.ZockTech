"use client";

import { useMemo } from "react";

/**
 * A 12-hour (AM/PM) datetime picker that never shows 24-hour time, regardless
 * of the browser/OS locale. The native <input type="datetime-local"> can't be
 * forced to 12-hour, so we compose a date input with explicit hour / minute /
 * meridiem dropdowns.
 *
 * Value in/out is the same `YYYY-MM-DDTHH:mm` (24h, internal) string the form
 * already uses, so this is a drop-in replacement for the datetime-local input.
 */

interface Props {
  value: string; // "YYYY-MM-DDTHH:mm" or ""
  onChange: (value: string) => void;
}

interface Parts {
  date: string; // YYYY-MM-DD
  hour12: number; // 1..12
  minute: number; // 0..59
  meridiem: "AM" | "PM";
}

function parse(value: string): Parts {
  const m = value.match(/^(\d{4}-\d{2}-\d{2})T(\d{2}):(\d{2})/);
  if (!m) {
    return { date: "", hour12: 12, minute: 0, meridiem: "AM" };
  }
  const date = m[1];
  let h = parseInt(m[2], 10);
  const minute = parseInt(m[3], 10);
  const meridiem: "AM" | "PM" = h >= 12 ? "PM" : "AM";
  let hour12 = h % 12;
  if (hour12 === 0) hour12 = 12;
  return { date, hour12, minute, meridiem };
}

function compose(p: Parts): string {
  if (!p.date) return "";
  let h = p.hour12 % 12; // 12 -> 0
  if (p.meridiem === "PM") h += 12; // 0..11 -> 12..23
  const hh = String(h).padStart(2, "0");
  const mm = String(p.minute).padStart(2, "0");
  return `${p.date}T${hh}:${mm}`;
}

export default function DateTime12({ value, onChange }: Props) {
  const parts = useMemo(() => parse(value), [value]);

  function update(next: Partial<Parts>) {
    const merged = { ...parts, ...next };
    // If a time is set but no date yet, don't emit a partial value.
    onChange(compose(merged));
  }

  const hours = Array.from({ length: 12 }, (_, i) => i + 1); // 1..12
  const minutes = Array.from({ length: 60 }, (_, i) => i); // 0..59

  return (
    <div className="dt12">
      <input
        type="date"
        className="dt12-date"
        value={parts.date}
        onChange={(e) => update({ date: e.target.value })}
      />
      <div className="dt12-time">
        <select
          aria-label="Hour"
          value={parts.hour12}
          onChange={(e) => update({ hour12: Number(e.target.value) })}
        >
          {hours.map((h) => (
            <option key={h} value={h}>
              {h}
            </option>
          ))}
        </select>
        <span className="dt12-colon">:</span>
        <select
          aria-label="Minute"
          value={parts.minute}
          onChange={(e) => update({ minute: Number(e.target.value) })}
        >
          {minutes.map((mn) => (
            <option key={mn} value={mn}>
              {String(mn).padStart(2, "0")}
            </option>
          ))}
        </select>
        <select
          aria-label="AM or PM"
          value={parts.meridiem}
          onChange={(e) =>
            update({ meridiem: e.target.value as "AM" | "PM" })
          }
        >
          <option value="AM">AM</option>
          <option value="PM">PM</option>
        </select>
      </div>
    </div>
  );
}
