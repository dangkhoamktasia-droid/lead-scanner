# Job Category Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a `Job` model so multiple lead-scanning projects can coexist, each with their own Facebook groups, filtered views, and independent scan sessions.

**Architecture:** New `Job` Prisma model. `Group`, `Lead`, `ScanSession` each get a `jobId` FK. Cron scans all enabled jobs sequentially. Dashboard + Leads UI get a job switcher via `?jobId=` searchParam.

**Tech Stack:** Prisma 7 (SQLite), Next.js 15 App Router, TypeScript, Tailwind CSS

---

## Task 1: Add Job model to Prisma schema + migrate

**Files:**
- Modify: `prisma/schema.prisma`

- [ ] **Step 1: Update schema — add Job model and relations**

Replace/extend `prisma/schema.prisma` with these additions (keep all existing models unchanged):

```prisma
model Job {
  id          String   @id @default(cuid())
  name        String
  description String?
  color       String   @default("#6366F1")
  enabled     Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  groups       Group[]
  leads        Lead[]
  scanSessions ScanSession[]
}
```

Add `jobId` field to `Group` model (after `priority` field):
```prisma
jobId  String?
job    Job?    @relation(fields: [jobId], references: [id])
```

Add `jobId` field to `Lead` model (after `scanSessionId` field):
```prisma
jobId  String?
job    Job?    @relation(fields: [jobId], references: [id])
```

Add `jobId` field to `ScanSession` model (after `status` field):
```prisma
jobId  String?
job    Job?    @relation(fields: [jobId], references: [id])
```

- [ ] **Step 2: Run migration**

```bash
npm run db:migrate
```

When prompted for migration name, enter: `add_job_model`

Expected: Migration created in `prisma/migrations/`, `dev.db` updated.

- [ ] **Step 3: Regenerate Prisma client**

```bash
npx prisma generate
```

Expected: No TypeScript errors. `prisma.job` is now available.

---

## Task 2: Seed default Job + assign existing data

**Files:**
- Modify: `prisma/seed.ts`

- [ ] **Step 1: Check if seed.ts exists**

```bash
ls prisma/seed.ts
```

If it doesn't exist, create it. If it does, open it and ADD to the existing seed logic (don't replace).

- [ ] **Step 2: Write seed logic**

Full content of `prisma/seed.ts`:

```typescript
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // Create default job if not exists
  const existingJob = await prisma.job.findFirst({ where: { name: 'Booking TikToker' } })

  const job = existingJob ?? await prisma.job.create({
    data: {
      name: 'Booking TikToker',
      description: 'Tìm lead booking KOL/KOC/TikToker từ Facebook Groups',
      color: '#6366F1',
      enabled: true,
    },
  })

  console.log(`Job: ${job.name} (${job.id})`)

  // Assign all groups without a jobId to this default job
  const updatedGroups = await prisma.group.updateMany({
    where: { jobId: null },
    data: { jobId: job.id },
  })
  console.log(`Updated ${updatedGroups.count} groups → jobId`)

  // Assign all leads without a jobId
  const updatedLeads = await prisma.lead.updateMany({
    where: { jobId: null },
    data: { jobId: job.id },
  })
  console.log(`Updated ${updatedLeads.count} leads → jobId`)

  // Assign all scan sessions without a jobId
  const updatedSessions = await prisma.scanSession.updateMany({
    where: { jobId: null },
    data: { jobId: job.id },
  })
  console.log(`Updated ${updatedSessions.count} scan sessions → jobId`)
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
```

- [ ] **Step 3: Run seed**

```bash
npm run db:seed
```

Expected output:
```
Job: Booking TikToker (cm...)
Updated N groups → jobId
Updated N leads → jobId
Updated N scan sessions → jobId
```

- [ ] **Step 4: Verify in Prisma Studio**

```bash
npm run db:studio
```

Open browser → check `Job` table has 1 row, `Group` rows all have `jobId` set.

