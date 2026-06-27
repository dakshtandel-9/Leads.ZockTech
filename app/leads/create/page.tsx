"use client";

import Link from "next/link";
import LeadForm from "@/components/LeadForm";

export default function CreateLeadPage() {
  return (
    <>
      <div className="page-head">
        <h1>Create Lead</h1>
        <div className="head-actions">
          <Link className="btn btn-secondary" href="/leads">
            Back to Leads
          </Link>
        </div>
      </div>
      <LeadForm mode="create" />
    </>
  );
}
