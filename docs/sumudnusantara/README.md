# Sumud Nusantara Vessel Tracker – Rebuild Plan (Vercel + Next.js + Supabase)

This document outlines the end‑to‑end plan to rebuild the Sumud Nusantara Vessel Tracker as a production‑grade Vercel Next.js app using Supabase as the backend (BaaS).

References in this folder you should keep open while implementing:
- Credentials and env: `./credentials.md`
- External APIs spec: `./externalAPIs.md`
- Sample GSF payload: `./sampleGSFData.json`

## Goals (User capabilities)

### Public-facing (no auth required)
- View a fast map of all currently active flotilla vessels with custom styling.
- Playback historical tracks from earliest timestamp to now with a timeline player (touch-friendly scrubber).
- See incident markers on the timeline; clicking shows a details modal.
- Click a vessel to open a details panel (status, origin, speed/course, last position, photo when available).
- Show counts of active vessels and color-code by origin port; triangle icons show course/heading.
- Expand a full vessel list with current status and quick actions.
- Login button to access admin dashboard.

### Admin Dashboard (auth required)
- Submit/edit incident reports for timeline events.
- Manage vessel metadata and status updates.
- View ingestion logs and data quality metrics.
- Configure timeline playback settings and map styles.
- User management (admin roles).

## Non-goals (for this phase)
- Integration with Bencana auth system (kept completely separate).
- Real-time collaboration features.

---

## High-level Architecture

- Frontend: Next.js (App Router) on Vercel, React 18, TypeScript, React-Leaflet for maps.
- Backend (BaaS): Supabase Postgres + REST (PostgREST) + Auth + RLS policies (read-only public, write for authenticated users) + Edge Functions if needed.
- Authentication: Supabase Auth (separate from Bencana) with email/password and optional OAuth providers.
- Data ingestion: Vercel Cron job calls a Next.js route (Edge/Node) every 15 minutes to fetch from GSF API and upsert into Supabase.
- Realtime is not required; freshness is 15 minutes.

### Data Flow
1) Vercel Cron → Next.js route `/api/sumud/fetch-gsf` → fetch GSF (`GSF_API_ENDPOINT`) → normalize → upsert to Supabase.
2) Frontend pages and hooks query Supabase (via `@supabase/supabase-js`) with row-level filters and composite indexes for performant queries.
3) Map renders current positions; timeline player streams decimated positions for playback.
4) Incident data comes from `externalAPIs.md` webhooks; normalized into `incidents` table for unified timeline markers.

---

## App Structure and Separation from Bencana

We keep Sumud in its own feature folder and routes so Bencana remains untouched.

```
src/
  app/
    bencana/                # existing app (DO NOT MODIFY)
    sumudnusantara/
      page.tsx              # public-facing main route
      layout.tsx            # route-specific layout with auth provider
      login/
        page.tsx            # login page
      dashboard/
        page.tsx            # admin dashboard (protected)
        incidents/
          page.tsx          # incident management
        vessels/
          page.tsx          # vessel management
        settings/
          page.tsx          # admin settings
      api/
        fetch-gsf/route.ts  # cron target endpoint (server-only)
        incidents/route.ts  # CRUD for incidents (auth required)
        auth/route.ts       # auth helpers if needed
  features/
    sumud/                  # colocated feature code (no overlap with bencana)
      components/
        public/
          MapView.tsx
          TimelinePlayer.tsx
          VesselDetailsPanel.tsx
          IncidentModal.tsx
          VesselList.tsx
          LoginButton.tsx
        admin/
          IncidentForm.tsx
          VesselManagement.tsx
          AdminDashboard.tsx
      hooks/
        useActiveVessels.ts
        useVesselTrack.ts
        useIncidents.ts
        useAuth.ts          # Sumud-specific auth hooks
      context/
        TimelineContext.tsx
        AuthContext.tsx     # Sumud auth context (separate from Bencana)
      lib/
        supabaseClient.ts   # Sumud-specific Supabase client
        auth.ts             # auth utilities
        gsf-normalizers.ts
        playback-decimator.ts
      types/
        domain.ts
        auth.ts
```

Notes:
- New `features/sumud/*` avoids reusing removed shared files. Bencana imports remain unchanged.
- Shared utilities that truly belong to both apps can later be moved into a neutral `shared/` directory once required (not part of this rebuild).

---

## Supabase Schema (tables, indexes, access)

