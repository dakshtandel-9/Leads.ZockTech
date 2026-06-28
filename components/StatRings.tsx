"use client";

import { useMemo } from "react";
import type { Lead } from "@/lib/types";

interface Props {
  leads: Lead[];
}

// The 7 lead statuses, each with a ring color. "Total" is prepended separately.
const STATUS_DEFS: { key: string; label: string; color: string }[] = [
  { key: "New", label: "New", color: "#3457d5" },
  { key: "Follow Up", label: "Follow Up", color: "#b9770e" },
  { key: "Converted", label: "Converted", color: "#1e7e45" },
  { key: "Closed", label: "Closed", color: "#5b6675" },
  { key: "Lost", label: "Lost", color: "#c0392b" },
  { key: "Interested", label: "Interested", color: "#0d9488" },
  { key: "Not Interested", label: "Not Interested", color: "#6b3fb0" },
];

const SIZE = 84;
const STROKE = 8;
const RADIUS = (SIZE - STROKE) / 2;
const CIRC = 2 * Math.PI * RADIUS;

function Ring({
  label,
  count,
  pct,
  color,
}: {
  label: string;
  count: number;
  pct: number; // 0..100
  color: string;
}) {
  // Fraction of the circumference that should be drawn.
  const dash = (Math.min(100, Math.max(0, pct)) / 100) * CIRC;

  return (
    <div className="stat-ring">
      <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`}>
        {/* Track */}
        <circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={RADIUS}
          fill="none"
          stroke="#e8edf5"
          strokeWidth={STROKE}
        />
        {/* Progress arc, starting at 12 o'clock */}
        <circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={RADIUS}
          fill="none"
          stroke={color}
          strokeWidth={STROKE}
          strokeLinecap="round"
          strokeDasharray={`${dash} ${CIRC - dash}`}
          transform={`rotate(-90 ${SIZE / 2} ${SIZE / 2})`}
        />
        <text
          x="50%"
          y="44%"
          textAnchor="middle"
          dominantBaseline="middle"
          className="stat-ring-count"
        >
          {count}
        </text>
        <text
          x="50%"
          y="64%"
          textAnchor="middle"
          dominantBaseline="middle"
          className="stat-ring-pct"
          fill={color}
        >
          {Math.round(pct)}%
        </text>
      </svg>
      <div className="stat-ring-label">{label}</div>
    </div>
  );
}

export default function StatRings({ leads }: Props) {
  const stats = useMemo(() => {
    const total = leads.length;
    const counts: Record<string, number> = {};
    for (const lead of leads) {
      const s = (lead.lead_status || "").trim();
      if (s) counts[s] = (counts[s] || 0) + 1;
    }
    return STATUS_DEFS.map((d) => {
      const count = counts[d.key] || 0;
      const pct = total > 0 ? (count / total) * 100 : 0;
      return { ...d, count, pct };
    });
  }, [leads]);

  const total = leads.length;

  return (
    <div className="stat-rings">
      <Ring label="Total" count={total} pct={100} color="#1f2733" />
      {stats.map((s) => (
        <Ring
          key={s.key}
          label={s.label}
          count={s.count}
          pct={s.pct}
          color={s.color}
        />
      ))}
    </div>
  );
}
