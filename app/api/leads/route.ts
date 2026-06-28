import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { AUTH_COOKIE, isValidSession } from "@/lib/auth";
import type { Lead, LeadPayload } from "@/lib/types";

const TABLE = "leads";

function unauthorized() {
  return NextResponse.json(
    { status: 401, message: "Unauthorized" },
    { status: 401 }
  );
}

function authed(req: NextRequest): boolean {
  return isValidSession(req.cookies.get(AUTH_COOKIE)?.value);
}

// Whitelist of writable columns (praposal_pricing spelling preserved).
function normalizePayload(body: LeadPayload) {
  const str = (v: unknown): string | null => {
    if (v === null || v === undefined) return null;
    const s = String(v).trim();
    return s === "" ? null : s;
  };
  const num = (v: unknown): number | null => {
    if (v === null || v === undefined || v === "") return null;
    const n = Number(v);
    return isNaN(n) ? null : n;
  };

  return {
    inquiry_date: str(body.inquiry_date),
    phone_number: str(body.phone_number) ?? "",
    email: str(body.email),
    customer_name: str(body.customer_name),
    business_name: str(body.business_name),
    lead_priority: str(body.lead_priority),
    call_status: str(body.call_status),
    call_message_detail: str(body.call_message_detail),
    follow_up_date: str(body.follow_up_date),
    meeting_datetime: str(body.meeting_datetime),
    retry_count: body.retry_count === null || body.retry_count === undefined
      ? 0
      : num(body.retry_count) ?? 0,
    lead_person: str(body.lead_person),
    invoice_status: str(body.invoice_status),
    proposal_status: str(body.proposal_status),
    send_proposal: str(body.send_proposal),
    praposal_pricing: num(body.praposal_pricing),
    lead_status: str(body.lead_status),
  };
}

export async function GET(req: NextRequest) {
  if (!authed(req)) return unauthorized();

  try {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from(TABLE)
      .select("*")
      .order("inquiry_id", { ascending: false });

    if (error) {
      return NextResponse.json(
        { status: 500, message: error.message },
        { status: 500 }
      );
    }
    return NextResponse.json((data ?? []) as Lead[]);
  } catch (e: any) {
    return NextResponse.json(
      { status: 500, message: e?.message ?? "Server error" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  if (!authed(req)) return unauthorized();

  try {
    const body = (await req.json()) as LeadPayload;
    if (!body.phone_number || String(body.phone_number).trim() === "") {
      return NextResponse.json(
        { status: 400, message: "phone_number is required" },
        { status: 400 }
      );
    }

    const row = normalizePayload(body);
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from(TABLE)
      .insert(row)
      .select("inquiry_id")
      .single();

    if (error) {
      return NextResponse.json(
        { status: 500, message: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      status: 200,
      message: "Lead created",
      inquiry_id: data?.inquiry_id,
    });
  } catch (e: any) {
    return NextResponse.json(
      { status: 500, message: e?.message ?? "Server error" },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  if (!authed(req)) return unauthorized();

  try {
    const body = (await req.json()) as LeadPayload;
    if (!body.inquiry_id) {
      return NextResponse.json(
        { status: 400, message: "inquiry_id is required for update" },
        { status: 400 }
      );
    }
    if (!body.phone_number || String(body.phone_number).trim() === "") {
      return NextResponse.json(
        { status: 400, message: "phone_number is required" },
        { status: 400 }
      );
    }

    const row = { ...normalizePayload(body), updated_at: new Date().toISOString() };
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from(TABLE)
      .update(row)
      .eq("inquiry_id", body.inquiry_id)
      .select("inquiry_id")
      .single();

    if (error) {
      return NextResponse.json(
        { status: 500, message: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      status: 200,
      message: "Lead updated",
      inquiry_id: data?.inquiry_id,
    });
  } catch (e: any) {
    return NextResponse.json(
      { status: 500, message: e?.message ?? "Server error" },
      { status: 500 }
    );
  }
}
