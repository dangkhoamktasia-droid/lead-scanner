import { prisma } from '@/lib/prisma'
import { Suspense } from 'react'
import { ScanHistoryClient } from './ScanHistoryClient'

export default async function ScanHistoryPage() {
  const [rawSessions, jobs] = await Promise.all([
    prisma.scanSession.findMany({
      orderBy: { startedAt: 'desc' },
      take: 100,
      include: { job: { select: { id: true, name: true, color: true } } },
    }),
    prisma.job.findMany({ where: { enabled: true }, select: { id: true, name: true, color: true } }),
  ])

  const sessions = rawSessions.map((s) => ({
    ...s,
    startedAt: s.startedAt.toISOString(),
    endedAt: s.endedAt?.toISOString() ?? null,
  }))

  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const monthSessions = sessions.filter((s) => new Date(s.startedAt) >= monthStart)
  const monthApifyCostUsd = monthSessions.reduce((sum, s) => sum + (s.apifyCostUsd ?? 0), 0)
  const monthAiCostUsd = monthSessions.reduce((sum, s) => sum + (s.aiCostUsd ?? 0), 0)
  const monthCostUsd = monthApifyCostUsd + monthAiCostUsd
  const totalCostUsd = sessions.reduce((sum, s) => sum + (s.apifyCostUsd ?? 0) + (s.aiCostUsd ?? 0), 0)
  const totalLeadsAll = sessions.reduce((sum, s) => sum + s.totalLeads, 0)
  const monthLeads = monthSessions.reduce((sum, s) => sum + s.totalLeads, 0)

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Lịch sử Scan</h1>
        <p className="text-gray-500 text-sm mt-1">{sessions.length} phiên quét gần đây</p>
      </div>
      <Suspense fallback={null}>
        <ScanHistoryClient
          sessions={sessions}
          jobs={jobs}
          totalLeadsAll={totalLeadsAll}
          monthCostUsd={monthCostUsd}
          monthApifyCostUsd={monthApifyCostUsd}
          monthAiCostUsd={monthAiCostUsd}
          totalCostUsd={totalCostUsd}
          monthLeads={monthLeads}
        />
      </Suspense>
    </div>
  )
}
