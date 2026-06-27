-- ZockTech Leads — Supabase schema
-- Run this in the Supabase SQL editor.

create table if not exists public.leads (
  inquiry_id          bigint generated always as identity primary key,
  inquiry_date        date,
  phone_number        text not null,
  email               text,
  customer_name       text,
  business_name       text,
  lead_priority       text,            -- 'High' | 'Medium' | 'Low'
  call_status         text,            -- see CALL_STATUS options
  call_message_detail text,
  follow_up_date      date,
  retry_count         integer default 0,
  lead_person         text,            -- 'Daksh' | 'Aryan' | 'Abhishek' | 'Nihar'
  invoice_status      text,            -- 'Yes' | 'No'
  proposal_status     text,            -- 'Yes' | 'No'
  praposal_pricing    numeric,         -- NOTE: keep this exact (mis)spelling
  created_at          timestamptz default now(),
  updated_at          timestamptz,
  lead_status         text             -- see LEAD_STATUS options
);

create index if not exists leads_inquiry_id_desc_idx on public.leads (inquiry_id desc);

-- All access happens through server-side route handlers using the anon key.
-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
-- All access happens through the server-side /api/leads route handlers, which
-- are themselves gated behind the password login. So the table is only ever
-- read/written via the anon key from your own server.
--
-- If Supabase created the table with RLS ENABLED (the default for new tables),
-- inserts/updates from the anon key are blocked unless a policy allows them,
-- and you'll see: "new row violates row-level security policy for table leads".
--
-- Pick ONE of the two options below.

-- Option A — keep RLS on, allow the anon role full access to this table:
alter table public.leads enable row level security;

drop policy if exists "anon full access" on public.leads;
create policy "anon full access" on public.leads
  for all
  to anon
  using (true)
  with check (true);

-- Option B — simplest: turn RLS off entirely (the app's password login is the
-- real access gate). Uncomment the next line and skip Option A if you prefer.
-- alter table public.leads disable row level security;

-- ---------------------------------------------------------------------------
-- WebAuthn / fingerprint (passkey) login
-- ---------------------------------------------------------------------------
-- Stores public-key credentials registered per device. The fingerprint itself
-- never leaves the user's device — we only store the public key and a signature
-- counter. Registration is gated behind the existing password login, so adding
-- a credential here proves the user already knows the shared password.

create table if not exists public.webauthn_credentials (
  credential_id text primary key,        -- base64url credential id
  public_key    text not null,           -- base64url COSE public key
  counter       bigint not null default 0,
  transports    text,                    -- comma-joined hints (e.g. "internal")
  label         text,                    -- optional human label for the device
  created_at    timestamptz default now(),
  last_used_at  timestamptz
);

-- Short-lived challenges for the register/authenticate ceremonies. A challenge
-- row is created when the client asks for options and deleted once verified.
create table if not exists public.webauthn_challenges (
  id         text primary key,           -- random token, mirrored in a cookie
  challenge  text not null,              -- base64url challenge
  kind       text not null,              -- 'registration' | 'authentication'
  created_at timestamptz default now()
);

create index if not exists webauthn_challenges_created_at_idx
  on public.webauthn_challenges (created_at);

-- Same RLS reasoning as leads: all access is server-side via the anon key,
-- behind the app's login gate. Mirror whichever option you chose above.
alter table public.webauthn_credentials enable row level security;
drop policy if exists "anon full access" on public.webauthn_credentials;
create policy "anon full access" on public.webauthn_credentials
  for all to anon using (true) with check (true);

alter table public.webauthn_challenges enable row level security;
drop policy if exists "anon full access" on public.webauthn_challenges;
create policy "anon full access" on public.webauthn_challenges
  for all to anon using (true) with check (true);
