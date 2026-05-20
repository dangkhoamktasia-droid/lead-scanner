export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const sessionId = req.nextUrl.searchParams.get('sessionId')
  const statusParam = req.nextUrl.searchParams.get('status')
  const jobId = req.nextUrl.searchParams.get('jobId')
  const statuses = statusParam ? statusParam.split(',') : undefined

  const where: Record<string, unknown> = {}
  if (sessionId) where.scanSessionId = sessionId
  // If no status filter, hide REJECTED by default (AI handles those, user doesn't need to see)
  if (statuses) where.status = { in: statuses }
  else where.status = { notIn: ['REJECTED'] }
  if (jobId) where.jobId = jobId

  const leads = await prisma.lead.findMany({
    where,
    orderBy: [{ confidence: 'desc' }, { createdAt: 'desc' }],
    take: 500,
  })

  return NextResponse.json(leads)
}
