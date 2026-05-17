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
