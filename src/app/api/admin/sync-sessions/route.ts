export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST() {
  // Find all sessions that are RUNNING or have stale totalLeads=0 but older than 10 min
  const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000)
  const staleSessions = await prisma.scanSession.findMany({
    where: {
      OR: [
        { status: 'RUNNING' },
        { status: 'FAILED' },
      ],
      startedAt: { lt: tenMinutesAgo },
    },
    select: { id: true, status: true, startedAt: true },
  })

  const results = []
  for (const session of staleSessions) {
    const [leadCount, postCount, rejectedCount, duplicatedCount] = await Promise.all([
      prisma.lead.count({ where: { scanSessionId: session.id } }),
      prisma.rawPost.count({ where: { scanSessionId: session.id } }),
      prisma.lead.count({ where: { scanSessionId: session.id, status: 'REJECTED' } }),
      prisma.lead.count({ where: { scanSessionId: session.id, status: 'DUPLICATED' } }),
    ])

    const qualified = leadCount - rejectedCount - duplicatedCount
    await prisma.scanSession.update({
      where: { id: session.id },
      data: {
        status: 'DONE',
        totalPosts: postCount,
        totalLeads: leadCount,
        totalRejected: rejectedCount,
        totalDuplicated: duplicatedCount,
        endedAt: new Date(),
      },
    })

    results.push({
      id: session.id,
      startedAt: session.startedAt,
      oldStatus: session.status,
      posts: postCount,
      leads: leadCount,
      qualified,
      rejected: rejectedCount,
      duplicated: duplicatedCount,
    })
  }

  return NextResponse.json({ synced: results.length, sessions: results })
}
