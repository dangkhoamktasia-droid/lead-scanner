import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { runScan } from '@/server/scan.service'
import { logger } from '@/lib/logger'

export async function GET(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get('secret')
  const expectedSecret = process.env.CRON_SECRET || 'lead-scanner-cron-2024'

  if (secret !== expectedSecret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    logger.info('Cron job triggered')

    const settings = Object.fromEntries(
      (await prisma.appSetting.findMany()).map((r) => [r.key, r.value])
    )
    const scanDays = parseInt(settings.defaultScanDays || '2')
    const resultLimit = parseInt(settings.defaultResultLimit || '30')

    const jobs = await prisma.job.findMany({
      where: { enabled: true },
      include: {
        groups: { where: { enabled: true }, select: { id: true } },
      },
    })

    if (jobs.length === 0) {
      return NextResponse.json({ message: 'No enabled jobs' })
    }

    const results: { jobId: string; jobName: string; sessionId?: string; error?: string }[] = []

    for (const job of jobs) {
      if (job.groups.length === 0) {
        results.push({ jobId: job.id, jobName: job.name, error: 'No enabled groups' })
        continue
      }
      try {
        const sessionId = await runScan({
          groupIds: job.groups.map((g) => g.id),
          scanDays,
          resultLimit,
          jobId: job.id,
        })
        results.push({ jobId: job.id, jobName: job.name, sessionId })
      } catch (err) {
        results.push({ jobId: job.id, jobName: job.name, error: String(err) })
      }
    }

    logger.info('Cron scan complete', results)
    return NextResponse.json({ results })
  } catch (err) {
    logger.error('Cron scan failed', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