---

## Task 3: Job API routes (CRUD)

**Files:**
- Create: `src/app/api/jobs/route.ts`
- Create: `src/app/api/jobs/[id]/route.ts`

- [ ] **Step 1: Create `src/app/api/jobs/route.ts`**

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const jobs = await prisma.job.findMany({
    orderBy: { createdAt: 'asc' },
    include: {
      _count: { select: { groups: true, leads: true } },
    },
  })
  return NextResponse.json(jobs)
}

export async function POST(req: NextRequest) {
  const body = await req.json() as { name: string; description?: string; color?: string }
  if (!body.name?.trim()) {
    return NextResponse.json({ error: 'name is required' }, { status: 400 })
  }
  const job = await prisma.job.create({
    data: {
      name: body.name.trim(),
      description: body.description?.trim() ?? null,
      color: body.color ?? '#6366F1',
    },
  })
  return NextResponse.json(job, { status: 201 })
}
```

- [ ] **Step 2: Create `src/app/api/jobs/[id]/route.ts`**

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const body = await req.json() as { name?: string; description?: string; color?: string; enabled?: boolean }
  const job = await prisma.job.update({
    where: { id },
    data: {
      ...(body.name !== undefined && { name: body.name.trim() }),
      ...(body.description !== undefined && { description: body.description.trim() || null }),
      ...(body.color !== undefined && { color: body.color }),
      ...(body.enabled !== undefined && { enabled: body.enabled }),
    },
  })
  return NextResponse.json(job)
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const groupCount = await prisma.group.count({ where: { jobId: id } })
  if (groupCount > 0) {
    return NextResponse.json({ error: 'Job has groups — reassign them first' }, { status: 400 })
  }
  await prisma.job.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
```

- [ ] **Step 3: Type-check**

```bash
npx tsc --noEmit
```

Expected: No errors.

---

## Task 4: Update scan service to accept jobId

**Files:**
- Modify: `src/server/scan.service.ts`
- Modify: `src/app/api/cron/route.ts`

- [ ] **Step 1: Update `runScan` signature in `src/server/scan.service.ts`**

Change the `params` type on line 21 from:
```typescript
export async function runScan(params: {
  groupIds: string[]
  scanDays: number
  resultLimit: number
  onProgress?: (progress: ScanGroupProgress) => void
}): Promise<string> {
```

To:
```typescript
export async function runScan(params: {
  groupIds: string[]
  scanDays: number
  resultLimit: number
  jobId?: string
  onProgress?: (progress: ScanGroupProgress) => void
}): Promise<string> {
```

- [ ] **Step 2: Pass jobId to ScanSession creation in `scan.service.ts`**

Find the `prisma.scanSession.create` call (around line 45) and add `jobId`:
```typescript
  const session = await prisma.scanSession.create({
    data: {
      scanDays,
      resultLimit,
      totalGroups: groups.length,
      status: 'RUNNING',
      jobId: params.jobId ?? null,
    },
  })
```

- [ ] **Step 3: Pass jobId to Lead creation in `scan.service.ts`**

Find `prisma.lead.create` (around line 144) and add `jobId`:
```typescript
      await prisma.lead.create({
        data: {
          scanSessionId: session.id,
          rawPostId: rawPost.id,
          jobId: params.jobId ?? null,
          // ... rest of fields unchanged
```

- [ ] **Step 4: Update `/api/cron/route.ts` to scan per job**

Replace the entire file content:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { runScan } from '@/server/scan.service'
import { logger } from '@/lib/logger'

