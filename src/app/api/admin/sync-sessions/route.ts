export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST() {
  try {
    // Get all sessions
    const allSessions = await prisma.scanSession.findMany({
      select: { id: true, status: true, startedAt: true },
    })

    if (allSessions.length === 0) {
      return NextResponse.json({ synced: 0, sessions: [], message: 'No sessions found' })
    }

    // Get lead counts grouped by session in one query
    const leadsBySession = await prisma.lead.groupBy({
      by: ['scanSessionId', 'status'],
      _count: true,
    })

    const postsBySession = await prisma.rawPost.groupBy({
      by: ['scanSessionId'],
      _count: true,
    })

    // Build maps
    const postsMap = new Map<string, number>()
    for (const p of postsBySession) {
      postsMap.set(p.scanSessionId, p._count)
    }

    type LeadMap = { total: number; rejected: number; duplicated: number }
    const leadsMap = new Map<string, LeadMap>()
    for (const l of leadsBySession) {
      const sid = l.scanSessionId
      if (!leadsMap.has(sid)) leadsMap.set(sid, { total: 0, rejected: 0, duplicated: 0 })
      const entry = leadsMap.get(sid)!
      entry.total += l._count
      if (l.status === 'REJECTED') entry.rejected += l._count
      if (l.status === 'DUPLICATED') entry.duplicated += l._count
    }

    // Update all sessions
    const results = []
    for (const session of allSessions) {
      const posts = postsMap.get(session.id) ?? 0
      const lm = leadsMap.get(session.id) ?? { total: 0, rejected: 0, duplicated: 0 }
      const qualified = lm.total - lm.rejected - lm.duplicated

      await prisma.scanSession.update({
        where: { id: session.id },
        data: {
          status: 'DONE',
          totalPosts: posts,
          totalLeads: lm.total,
          totalRejected: lm.rejected,
          totalDuplicated: lm.duplicated,
          endedAt: new Date(),
        },
      })

      results.push({
        startedAt: session.startedAt,
        posts,
        leads: lm.total,
        qualified,
        rejected: lm.rejected,
      })
    }

    return NextResponse.json({ synced: results.length, sessions: results })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
