"use client";

import Link from "next/link";

export default function TopBar() {
  return (
    <div className="topbar">
      <div className="topbar-inner">
        <Link href="/leads" className="brand">
          ZockTech <span>Leads</span>
        </Link>
        <a className="btn-secondary btn" href="/api/logout">
          Logout
        </a>
      </div>
    </div>
  );
}
