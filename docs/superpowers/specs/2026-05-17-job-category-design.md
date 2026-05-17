# Job Category — Design Spec

**Goal:** Add a `Job` concept so multiple lead-scanning projects (e.g. "Booking TikToker", "AI Automation", "Job Remote") can coexist in one app, each with their own Facebook groups.

**Architecture:** New `Job` DB model. `Group` and `Lead` belong to a Job. UI gets a job switcher. Scan runs per-job. Rule engine deferred.

**Tech Stack:** Prisma (SQLite), Next.js App Router, TypeScript

---

## Database

### New model: `Job`

```prisma
model Job {
  id          String   @id @default(cuid())
  name        String
  description String?
  color       String   @default("#6366F1")  // hex color for badge
  enabled     Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  groups      Group[]
  leads       Lead[]
  scanSessions ScanSession[]
}
```

### Modified: `Group`
Add `jobId String` (required after migration, default job assigned during migration).

### Modified: `Lead`
Add `jobId String` (denormalized copy from group at scan time — avoids join for filtering).

### Modified: `ScanSession`
Add `jobId String` (which job triggered this session).

### Migration strategy
1. Create migration that adds all new columns as nullable.
2. Seed script inserts default Job "Booking TikToker" (color: `#6366F1`).
3. Update all existing `Group`, `Lead`, `ScanSession` rows to point to this default job.
4. Make columns non-nullable.

---

## API Routes

### New: `/api/jobs`
- `GET` — list all jobs
- `POST` — create job `{ name, description, color }`

### New: `/api/jobs/[id]`
- `PATCH` — update `{ name, description, color, enabled }`
- `DELETE` — only if job has no groups

### Modified: `/api/cron`
- Scan all enabled jobs sequentially, one Apify batch run per job (each job's groups).
- Each `ScanSession` tagged with `jobId`.

### Modified: `/api/leads`
- Accept optional `jobId` query param for filtering.

### Modified: `/api/scan`
- Accept `jobId` in POST body.

---

## Pages

### New: `/jobs`
Job management page (server component + client interactions):
- Card grid of jobs, each showing: name, color badge, group count, lead count, enabled toggle.
- "New Job" button → inline form (name, description, color picker with 6 preset colors).
- Edit/delete per job.

### Modified: `/dashboard`
- Job switcher dropdown at top (defaults to first enabled job or "All Jobs").
- Stats filtered by selected jobId (passed as `?jobId=` searchParam).

### Modified: `/leads`
- Job filter added to filter bar alongside session and status filters.

### Modified: `/settings` (Groups section — future)
- When adding a group, user selects which job it belongs to.
- For now, existing group management stays as-is; job assignment done via `/jobs` page.

---

## Sidebar

Add "Jobs" nav item between "Dashboard" and "Leads":
```
Dashboard
Jobs          ← new
Leads
Lịch sử Scan
Cài đặt
```

---

## Scan Logic Changes (`scan.service.ts`)

`runScan()` receives `jobId`. It fetches only groups where `group.jobId === jobId`. Sets `lead.jobId = jobId` on every created lead. Sets `scanSession.jobId = jobId`.

`/api/cron` iterates over all enabled jobs, calls `runScan()` per job sequentially.

---

## Out of Scope (deferred)

- Per-job AI prompt override (rule engine) — added later when user defines rules per job.
- Per-job Apify actor config.
- Cross-job analytics.
- Role-based access per job.
