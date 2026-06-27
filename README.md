# ZockTech Leads

Lead-management web app — Next.js 14 (App Router) + TypeScript + Supabase, with
a single shared-password login.

## Setup

1. **Install**

   ```bash
   npm install
   ```

2. **Supabase** — create a project, then run [`supabase/schema.sql`](supabase/schema.sql)
   in the SQL editor to create the `leads` table.

3. **Environment** — copy `.env.local.example` to `.env.local` and fill in:

   ```
   NEXT_PUBLIC_SUPABASE_URL=https://<your-project>.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=<your anon key>
   APP_PASSWORD=<the single login password>   # server-side only
   ```

4. **Run**

   ```bash
   npm run dev      # http://localhost:3000
   ```

## How it works

- **Auth** — `/login` POSTs the password to `app/api/login`, which compares it to
  `APP_PASSWORD` and sets an httpOnly cookie holding an opaque session token
  (a hash of the password — the password itself is never sent back to the client).
  `middleware.ts` redirects unauthenticated requests to `/login`, and `/` to
  `/leads` (or `/login`). `/api/logout` clears the cookie. Data routes
  (`/api/leads`) re-validate the session token server-side.
- **Data** — all reads/writes go through `app/api/leads/route.ts` using the
  server-side Supabase client. The browser only calls same-origin routes via
  `services/leads.service.ts`.

## Routes

| Route               | Purpose                                  |
| ------------------- | ---------------------------------------- |
| `/login`            | Password login                           |
| `/leads`            | List: table + filters + pagination + view modal |
| `/leads/create`     | Create form                              |
| `/leads/edit/[id]`  | Edit form                                |

## Notes

- `praposal_pricing` keeps its (intentional) misspelling to match the schema.
- Leads sort newest-first by `inquiry_id` descending; filtering and pagination
  are client-side.
# Leads.ZockTech