export async function GET(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get('secret')
  const expectedSecret = process.env.CRON_SECRET || 'lead-scanner-cron-2024'

  if (secret !== expectedSecret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    logger.info('Cron job triggered')

    const settings = Object.fromEntries(
      (await prisma.appSetting.findMany()).map((r) => [r.key, r.value])
    )
    const scanDays = parseInt(settings.defaultScanDays || '2')
    const resultLimit = parseInt(settings.defaultResultLimit || '30')

    // Get all enabled jobs
    const jobs = await prisma.job.findMany({
      where: { enabled: true },
      include: {
        groups: { where: { enabled: true }, select: { id: true } },
      },
    })

    if (jobs.length === 0) {
      return NextResponse.json({ message: 'No enabled jobs' })
    }

    const results: { jobId: string; jobName: string; sessionId?: string; error?: string }[] = []

    for (const job of jobs) {
      if (job.groups.length === 0) {
        results.push({ jobId: job.id, jobName: job.name, error: 'No enabled groups' })
        continue
      }
      try {
        const sessionId = await runScan({
          groupIds: job.groups.map((g) => g.id),
          scanDays,
          resultLimit,
          jobId: job.id,
        })
        results.push({ jobId: job.id, jobName: job.name, sessionId })
      } catch (err) {
        results.push({ jobId: job.id, jobName: job.name, error: String(err) })
      }
    }

    logger.info('Cron scan complete', results)
    return NextResponse.json({ results })
  } catch (err) {
    logger.error('Cron scan failed', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
```

- [ ] **Step 5: Type-check**

```bash
npx tsc --noEmit
```

Expected: No errors.

---

## Task 5: Update leads API to filter by jobId

**Files:**
- Modify: `src/app/api/leads/route.ts`

- [ ] **Step 1: Replace full file content**

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const sessionId = req.nextUrl.searchParams.get('sessionId')
  const statusParam = req.nextUrl.searchParams.get('status')
  const jobId = req.nextUrl.searchParams.get('jobId')
  const statuses = statusParam ? statusParam.split(',') : undefined

  const where: Record<string, unknown> = {}
  if (sessionId) where.scanSessionId = sessionId
  if (statuses) where.status = { in: statuses }
  if (jobId) where.jobId = jobId

  const leads = await prisma.lead.findMany({
    where,
    orderBy: [{ confidence: 'desc' }, { createdAt: 'desc' }],
    take: 500,
  })

  return NextResponse.json(leads)
}
```

---

## Task 6: Jobs management page

**Files:**
- Create: `src/app/jobs/page.tsx`
- Create: `src/app/jobs/JobsClient.tsx`

- [ ] **Step 1: Create `src/app/jobs/page.tsx`**

```typescript
import { prisma } from '@/lib/prisma'
import { JobsClient } from './JobsClient'

export default async function JobsPage() {
  const jobs = await prisma.job.findMany({
    orderBy: { createdAt: 'asc' },
    include: {
      _count: { select: { groups: true, leads: true } },
    },
  })

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Quản lý Jobs</h1>
        <p className="text-gray-500 text-sm mt-0.5">Mỗi job là một dự án tìm lead riêng biệt</p>
      </div>
      <JobsClient initialJobs={jobs.map((j) => ({ ...j, createdAt: j.createdAt.toISOString(), updatedAt: j.updatedAt.toISOString() }))} />
    </div>
  )
}
```

- [ ] **Step 2: Create `src/app/jobs/JobsClient.tsx`**

```typescript
'use client'
import { useState } from 'react'
import { toast } from 'sonner'
import { Plus, Pencil, Trash2, ToggleLeft, ToggleRight } from 'lucide-react'

interface Job {
  id: string
  name: string
  description: string | null
  color: string
  enabled: boolean
  createdAt: string
  updatedAt: string
  _count: { groups: number; leads: number }
}

const PRESET_COLORS = ['#6366F1', '#8B5CF6', '#EC4899', '#10B981', '#F59E0B', '#EF4444']

export function JobsClient({ initialJobs }: { initialJobs: Job[] }) {
  const [jobs, setJobs] = useState<Job[]>(initialJobs)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState({ name: '', description: '', color: '#6366F1' })
  const [saving, setSaving] = useState(false)

  const resetForm = () => {
    setForm({ name: '', description: '', color: '#6366F1' })
    setShowForm(false)
    setEditingId(null)
  }

  const handleSave = async () => {
    if (!form.name.trim()) { toast.error('Tên job không được trống'); return }
    setSaving(true)
    try {
      if (editingId) {
        const res = await fetch(`/api/jobs/${editingId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form),
        })
        const updated = await res.json()
        setJobs((prev) => prev.map((j) => j.id === editingId ? { ...j, ...updated } : j))
        toast.success('Đã cập nhật job')
      } else {
        const res = await fetch('/api/jobs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form),
        })
        const created = await res.json()
        setJobs((prev) => [...prev, { ...created, _count: { groups: 0, leads: 0 } }])
        toast.success('Đã tạo job mới')
      }
      resetForm()
    } catch (err) {
      toast.error(String(err))
    } finally {
      setSaving(false)
    }
  }

  const handleToggle = async (job: Job) => {
    const res = await fetch(`/api/jobs/${job.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ enabled: !job.enabled }),
    })
    const updated = await res.json()
    setJobs((prev) => prev.map((j) => j.id === job.id ? { ...j, ...updated } : j))
  }

  const handleDelete = async (job: Job) => {
    if (job._count.groups > 0) {
      toast.error(`Job có ${job._count.groups} groups — hãy chuyển groups sang job khác trước`)
      return
    }
    if (!confirm(`Xóa job "${job.name}"?`)) return
    const res = await fetch(`/api/jobs/${job.id}`, { method: 'DELETE' })
    if (res.ok) {
      setJobs((prev) => prev.filter((j) => j.id !== job.id))
      toast.success('Đã xóa job')
    } else {
      const data = await res.json()
      toast.error(data.error)
    }
  }

  const startEdit = (job: Job) => {
    setForm({ name: job.name, description: job.description ?? '', color: job.color })
    setEditingId(job.id)
    setShowForm(true)
  }

  return (
    <div className="space-y-4">
      {/* Job cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {jobs.map((job) => (
          <div key={job.id} className="glass-card rounded-2xl p-5 shadow-sm">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex-shrink-0" style={{ backgroundColor: job.color }} />
                <div>
                  <p className="font-semibold text-gray-900">{job.name}</p>
                  {job.description && <p className="text-xs text-gray-500 mt-0.5">{job.description}</p>}
                </div>
              </div>
              <div className="flex gap-1">
                <button onClick={() => handleToggle(job)} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
                  {job.enabled
                    ? <ToggleRight className="w-5 h-5 text-indigo-500" />
                    : <ToggleLeft className="w-5 h-5 text-gray-400" />}
                </button>
                <button onClick={() => startEdit(job)} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
                  <Pencil className="w-4 h-4 text-gray-500" />
                </button>
                <button onClick={() => handleDelete(job)} className="p-1.5 rounded-lg hover:bg-red-50 transition-colors">
                  <Trash2 className="w-4 h-4 text-red-400" />
                </button>
              </div>
            </div>
            <div className="flex gap-4 text-xs text-gray-500">
              <span>{job._count.groups} groups</span>
              <span>{job._count.leads} leads</span>
              <span className={`font-medium ${job.enabled ? 'text-emerald-600' : 'text-gray-400'}`}>
                {job.enabled ? 'Đang hoạt động' : 'Tắt'}
              </span>
            </div>
          </div>
        ))}

        {/* New job button */}
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="glass-card rounded-2xl p-5 border-2 border-dashed border-indigo-200 hover:border-indigo-400 flex items-center justify-center gap-2 text-indigo-500 hover:text-indigo-700 transition-colors shadow-sm"
          >
            <Plus className="w-5 h-5" />
            <span className="font-medium">Thêm Job mới</span>
          </button>
        )}
      </div>

      {/* Form */}
      {showForm && (
        <div className="glass-card rounded-2xl p-6 shadow-sm space-y-4">
          <h3 className="font-semibold text-gray-800">{editingId ? 'Chỉnh sửa Job' : 'Tạo Job mới'}</h3>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tên Job *</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="VD: Booking TikToker, AI Automation..."
              className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Mô tả</label>
            <input
              type="text"
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              placeholder="Mô tả ngắn về job này..."
              className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Màu nhận diện</label>
            <div className="flex gap-2">
              {PRESET_COLORS.map((c) => (
                <button
                  key={c}
                  onClick={() => setForm((f) => ({ ...f, color: c }))}
                  className={`w-8 h-8 rounded-lg transition-transform ${form.color === c ? 'scale-125 ring-2 ring-offset-2 ring-gray-400' : 'hover:scale-110'}`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleSave}
              disabled={saving}
              className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-sm font-medium px-5 py-2 rounded-xl shadow-md disabled:opacity-50"
            >
              {saving ? 'Đang lưu...' : editingId ? 'Lưu' : 'Tạo Job'}
            </button>
            <button onClick={resetForm} className="text-sm text-gray-500 hover:text-gray-700 px-4 py-2 rounded-xl hover:bg-gray-100">
              Hủy
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
```

---

## Task 7: Add Jobs to Sidebar + update nav

**Files:**
- Modify: `src/components/Sidebar.tsx`

- [ ] **Step 1: Add Briefcase icon import and Jobs nav item**

Find the import line and add `Briefcase`:
```typescript
import { LayoutDashboard, Users, History, Settings, Zap, Briefcase } from 'lucide-react'
```

Find `navItems` array and add Jobs between Dashboard and Leads:
```typescript
const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/jobs', label: 'Jobs', icon: Briefcase },
  { href: '/leads', label: 'Leads', icon: Users },
  { href: '/scan-history', label: 'Lịch sử Scan', icon: History },
  { href: '/settings', label: 'Cài đặt', icon: Settings },
]
```

---

## Task 8: Job switcher on Dashboard

**Files:**
- Modify: `src/app/dashboard/page.tsx`
- Modify: `src/app/dashboard/DashboardFilters.tsx`

- [ ] **Step 1: Update `DashboardFilters.tsx` to accept + show job switcher**

Replace full file:

```typescript
'use client'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'

const RANGES = [
  { value: 'today', label: 'Hôm nay' },
  { value: '7d', label: '7 ngày' },
  { value: '30d', label: '30 ngày' },
  { value: 'all', label: 'Tất cả' },
]

interface Job { id: string; name: string; color: string }

export function DashboardFilters({
  currentRange,
  jobs,
  currentJobId,
}: {
  currentRange: string
  jobs: Job[]
  currentJobId: string
}) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const navigate = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set(key, value)
    router.push(`${pathname}?${params.toString()}`)
  }

  return (
    <div className="flex items-center gap-3">
      {/* Job switcher */}
      {jobs.length > 1 && (
        <select
          value={currentJobId}
          onChange={(e) => navigate('jobId', e.target.value)}
          className="rounded-xl border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
        >
          <option value="all">Tất cả Jobs</option>
          {jobs.map((j) => (
            <option key={j.id} value={j.id}>{j.name}</option>
          ))}
        </select>
      )}

      {/* Date range */}
      <div className="flex items-center gap-1 bg-gray-100 rounded-xl p-1">
        {RANGES.map((r) => (
          <button
            key={r.value}
            onClick={() => navigate('range', r.value)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
              currentRange === r.value
                ? 'bg-white text-indigo-600 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {r.label}
          </button>
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Update `src/app/dashboard/page.tsx` to read jobId searchParam and filter**

Replace the `searchParams` destructure and add job filtering. Find the top of the component and update:

```typescript
export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string; jobId?: string }>
}) {
  const { range = 'all', jobId } = await searchParams
  const since = getDateRange(range)
  const dateFilter = since ? { createdAt: { gte: since } } : {}
  const jobFilter = jobId && jobId !== 'all' ? { jobId } : {}
  const where = { ...dateFilter, ...jobFilter }
```

Then update all `prisma.lead.count` calls to use `where` spread instead of `dateFilter`:
```typescript
  const [
    totalLeads,
    pendingLeads,
    approvedLeads,
    rejectedLeads,
    lastSession,
    recentLeads,
    allJobs,
  ] = await Promise.all([
    prisma.lead.count({ where: { status: { notIn: ['REJECTED', 'DUPLICATED'] }, ...where } }),
    prisma.lead.count({ where: { status: { in: ['AI_FILTERED', 'NEED_REVIEW'] }, ...where } }),
    prisma.lead.count({ where: { status: 'APPROVED', ...where } }),
    prisma.lead.count({ where: { status: 'REJECTED', ...where } }),
    prisma.scanSession.findFirst({
      orderBy: { startedAt: 'desc' },
      where: jobId && jobId !== 'all' ? { jobId } : {},
    }),
    prisma.lead.findMany({
      where: { status: { in: ['AI_FILTERED', 'NEED_REVIEW'] }, ...jobFilter },
      orderBy: { createdAt: 'desc' },
      take: 5,
    }),
    prisma.job.findMany({ where: { enabled: true }, select: { id: true, name: true, color: true } }),
  ])
```

Update the `DashboardFilters` component call in the JSX to pass jobs:
```typescript
          <DashboardFilters
            currentRange={range}
            jobs={allJobs}
            currentJobId={jobId ?? 'all'}
          />
```

Wrap `DashboardFilters` in `<Suspense>` since it uses `useSearchParams`:
```typescript
import { Suspense } from 'react'
// ...
          <Suspense fallback={null}>
            <DashboardFilters
              currentRange={range}
              jobs={allJobs}
              currentJobId={jobId ?? 'all'}
            />
          </Suspense>
```

---

## Task 9: Job filter on Leads page

**Files:**
- Modify: `src/app/leads/LeadsClient.tsx`
- Modify: `src/app/leads/page.tsx`

- [ ] **Step 1: Update `src/app/leads/page.tsx` to pass jobs**

```typescript
import { prisma } from '@/lib/prisma'
import { LeadsClient } from './LeadsClient'

export default async function LeadsPage() {
  const [rawSessions, jobs] = await Promise.all([
    prisma.scanSession.findMany({
      orderBy: { startedAt: 'desc' },
      take: 20,
      select: { id: true, startedAt: true, totalLeads: true, status: true, jobId: true },
    }),
    prisma.job.findMany({
      where: { enabled: true },
      select: { id: true, name: true, color: true },
      orderBy: { createdAt: 'asc' },
    }),
  ])
  const sessions = rawSessions.map((s) => ({ ...s, startedAt: s.startedAt.toISOString() }))

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Quản lý Leads</h1>
        <p className="text-gray-500 text-sm mt-1">Duyệt và quản lý lead booking KOL/KOC</p>
      </div>
      <LeadsClient sessions={sessions} jobs={jobs} />
    </div>
  )
}
```

- [ ] **Step 2: Update `src/app/leads/LeadsClient.tsx` to add job filter**

Add `jobs` prop and job filter dropdown. Replace full file:

```typescript
'use client'
import { useState, useEffect, useCallback } from 'react'
import { LeadPreviewTable } from '@/components/LeadPreviewTable'
import { toast } from 'sonner'

