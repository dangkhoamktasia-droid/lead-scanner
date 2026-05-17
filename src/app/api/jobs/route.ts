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
