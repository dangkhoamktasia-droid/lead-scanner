import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const sessionId = req.nextUrl.searchParams.get('sessionId')
  const statusParam = req.nextUrl.searchParams.get('status')
  const statuses = statusParam ? statusParam.split(',') : undefined

  const where: Record<string, unknown> = {}
  if (sessionId) where.scanSessionId = sessionId
  if (statuses) where.status = { in: statuses }

  const leads = await prisma.lead.findMany({
    where,
    orderBy: [{ confidence: 'desc' }, { createdAt: 'desc' }],
    take: 500,
  })

  return NextResponse.json(leads)
}
