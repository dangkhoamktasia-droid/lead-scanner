export const dynamic = 'force-dynamic'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { ArrowRight, Clock, AlertCircle, Users, ThumbsUp, TrendingUp, DollarSign, Sun } from 'lucide-react'
import { DashboardFilters } from './DashboardFilters'
import { LeadTrendChart } from '@/components/LeadTrendChart'
import { Suspense } from 'react'

function getDateRange(range: string): Date | undefined {
  const now = new Date()
  if (range === 'today') {
    const start = new Date(now)
    start.setHours(0, 0, 0, 0)
    return start
  }
  if (range === '7d') return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
  if (range === '30d') return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
  return undefined
}

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
  const now = new Date()

  const [
    totalLeads,
    pendingLeads,
    approvedLeads,
    rejectedLeads,
    topGroups,
    recentLeads,
    allJobs,
    todayLeads,
    monthCostData,
    trendRaw,
  ] = await Promise.all([
    prisma.lead.count({ where: { status: { notIn: ['REJECTED', 'DUPLICATED'] }, ...where } }),
    prisma.lead.count({ where: { status: { in: ['AI_FILTERED', 'NEED_REVIEW'] }, ...where } }),
    prisma.lead.count({ where: { status: 'APPROVED', ...where } }),
    prisma.lead.count({ where: { status: 'REJECTED', ...where } }),
    prisma.rawPost.groupBy({
      by: ['groupId'],
      where: jobFilter.jobId ? { scanSession: { jobId: jobFilter.jobId } } : {},
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: 6,
    }).then(async (rows) => {
      const groupIds = rows.map((r) => r.groupId)
      const groups = await prisma.group.findMany({ where: { id: { in: groupIds } }, select: { id: true, name: true, url: true } })
      return rows.map((r) => {
        const g = groups.find((g) => g.id === r.groupId)
        return { groupId: r.groupId, name: g?.name ?? 'Unknown', url: g?.url ?? '', posts: r._count.id }
      })
    }),
    prisma.lead.findMany({
      where: { status: { in: ['AI_FILTERED', 'NEED_REVIEW'] }, ...jobFilter },
      orderBy: { createdAt: 'desc' },
      take: 5,
    }),
    prisma.job.findMany({ where: { enabled: true }, select: { id: true, name: true, color: true } }),
    prisma.lead.count({
      where: { createdAt: { gte: (() => { const d = new Date(); d.setHours(0, 0, 0, 0); return d })() }, ...jobFilter },
    }),
    prisma.scanSession.aggregate({
      where: {
        startedAt: { gte: new Date(now.getFullYear(), now.getMonth(), 1) },
        ...(jobId && jobId !== 'all' ? { jobId } : {}),
      },
      _sum: { apifyCostUsd: true, aiCostUsd: true },
    }),
    prisma.lead.findMany({
      where: {
        createdAt: { gte: new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000) },
        ...jobFilter,
      },
      select: { createdAt: true, status: true },
    }),
  ])

  const monthCostUsd = (monthCostData._sum.apifyCostUsd ?? 0) + (monthCostData._sum.aiCostUsd ?? 0)
  const conversionRate = (approvedLeads + rejectedLeads + pendingLeads) > 0
    ? Math.round((approvedLeads / (approvedLeads + rejectedLeads + pendingLeads)) * 100)
    : 0

  // Build 14-day trend data
  const trendDays: { date: string; leads: number; approved: number }[] = []
  for (let i = 13; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000)
    const dateStr = `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}`
    const dayLeads = trendRaw.filter((l) => {
      const ld = new Date(l.createdAt)
      return ld.getDate() === d.getDate() && ld.getMonth() === d.getMonth() && ld.getFullYear() === d.getFullYear()
    })
    trendDays.push({ date: dateStr, leads: dayLeads.length, approved: dayLeads.filter((l) => l.status === 'APPROVED').length })
  }

  const nextScanHours = [7, 19]
  const vietnamOffset = 7 * 60
  const vietnamMs = now.getTime() + (vietnamOffset - now.getTimezoneOffset()) * 60000
  const vietnamNow = new Date(vietnamMs)
  const currentHour = vietnamNow.getHours() + vietnamNow.getMinutes() / 60
  const nextHour = nextScanHours.find((h) => h > currentHour) ?? nextScanHours[0]
  const hoursUntilNext = nextHour > currentHour ? nextHour - currentHour : 24 - currentHour + nextScanHours[0]

  const stats = [
    { label: 'Tổng lead', value: totalLeads, icon: Users, color: 'from-indigo-500 to-purple-600', bg: 'bg-indigo-50', text: 'text-indigo-600', sub: undefined },
    { label: 'Chờ duyệt', value: pendingLeads, icon: AlertCircle, color: 'from-amber-400 to-orange-500', bg: 'bg-amber-50', text: 'text-amber-600', sub: 'Cần xem ngay' },
    { label: 'Hôm nay', value: todayLeads, icon: Sun, color: 'from-sky-400 to-blue-500', bg: 'bg-sky-50', text: 'text-sky-600', sub: undefined },
    { label: 'Đã approve', value: approvedLeads, icon: ThumbsUp, color: 'from-emerald-400 to-green-600', bg: 'bg-emerald-50', text: 'text-emerald-600', sub: undefined },
    { label: 'Tỷ lệ approve', value: `${conversionRate}%`, icon: TrendingUp, color: 'from-violet-400 to-purple-600', bg: 'bg-violet-50', text: 'text-violet-600', sub: 'trong kỳ này' },
    { label: 'Chi phí tháng', value: `$${monthCostUsd.toFixed(2)}`, icon: DollarSign, color: 'from-rose-400 to-pink-600', bg: 'bg-rose-50', text: 'text-rose-600', sub: `≈ ${Math.round(monthCostUsd * 25400).toLocaleString('vi-VN')}đ` },
  ]

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500 text-sm mt-0.5">Quản lý lead booking KOL/KOC</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Suspense fallback={null}>
            <DashboardFilters
              currentRange={range}
              jobs={allJobs}
              currentJobId={jobId ?? 'all'}
            />
          </Suspense>
          <div className="flex items-center gap-2 text-sm text-gray-500 bg-white border border-gray-200 rounded-xl px-3 py-2 shadow-sm">
            <Clock className="w-4 h-4 text-indigo-400" />
            <span>Scan lúc <strong>{nextHour}:00</strong> ({hoursUntilNext.toFixed(1)}h nữa)</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
        {stats.map((s) => (
          <div key={s.label} className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-gray-500">{s.label}</span>
              <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${s.color} flex items-center justify-center`}>
                <s.icon className="w-4 h-4 text-white" />
              </div>
            </div>
            <p className={`text-3xl font-bold ${s.text}`}>{s.value}</p>
            {s.sub && <p className={`text-xs mt-1 ${s.text} opacity-70`}>{s.sub}</p>}
          </div>
        ))}
      </div>

      {/* Trend chart */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="font-semibold text-gray-800">Xu hướng lead</h2>
            <p className="text-xs text-gray-400 mt-0.5">14 ngày gần nhất</p>
          </div>
          <div className="flex items-center gap-3 text-xs text-gray-400">
            <span>Tổng: <span className="font-semibold text-indigo-600">{trendDays.reduce((s, d) => s + d.leads, 0)}</span></span>
            <span>Approved: <span className="font-semibold text-emerald-600">{trendDays.reduce((s, d) => s + d.approved, 0)}</span></span>
          </div>
        </div>
        <LeadTrendChart data={trendDays} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-800">Lead mới chờ duyệt</h2>
            <Link href="/leads" className="text-sm text-indigo-600 hover:text-indigo-800 flex items-center gap-1 font-medium">
              Xem tất cả <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          {recentLeads.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-8">Không có lead mới</p>
          ) : (
            <div className="space-y-2">
              {recentLeads.map((lead) => (
                <Link key={lead.id} href="/leads" className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 hover:bg-indigo-50 transition-colors cursor-pointer">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                    {(lead.userName || '?')[0].toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{lead.userName || 'Ẩn danh'}</p>
                    <p className="text-xs text-gray-400 truncate">{lead.hinhThucCast || '—'} · {lead.sanPhamDichVu || '—'}</p>
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    {lead.sdtLienHe && (
                      <span className="text-xs px-1.5 py-0.5 bg-blue-50 text-blue-600 rounded font-mono">{lead.sdtLienHe}</span>
                    )}
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                      lead.confidence >= 0.8 ? 'bg-green-100 text-green-700' :
                      lead.confidence >= 0.5 ? 'bg-yellow-100 text-yellow-700' :
                      'bg-gray-100 text-gray-500'
                    }`}>{Math.round(lead.confidence * 100)}%</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-800">Nhóm hiệu quả nhất</h2>
            <span className="text-xs text-gray-400">theo số bài crawl</span>
          </div>
          {topGroups.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-8">Chưa có dữ liệu</p>
          ) : (
            <div className="space-y-2.5">
              {(() => {
                const maxPosts = Math.max(...topGroups.map((g) => g.posts), 1)
                return topGroups.map((g, i) => (
                  <div key={g.groupId} className="flex items-center gap-3">
                    <span className="text-xs font-bold text-gray-300 w-4 text-right flex-shrink-0">{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-xs font-medium text-gray-700 truncate max-w-[200px]">{g.name}</p>
                        <span className="text-xs font-bold text-indigo-600 flex-shrink-0 ml-2">{g.posts}</span>
                      </div>
                      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-indigo-400 to-purple-500"
                          style={{ width: `${(g.posts / maxPosts) * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))
              })()}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
