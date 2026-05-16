import { prisma } from '@/lib/prisma'

export async function getSessionReport(sessionId: string) {
  const session = await prisma.scanSession.findUnique({
    where: { id: sessionId },
    include: {
      scanGroupResults: { include: { group: true } },
    },
  })
  if (!session) return null

  const duration = session.endedAt
    ? Math.round((session.endedAt.getTime() - session.startedAt.getTime()) / 1000)
    : null

  return { ...session, durationSeconds: duration }
}
