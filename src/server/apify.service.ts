import { logger } from '@/lib/logger'

export interface ApifyPost {
  text: string
  url: string
  facebookUrl: string
  userName: string
  userId: string
  rawJson: string
}

interface ApifyItem {
  text?: string
  url?: string
  facebookUrl?: string
  user?: {
    name?: string
    id?: string
  }
}

async function runApifyActor(
  groupUrl: string,
  onlyPostsNewerThan: string,
  resultsLimit: number,
  apifyToken: string
): Promise<ApifyItem[]> {
  const runRes = await fetch(
    `https://api.apify.com/v2/acts/apify~facebook-groups-scraper/runs?token=${apifyToken}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        startUrls: [{ url: groupUrl }],
        onlyPostsNewerThan,
        resultsLimit,
        viewOption: 'CHRONOLOGICAL',
      }),
    }
  )

  if (!runRes.ok) {
    const text = await runRes.text()
    throw new Error(`Apify run failed: ${runRes.status} ${text}`)
  }

  const runData = await runRes.json() as { data: { id: string } }
  const runId = runData.data.id
  logger.info(`Apify run started: ${runId} for ${groupUrl}`)

  const maxWaitMs = 5 * 60 * 1000
  const pollIntervalMs = 5000
  const startTime = Date.now()

  while (Date.now() - startTime < maxWaitMs) {
    await new Promise((r) => setTimeout(r, pollIntervalMs))

    const statusRes = await fetch(
      `https://api.apify.com/v2/actor-runs/${runId}?token=${apifyToken}`
    )
    const statusData = await statusRes.json() as { data: { status: string } }
    const status = statusData.data.status

    logger.info(`Apify run ${runId} status: ${status}`)

    if (status === 'SUCCEEDED') {
      const dataRes = await fetch(
        `https://api.apify.com/v2/actor-runs/${runId}/dataset/items?token=${apifyToken}&limit=200`
      )
      const items = await dataRes.json() as ApifyItem[]
      return items
    }

    if (status === 'FAILED' || status === 'ABORTED' || status === 'TIMED-OUT') {
      throw new Error(`Apify run ${runId} ended with status: ${status}`)
    }
  }

  throw new Error(`Apify run ${runId} timed out after 5 minutes`)
}

export async function crawlGroup(params: {
  groupUrl: string
  scanDays: number
  resultLimit: number
  apifyToken: string
}): Promise<ApifyPost[]> {
  const { groupUrl, scanDays, resultLimit, apifyToken } = params
  const onlyPostsNewerThan = `${scanDays} days`

  let items: ApifyItem[]

  try {
    items = await runApifyActor(groupUrl, onlyPostsNewerThan, resultLimit, apifyToken)
  } catch (err) {
    logger.warn(`First attempt failed for ${groupUrl}, retrying with limit=15`, err)
    try {
      items = await runApifyActor(groupUrl, onlyPostsNewerThan, 15, apifyToken)
    } catch (err2) {
      throw new Error(`Both attempts failed for ${groupUrl}: ${String(err2)}`)
    }
  }

  return items
    .filter((item) => item.text && item.text.trim().length > 10)
    .map((item) => ({
      text: item.text ?? '',
      url: item.url ?? '',           // always use item.url, NOT facebookUrl
      facebookUrl: item.facebookUrl ?? '',
      userName: item.user?.name ?? '',
      userId: item.user?.id ?? '',
      rawJson: JSON.stringify(item),
    }))
}
