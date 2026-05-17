# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

---

## Commands

```bash
npm run dev          # Start dev server at localhost:3000
npm run build        # Production build
npm run start        # Start production server
npm run db:migrate   # Run Prisma migrations (creates/updates dev.db)
npm run db:seed      # Seed initial group data
npm run db:studio    # Open Prisma Studio (DB GUI)
npx prisma generate  # Regenerate Prisma client after schema changes (REQUIRED after schema change)
npx tsc --noEmit     # Type-check without building
```

**Windows shortcuts:**
- `start-app.bat` — double-click to start dev server
- `setup-autoscan.ps1` — run as Administrator → Windows Task Scheduler (auto-scan 7h + 19h daily)

**Trigger manual scan:**
```
GET http://localhost:3000/api/cron?secret=lead-scanner-cron-2024
```

---

## Architecture

### Data Flow

```
Windows Task Scheduler (7h + 19h daily)
  → GET /api/cron?secret=...
  → scan.service.ts: runScan()
  → apify.service.ts: crawlAllGroups()   ← 1 Apify batch run for ALL groups in a Job
  → dedup by postUrl against DB          ← skip already-seen posts (saves AI tokens)
  → aiLeadFilter.service.ts              ← per-post AI call (OpenAI or Anthropic)
  → duplicate.service.ts                 ← fingerprint check against approved leads
  → Prisma: create RawPost + Lead
  → update Group.lastScannedAt
  → wait 5s → fetch final Apify cost (usageTotalUsd) → save to ScanSession
```

### Lead Status Machine

```
(new post) → REJECTED | DUPLICATED | AI_FILTERED | NEED_REVIEW
                                          ↓
                              User approve/reject in /leads
                                          ↓
                                       APPROVED
```

- `AI_FILTERED`: confidence ≥ 0.85
- `NEED_REVIEW`: confidence 0.60–0.84
- `REJECTED`: confidence < 0.60 or `isLead=false`
- `DUPLICATED`: fingerprint (`hinhThucCast + sanPhamDichVu + userName`) already exists

### Job Category System

Top-level organizer: `Job` → `Group[]` → `Lead[]` / `ScanSession[]`

- Each Job has its own groups and scan sessions
- Leads inherit `jobId` at scan time (denormalized for fast filtering)
- Cron runs all enabled Jobs sequentially
- UI filters (Leads, Dashboard, Scan History) all support `jobId` filter

### Incremental Scanning

Each `Group` stores `lastScannedAt`. Apify receives `onlyPostsNewerThan` = earliest `lastScannedAt` across groups. First scan ever falls back to `scanDays` days (from `AppSetting`).

### Cost Tracking

