"use client";

interface Props {
  total: number;
  page: number; // 1-based
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
}

const PAGE_SIZES = [10, 25, 50, 100];

// Build a compact page list like: 1 … 4 5 [6] 7 8 … 20
function buildPages(current: number, totalPages: number): (number | "…")[] {
  const pages: (number | "…")[] = [];
  const window = 1; // pages on each side of current

  for (let p = 1; p <= totalPages; p++) {
    const isEdge = p === 1 || p === totalPages;
    const inWindow = p >= current - window && p <= current + window;
    if (isEdge || inWindow) {
      pages.push(p);
    } else if (pages[pages.length - 1] !== "…") {
      pages.push("…");
    }
  }
  return pages;
}

export default function Pagination({
  total,
  page,
  pageSize,
  onPageChange,
  onPageSizeChange,
}: Props) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const start = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, total);
  const pages = buildPages(page, totalPages);

  return (
    <div className="pagination">
      <div className="info">
        Showing {start}–{end} of {total}
      </div>

      <div className="controls">
        <button
          className="page-btn"
          type="button"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
        >
          Prev
        </button>

        {pages.map((p, i) =>
          p === "…" ? (
            <span key={`e${i}`} className="page-ellipsis">
              …
            </span>
          ) : (
            <button
              key={p}
              type="button"
              className={p === page ? "page-btn active" : "page-btn"}
              onClick={() => onPageChange(p)}
            >
              {p}
            </button>
          )
        )}

        <button
          className="page-btn"
          type="button"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
        >
          Next
        </button>
      </div>

      <div className="page-size">
        <span>Rows</span>
        <select
          value={pageSize}
          onChange={(e) => onPageSizeChange(Number(e.target.value))}
        >
          {PAGE_SIZES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
