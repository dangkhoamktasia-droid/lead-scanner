import { prisma } from '@/lib/prisma'
import { DashboardClient } from './DashboardClient'

export default async function DashboardPage() {
  const groups = await prisma.group.findMany({
    where: { enabled: true },
    orderBy: { priority: 'asc' },
  })

  const lastSession = await prisma.scanSession.findFirst({
    orderBy: { startedAt: 'desc' },
    include: { scanGroupResults: { include: { group: true } } },
  })

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">Quét Facebook Groups tìm lead booking KOL/KOC</p>
      </div>
      <DashboardClient groups={groups} lastSession={lastSession} />
    </div>
  )
}
