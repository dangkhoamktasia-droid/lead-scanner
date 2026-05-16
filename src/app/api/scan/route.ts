import { NextRequest, NextResponse } from 'next/server'
import { ScanRequestSchema } from '@/lib/validators'
import { runScan } from '@/server/scan.service'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const parsed = ScanRequestSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
    }

    const sessionId = await runScan({
      groupIds: parsed.data.groupIds,
      scanDays: parsed.data.scanDays,
      resultLimit: parsed.data.resultLimit,
    })

    return NextResponse.json({ sessionId })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  const sessionId = req.nextUrl.searchParams.get('sessionId')
  if (!sessionId) {
    const sessions = await prisma.scanSession.findMany({
      orderBy: { startedAt: 'desc' },
      take: 20,
      include: { scanGroupResults: { include: { group: true } } },
    })
    return NextResponse.json(sessions)
  }

  const session = await prisma.scanSession.findUnique({
    where: { id: sessionId },
    include: { scanGroupResults: { include: { group: true } } },
  })

  if (!session) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(session)
}
