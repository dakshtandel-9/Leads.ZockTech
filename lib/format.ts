const EM_DASH = "—";

function parseDate(value: string | null | undefined): Date | null {
  if (!value) return null;
  // "YYYY-MM-DD" -> treat as local date (avoid TZ shifting the day).
  const dateOnly = /^\d{4}-\d{2}-\d{2}$/;
  if (dateOnly.test(value)) {
    const [y, m, d] = value.split("-").map(Number);
    const dt = new Date(y, m - 1, d);
    return isNaN(dt.getTime()) ? null : dt;
  }
  const dt = new Date(value);
  return isNaN(dt.getTime()) ? null : dt;
}

export function fmtDate(value: string | null | undefined): string {
  const dt = parseDate(value);
  if (!dt) return EM_DASH;
  return dt.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function fmtDateTime(value: string | null | undefined): string {
  const dt = parseDate(value);
  if (!dt) return EM_DASH;
  return dt.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function dash(value: unknown): string {
  if (value === null || value === undefined || value === "") return EM_DASH;
  return String(value);
}

export function priorityClass(p: string | null | undefined): string {
  switch (p) {
    case "High":
      return "badge badge-high";
    case "Medium":
      return "badge badge-medium";
    case "Low":
      return "badge badge-low";
    default:
      return "badge badge-default";
  }
}

export function statusClass(s: string | null | undefined): string {
  if (!s) return "badge badge-default";
  const key = s.replace(/\s+/g, "");
  return `badge status-${key}`;
}
