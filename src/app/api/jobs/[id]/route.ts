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