Per `ScanSession`:
- `apifyRunId` — Apify run ID for reference
- `apifyCostUsd` — fetched from Apify API (`usageTotalUsd`) after 5s delay (billing finalization)
- `aiCostUsd` — estimated from token formula (OpenAI doesn't expose per-call cost via API)

### Settings Storage

All API keys and config in `AppSetting` table (key-value). Keys: `apifyToken`, `openaiKey`, `anthropicKey`, `aiProvider`, `scanDays`, `resultLimit`, `messageTemplate`.

`CRON_SECRET` env var (default: `lead-scanner-cron-2024`) protects `/api/cron`.

---

## Database Schema (Prisma — SQLite)

```
Job          id, name, description, color, enabled
  └─ Group   id, name, url, enabled, jobId, lastScannedAt
  └─ ScanSession  id, jobId, status, totalPosts, totalLeads, totalDuplicated,
                  totalRejected, apifyRunId, apifyCostUsd, aiCostUsd, startedAt, endedAt
       └─ RawPost     id, scanSessionId, groupId, postText, postUrl, userName
       └─ Lead        id, scanSessionId, jobId, rawPostId, userName, userProfileUrl,
                      postUrl, postText, hinhThucCast, sanPhamDichVu, soLuongCanBook,
                      sdtLienHe, message, confidence, reason, rejectReason,
                      fingerprint, status
  └─ Lead    (also directly under Job via jobId)

ScanGroupResult  id, scanSessionId, groupId, status, postsFound, leadsFound
AppSetting       key, value
SyncLog          id, leadId, status (legacy, Google Sheets removed)
```

Migration history: `prisma/migrations/`
- `20260517012639_add_job_model` — Job model + jobId FK on Group/Lead/ScanSession
- `20260517025107_add_cost_fields` — apifyRunId, apifyCostUsd, aiCostUsd on ScanSession

---

## Key Files

```
src/
├── app/
│   ├── api/
│   │   ├── cron/route.ts          # Scheduled scan trigger (GET + secret)
│   │   ├── leads/route.ts         # GET leads (filters: status, sessionId, jobId)
│   │   ├── leads/[id]/route.ts    # PATCH lead (status, message)
│   │   ├── jobs/route.ts          # GET/POST jobs
│   │   └── jobs/[id]/route.ts     # PATCH/DELETE job
│   ├── dashboard/
│   │   ├── page.tsx               # Server component, 6 stat cards + panels
│   │   └── DashboardFilters.tsx   # Client: range + job filters
│   ├── leads/
│   │   ├── page.tsx               # Server component
│   │   └── LeadsClient.tsx        # Client: filter + table
│   ├── jobs/
│   │   ├── page.tsx               # Server component
│   │   └── JobsClient.tsx         # Client: CRUD for Job categories
│   ├── scan-history/
│   │   ├── page.tsx               # Server component
│   │   └── ScanHistoryClient.tsx  # Client: table + filters + cost tooltip
│   └── settings/
│       └── SettingsClient.tsx     # Client: API keys config (no Google Sheets)
├── server/
│   ├── scan.service.ts            # runScan() orchestrator
│   ├── apify.service.ts           # crawlAllGroups(), returns {posts, runId, costUsd}
│   ├── aiLeadFilter.service.ts    # filterLeadWithAI() — OpenAI or Anthropic
│   └── duplicate.service.ts       # fingerprint dedup
├── prompts/
│   └── leadFilterPrompt.ts        # buildLeadFilterPrompt(postText, postUrl)
├── components/
│   ├── Sidebar.tsx                # Nav: Dashboard, Jobs, Leads, Scan History, Settings
│   ├── LeadPreviewTable.tsx       # Lead table with approve/reject actions
│   └── LeadRow.tsx                # Single lead row (product col: break-words)
└── lib/
    ├── prisma.ts                  # Prisma client singleton
    ├── validators.ts              # AiLeadResultSchema (Zod)
    └── logger.ts                  # Structured logger
```

---

## Key Design Decisions

- **No manual scan UI** — scanning is fully automated via cron.
- **Single Apify batch run per Job** — all groups in one run, matched back by URL regex.
- **Post-URL dedup before AI** — batch check `RawPost` before any AI call.
- **Apify cost finalization delay** — wait 5s after SUCCEEDED before reading `usageTotalUsd` (billing not immediate).
- **AI cost is estimated** — OpenAI doesn't expose per-call cost; formula: `posts × 600 tokens × avg_price`.
- **SQLite local** — zero config, DB at `prisma/dev.db`. Must kill dev server before running migrations.
- **Google Sheets sync removed** — leads managed entirely in web app.
- **Job rules deferred** — each Job will have its own AI rules in future; currently all jobs share same prompt.

---

## AI Filter Rules (`src/prompts/leadFilterPrompt.ts`)

Function: `buildLeadFilterPrompt(postText, postUrl)` — postUrl is embedded in prompt for message generation.

**KEEP:** brands/shops paying to hire KOL/KOC/TikToker with cash fee.

**REJECT:**
1. Freecast / product-only exchange (no cash)
2. Agencies/competitors recruiting TikTokers into their pool
3. In-house staff hiring (nhân viên TikTok, quản lý kênh, CTV hoa hồng)
4. KOL/KOC self-promotion / looking for work
5. Seeding/spam/unrelated

**Special — venue review** (nhà hàng, spa, cafe, khách sạn):
- Keep ONLY IF: location in HN/HCM/Đà Nẵng AND cash cast fee > 1,000,000 VNĐ explicitly stated

**Message tone:** Freelancer style, NOT agency. Never mention "agency" (khách sợ giá cao).
- If post has SĐT/Zalo: ask about needs directly + append postUrl
- If no contact: ask for Zalo + append postUrl

---

## UI Style

- Background: `#F0F2FF` + fixed gradient orbs (`.orb`, `.orb-purple`, `.orb-pink` in `globals.css`)
- Cards: `.glass-card` (white/80 + backdrop-blur + white border)
- Active sidebar: `bg-gradient-to-r from-indigo-500 to-purple-600`
- Toast: `sonner` (top-right, richColors)
- Scan History cost tooltip: `position: fixed` (avoids `overflow-hidden` clipping)

## Prisma Notes

After schema change: always `npm run db:migrate` → `npx prisma generate` → restart dev server.
Kill dev server BEFORE running migrations (SQLite locks).
