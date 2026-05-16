import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { runScan } from '@/server/scan.service'
import { logger } from '@/lib/logger'

// Called by external cron service (cron-job.org, etc.) or Windows Task Scheduler
// Protected by CRON_SECRET to prevent unauthorized triggers
export async function GET(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get('secret')
  const expectedSecret = process.env.CRON_SECRET || 'lead-scanner-cron-2024'

  if (secret !== expectedSecret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    logger.info('Cron job triggered')

    // Get all enabled groups
    const groups = await prisma.group.findMany({
      where: { enabled: true },
      select: { id: true },
    })

    if (groups.length === 0) {
      return NextResponse.json({ message: 'No enabled groups' })
    }

    // Get settings for defaults
    const settings = Object.fromEntries(
      (await prisma.appSetting.findMany()).map((r) => [r.key, r.value])
    )
    const scanDays = parseInt(settings.defaultScanDays || '2')
    const resultLimit = parseInt(settings.defaultResultLimit || '30')

    const sessionId = await runScan({
      groupIds: groups.map((g) => g.id),
      scanDays,
      resultLimit,
    })

    logger.info(`Cron scan complete: ${sessionId}`)
    return NextResponse.json({ sessionId, groups: groups.length })
  } catch (err) {
    logger.error('Cron scan failed', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
