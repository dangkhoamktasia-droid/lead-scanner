export const dynamic = 'force-dynamic'
import { prisma } from '@/lib/prisma'
import { Suspense } from 'react'
import { LeadsClient } from './LeadsClient'

export default async function LeadsPage() {
  const [rawSessions, jobs, rawLeads] = await Promise.all([
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
    prisma.lead.findMany({
      where: { status: { notIn: ['REJECTED'] } },
      orderBy: { id: 'desc' },
      take: 200,
      select: {
        id: true, userName: true, userProfileUrl: true, postUrl: true,
        postText: true, hinhThucCast: true, sanPhamDichVu: true,
        soLuongCanBook: true, nganSach: true, sdtLienHe: true,
        message: true, confidence: true, reason: true,
        rejectReason: true, status: true,
      },
    }),
  ])
  const sessions = rawSessions.map((s) => ({
    ...s,
    startedAt: s.startedAt.toISOString(),
  }))

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="animate-fade-in-up">
        <h1 className="text-2xl font-bold text-gray-900">Quản lý Leads</h1>
        <p className="text-gray-700 text-sm mt-1">Duyệt và quản lý lead booking KOL/KOC</p>
      </div>
      <Suspense fallback={<div className="text-center py-12 text-gray-500">Đang tải...</div>}>
        <LeadsClient sessions={sessions} jobs={jobs} initialLeads={rawLeads} />
      </Suspense>
    </div>
  )
}