Tables (minimum viable):
- `vessels` (EXISTING - 55 records, 50 active)
  - id (integer, pk)                    -- existing
  - gsf_id (integer, unique)            -- existing, matches GSF API
  - mmsi (text, nullable)              -- existing
  - name (text)                         -- existing
  - origin (text, nullable)             -- existing
  - image_url (text, nullable)         -- existing
  - type (text, nullable)               -- existing
  - status (text, default 'active')     -- existing: 'active' or 'decommissioned'
  - vessel_status (text, nullable)      -- existing: 'sailing', etc.
  - created_at (timestamptz)            -- existing
  - updated_at (timestamptz)            -- existing
  - last_status_at (timestamptz, nullable) -- TO ADD

- `vessel_positions` (EXISTING - 12,312 records)
  - id (integer, pk)                     -- existing
  - vessel_id (integer, fk → vessels.id) -- existing, nullable
  - gsf_vessel_id (integer)             -- existing, links to GSF API
  - timestamp_utc (timestamptz)         -- existing
  - latitude (numeric)                  -- existing
  - longitude (numeric)                 -- existing
  - speed_knots (numeric, nullable)     -- existing
  - course (numeric, nullable)          -- existing
  - created_at (timestamptz)            -- existing

- `incidents`
  - id (bigserial, pk)
  - timestamp_utc (timestamptz, indexed)
  - title (text)
  - description (text)
  - severity (text, nullable)
  - category (text, nullable)
  - location (text, nullable)
  - source_url (text, nullable)
  - created_by (uuid, fk → auth.users.id, nullable)  -- admin who created
  - created_at (timestamptz, default now())
  - updated_at (timestamptz)

- `user_roles` (for Sumud-specific roles)
  - id (bigserial, pk)
  - user_id (uuid, fk → auth.users.id, unique)
  - role (text) -- 'admin', 'editor', 'viewer'
  - created_at (timestamptz, default now())

Indexes:
- `vessels(status)` -- existing, for filtering active/decommissioned
- `vessels(gsf_id)` unique -- existing
- `vessel_positions(gsf_vessel_id, timestamp_utc)` -- existing, composite
- `incidents(timestamp_utc)` -- TO ADD
- `user_roles(user_id)` unique -- TO ADD

RLS Policies:
- Enable RLS on all tables.
- Public read access: `SELECT` for `anon` role on `vessels`, `vessel_positions`, `incidents`.
- Admin write access: `INSERT/UPDATE/DELETE` for authenticated users with `admin` or `editor` role on `incidents`.
- Admin management: Full access for `admin` role on `vessels`, `user_roles`.

---

## Data Ingestion and Normalization

Sources:
- GSF vessels endpoint and fields: see `./credentials.md` and `./sampleGSFData.json`.
- Incident/timeline webhooks: see `./externalAPIs.md`.

Normalization strategy:
- Upsert into `vessels` on primary identifier hierarchy: `mmsi` (if present) else stable `id` from GSF.
- Extract `positions` array from GSF item; parse JSON string if embedded as text; append to `vessel_positions` with conflict avoidance `(vessel_id, timestamp_utc)`.
- Compute `is_active` as “has a position in the last N hours” (configurable; default 24h) during ingestion for quick filtering.
- Derive `last_status` from webhook source and stamp `last_status_at`.
- Optional decimation: store per-vessel “overview track” (downsampled) in a materialized view for fast playback. Example view name: `mv_vessel_positions_decimated`.

Idempotency:
- Use `ON CONFLICT` upserts.
- Maintain a simple ingestion ledger table `ingestion_runs(id, source, started_at, finished_at, records_processed)` for auditing.

---

## Scheduling (Vercel Cron)

Configure Vercel Cron to call the ingestion route every 15 minutes.

- In `vercel.json`:
```json
{
  "crons": [
    { "path": "/api/sumud/fetch-gsf", "schedule": "*/15 * * * *" }
  ]
}
```

- Route handler outline: `src/app/api/sumud/fetch-gsf/route.ts`
  - Server-only; fetch `GSF_API_ENDPOINT` using bearer token from env (loaded from `./credentials.md`).
  - Normalize and upsert into Supabase.
  - Optionally fetch incident CSV endpoints and upsert to `incidents`.

