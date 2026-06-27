export type LeadPriority = "High" | "Medium" | "Low";

export type CallStatus =
  | "Answered" | "Unanswered" | "Busy"
  | "No Response" | "Interested" | "Not Interested";

export type LeadStatus =
  | "New" | "Follow Up" | "Converted"
  | "Closed" | "Lost" | "Not Interested";

export type YesNo = "Yes" | "No";

export interface Lead {
  inquiry_id: number;
  inquiry_date: string | null;
  phone_number: string;
  email: string | null;
  customer_name: string | null;
  business_name: string | null;
  lead_priority: LeadPriority | string | null;
  call_status: CallStatus | string | null;
  call_message_detail: string | null;
  follow_up_date: string | null;
  retry_count: number | null;
  lead_person: string | null;
  invoice_status: YesNo | string | null;
  proposal_status: YesNo | string | null;
  praposal_pricing: number | null;     // keep this spelling
  created_at: string | null;
  updated_at: string | null;
  lead_status: LeadStatus | string | null;
}

export interface LeadPayload {           // create/update; inquiry_id only on update
  inquiry_id?: number;
  inquiry_date: string;
  phone_number: string;
  email?: string | null;
  customer_name?: string | null;
  business_name?: string | null;
  lead_priority?: string | null;
  call_status?: string | null;
  call_message_detail?: string | null;
  follow_up_date?: string | null;
  retry_count?: number | null;
  lead_person?: string | null;
  invoice_status?: string | null;
  proposal_status?: string | null;
  praposal_pricing?: number | null;
  lead_status?: string | null;
}

export interface ApiWriteResponse { status: number; message: string; inquiry_id?: number; }

export const LEAD_PRIORITY_OPTIONS: LeadPriority[] = ["High", "Medium", "Low"];
export const CALL_STATUS_OPTIONS: CallStatus[] = ["Answered","Unanswered","Busy","No Response","Interested","Not Interested"];
export const LEAD_STATUS_OPTIONS: LeadStatus[] = ["New","Follow Up","Converted","Closed","Lost","Not Interested"];
export const YES_NO_OPTIONS: YesNo[] = ["Yes", "No"];
export const LEAD_PERSON_OPTIONS: string[] = ["Daksh", "Aryan", "Abhishek", "Nihar"];
