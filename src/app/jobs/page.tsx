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