Environment variables:
- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` (see `./credentials.md`)
- `GSF_API_ENDPOINT`, `GSF_API_AUTH_BEARER_TOKEN` (see `./credentials.md`)

Note: Keep secrets in Vercel Project Settings → Environment Variables, not in the repo.

---

## Frontend – Pages, Components, Hooks

### Public Route: `src/app/sumudnusantara/page.tsx`
- SSR metadata
- Client component wrapper that renders:
  - `MapView`: React-Leaflet map, custom style (see `./credentials.md` map style URL). Active vessels shown as triangle markers oriented by `course`. Color coded by `origin`.
  - `TimelinePlayer`: scrubbable timeline with keyboard and touch support; decimated data stream for smooth playback.
  - `VesselDetailsPanel`: side modal/panel with vessel summary and last known data.
  - `IncidentModal`: modal opened from timeline markers or map markers.
  - `VesselList`: expandable drawer/list with search and status chips.
  - `LoginButton`: prominent button to access admin dashboard.

### Admin Routes (protected):
- `src/app/sumudnusantara/login/page.tsx`: Login form with email/password and optional OAuth.
- `src/app/sumudnusantara/dashboard/page.tsx`: Main admin dashboard with overview metrics.
- `src/app/sumudnusantara/dashboard/incidents/page.tsx`: Incident management interface.
- `src/app/sumudnusantara/dashboard/vessels/page.tsx`: Vessel metadata management.
- `src/app/sumudnusantara/dashboard/settings/page.tsx`: Admin configuration.

### Auth Context and Hooks:
- `AuthContext.tsx`: Sumud-specific auth provider (separate from Bencana).
- `useAuth.ts`: Hook for auth state, login/logout, role checking.
- Route protection middleware for admin pages.

### Components:
- Public components in `features/sumud/components/public/`
- Admin components in `features/sumud/components/admin/`
- Shared UI components can be in `features/sumud/components/shared/`

Hooks:
- `useActiveVessels(queryOpts)` – paginated or limited, filter by `status='active'`.
- `useVesselTrack(vesselId, timeRange)` – streams decimated positions for playback range.
- `useIncidents(range)` – loads incidents and aligns them to the timeline.
- `useAuth()` – authentication state and methods.

Playback performance:
- Precompute track polyline for the selected range client-side using web worker (`playback-decimator.ts`) or load from materialized view.
- Use requestAnimationFrame for smooth scrub; only re-render markers that changed since last frame.
- Use Leaflet `Canvas` renderer and cluster only if counts are high; otherwise simple marker pooling.

---

## Performance and Data Volume Strategy

- Database
  - Composite indexes on `(vessel_id, timestamp_utc)`.
  - Materialized view for decimated tracks (Douglas–Peucker or time-based thinning). Refresh on ingestion.
  - Narrow SELECTs; avoid `SELECT *` for tracks.

- API and Client
  - Pagination / time-windowed queries for positions.
  - Cache headers on read routes where safe (stale-while-revalidate 60s).
  - Lazy-load vessel photos.
  - Split the page into React chunks, only mount Timeline when visible.

---

## Implementation Plan & Milestones

M1 – Project scaffolding (Next.js page + feature folders)
- Create `src/app/sumudnusantara/page.tsx` and `features/sumud/*` skeletons.
- Add `vercel.json` cron config.

M2 – Supabase schema and RLS
- Create tables and indexes listed above; enable RLS and read-only policies.
- Set up Supabase Auth (separate from Bencana).
- Create `user_roles` table and RLS policies for admin access.
- Generate types via Supabase CLI for TypeScript consumption (optional).

M3 – Auth setup and public page
- Implement Sumud-specific `AuthContext` and `useAuth` hook.
- Create login page with email/password form.
- Add `LoginButton` to public page.
- Implement route protection for admin pages.

M4 – Ingestion route + normalization
- Implement `/api/sumud/fetch-gsf` route and upsert logic.
- Parse `positions` from GSF payload and insert into `vessel_positions`.
- Basic incident ingestion from webhooks.

M5 – Map and active vessels (public)
- Implement `MapView` with styled tiles and active vessel markers.
- Derive color by origin and triangle rotation by `course`.

M6 – Timeline playback (public)
- Implement `TimelinePlayer` + data decimation.
- Smooth scrub with touch and keyboard controls.

M7 – Details dialogs (public)
- `IncidentModal` and `VesselDetailsPanel` with responsive design.

M8 – Admin dashboard
- Basic admin dashboard with incident management.
- Vessel metadata editing interface.

M9 – Vessel list and status (public)
- Paginated list with quick filters and counts.

M10 – QA, performance pass, and deployment
- Validate ingestion idempotency.
- Verify all queries use indexes and time windows.
- Deploy to Vercel and verify cron execution.

---

## Security & Compliance
- Store secrets in Vercel env config.
- RLS ensures public read-only access.
- Validate and sanitize any external data rendered in UI.

---

## Testing
- Unit tests for normalizers and decimator.
- Contract tests against `sampleGSFData.json`.
- E2E tests for map markers and timeline playback (Playwright).

---

## Documentation Workflow
- Keep this `README.md` as the canonical architecture and plan.
- Update `./externalAPIs.md` and `./credentials.md` if endpoints/keys change.
- If payload shape changes, add a new sample next to `./sampleGSFData.json` and note versioning here.