interface Session { id: string; startedAt: string; totalLeads: number; status: string; jobId: string | null }
interface Job { id: string; name: string; color: string }
interface Lead {
  id: string; userName: string | null; userProfileUrl: string | null; postUrl: string | null
  postText: string; hinhThucCast: string | null; sanPhamDichVu: string | null
  soLuongCanBook: string | null; sdtLienHe: string | null; message: string | null
  confidence: number; reason: string | null; rejectReason: string | null; status: string
}

export function LeadsClient({ sessions, jobs }: { sessions: Session[]; jobs: Job[] }) {
  const [selectedSession, setSelectedSession] = useState<string>(sessions[0]?.id ?? '')
  const [statusFilter, setStatusFilter] = useState<string>('AI_FILTERED,NEED_REVIEW')
  const [jobFilter, setJobFilter] = useState<string>('all')
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedLeadIds, setSelectedLeadIds] = useState<string[]>([])

  const loadLeads = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams({ status: statusFilter })
    if (selectedSession) params.set('sessionId', selectedSession)
    if (jobFilter !== 'all') params.set('jobId', jobFilter)
    const res = await fetch(`/api/leads?${params}`)
    const data = await res.json()
    setLeads(Array.isArray(data) ? data : [])
    setSelectedLeadIds([])
    setLoading(false)
  }, [selectedSession, statusFilter, jobFilter])

  useEffect(() => { loadLeads() }, [loadLeads])

  const updateLead = async (id: string, patch: { status?: string; message?: string }) => {
    const res = await fetch(`/api/leads/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patch),
    })
    if (res.ok) {
      const updated = await res.json()
      setLeads((prev) => prev.map((l) => l.id === id ? { ...l, ...updated } : l))
    } else {
      toast.error('Cập nhật lead thất bại')
    }
  }

  return (
    <div className="space-y-4">
      <div className="glass-card rounded-2xl p-4 flex flex-wrap gap-4 items-end shadow-sm">
        {jobs.length > 1 && (
          <div>
            <label className="text-xs font-medium text-gray-600 block mb-1">Job</label>
            <select
              value={jobFilter}
              onChange={(e) => { setJobFilter(e.target.value); setSelectedSession('') }}
              className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">Tất cả Jobs</option>
              {jobs.map((j) => (
                <option key={j.id} value={j.id}>{j.name}</option>
              ))}
            </select>
          </div>
        )}
        <div>
          <label className="text-xs font-medium text-gray-600 block mb-1">Phiên scan</label>
          <select
            value={selectedSession}
            onChange={(e) => setSelectedSession(e.target.value)}
            className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">Tất cả phiên</option>
            {sessions
              .filter((s) => jobFilter === 'all' || s.jobId === jobFilter)
              .map((s) => (
                <option key={s.id} value={s.id}>
                  {new Date(s.startedAt).toLocaleString('vi-VN')} ({s.totalLeads} leads)
                </option>
              ))}
          </select>
        </div>
        <div>
          <label className="text-xs font-medium text-gray-600 block mb-1">Trạng thái</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="AI_FILTERED,NEED_REVIEW">Chờ duyệt</option>
            <option value="APPROVED">Đã approve</option>
            <option value="REJECTED">Đã reject</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-400">Đang tải lead...</div>
      ) : leads.length === 0 ? (
        <div className="text-center py-12 text-gray-400">Không có lead nào</div>
      ) : (
        <LeadPreviewTable
          leads={leads}
          selectedIds={selectedLeadIds}
          onSelectChange={setSelectedLeadIds}
          onApprove={(id) => updateLead(id, { status: 'APPROVED' })}
          onReject={(id) => updateLead(id, { status: 'REJECTED' })}
          onMessageEdit={(id, msg) => updateLead(id, { message: msg })}
        />
      )}
    </div>
  )
}
```

---

## Task 10: Final type-check + verify

- [ ] **Step 1: Run TypeScript check**

```bash
npx tsc --noEmit
```

Expected: 0 errors.

- [ ] **Step 2: Start dev server and verify manually**

```bash
npm run dev
```

Check in browser:
1. `localhost:3000/jobs` — shows "Booking TikToker" card, can create new job
2. `localhost:3000/dashboard` — job dropdown appears when 2+ jobs exist
3. `localhost:3000/leads` — job filter appears in filter bar
4. Sidebar shows "Jobs" nav item between Dashboard and Leads
