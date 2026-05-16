import { logger } from '@/lib/logger'

export interface ApifyPost {
  text: string
  url: string
  facebookUrl: string
  userName: string
  userId: string
  rawJson: string
  groupId: string // matched from URL
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

// Extract Facebook group ID from post URL
// e.g. https://www.facebook.com/groups/230385329770556/posts/123 → "230385329770556"
function extractGroupIdFromUrl(postUrl: string): string {
  const match = postUrl.match(/facebook\.com\/groups\/([^/]+)/)
  return match ? match[1] : ''
}

async function runApifyActorBatch(
  groupUrls: string[],
  onlyPostsNewerThan: string,
  resultsLimitPerGroup: number,
  apifyToken: string
): Promise<ApifyItem[]> {
  const startUrls = groupUrls.map((url) => ({ url }))

  const runRes = await fetch(
    `https://api.apify.com/v2/acts/apify~facebook-groups-scraper/runs?token=${apifyToken}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        startUrls,
        onlyPostsNewerThan,
        resultsLimit: resultsLimitPerGroup,
        viewOption: 'CHRONOLOGICAL',
      }),
    }
  )

  if (!runRes.ok) {
    const text = await runRes.text()
    throw new Error(`Apify batch run failed: ${runRes.status} ${text}`)
  }

  const runData = await runRes.json() as { data: { id: string } }
  const runId = runData.data.id
  logger.info(`Apify batch run started: ${runId} for ${groupUrls.length} groups`)

  // Poll up to 15 minutes for batch runs (more groups = more time)
  const maxWaitMs = 15 * 60 * 1000
  const pollIntervalMs = 5000
  const startTime = Date.now()

  while (Date.now() - startTime < maxWaitMs) {
    await new Promise((r) => setTimeout(r, pollIntervalMs))

    const statusRes = await fetch(
      `https://api.apify.com/v2/actor-runs/${runId}?token=${apifyToken}`
    )
    const statusData = await statusRes.json() as { data: { status: string } }
    const status = statusData.data.status

    logger.info(`Apify batch run ${runId} status: ${status}`)

    if (status === 'SUCCEEDED') {
      // Fetch all items — up to resultsLimitPerGroup × number of groups
      const limit = resultsLimitPerGroup * groupUrls.length
      const dataRes = await fetch(
        `https://api.apify.com/v2/actor-runs/${runId}/dataset/items?token=${apifyToken}&limit=${limit}`
      )
      const items = await dataRes.json() as ApifyItem[]
      return items
    }

    if (status === 'FAILED' || status === 'ABORTED' || status === 'TIMED-OUT') {
      throw new Error(`Apify batch run ${runId} ended with status: ${status}`)
    }
  }

  throw new Error(`Apify batch run timed out after 15 minutes`)
}

export interface GroupCrawlInput {
  groupId: string   // DB id
  groupUrl: string
  sinceDate?: Date
}

export interface ApifyPostWithGroup extends ApifyPost {
  groupId: string
}

// Crawl all groups in a single Apify run, return posts tagged with their DB groupId
export async function crawlAllGroups(params: {
  groups: GroupCrawlInput[]
  scanDays: number
  resultLimit: number
  apifyToken: string
}): Promise<ApifyPostWithGroup[]> {
  const { groups, scanDays, resultLimit, apifyToken } = params

  // Use the earliest lastScannedAt across all groups as the cutoff
  // If any group has never been scanned, fall back to scanDays
  const sinceDates = groups.map((g) => g.sinceDate).filter(Boolean) as Date[]
  const onlyPostsNewerThan =
    sinceDates.length === groups.length
      ? new Date(Math.min(...sinceDates.map((d) => d.getTime()))).toISOString()
      : `${scanDays} days`

  logger.info(`Crawling ${groups.length} groups since: ${onlyPostsNewerThan}`)

  // Build map: facebook group ID → DB group id
  const groupUrlIdMap = new Map<string, string>()
  for (const g of groups) {
    const fbGroupId = extractGroupIdFromUrl(g.groupUrl)
    if (fbGroupId) groupUrlIdMap.set(fbGroupId, g.groupId)
    // Also map by full URL slug (for named groups like /groups/booking.kol.genstar/)
    const slugMatch = g.groupUrl.match(/facebook\.com\/groups\/([^/]+)/)
    if (slugMatch) groupUrlIdMap.set(slugMatch[1], g.groupId)
  }

  let items: ApifyItem[]
  try {
    items = await runApifyActorBatch(
      groups.map((g) => g.groupUrl),
      onlyPostsNewerThan,
      resultLimit,
      apifyToken
    )
  } catch (err) {
    logger.warn('Batch run failed, retrying with limit=15', err)
    items = await runApifyActorBatch(
      groups.map((g) => g.groupUrl),
      onlyPostsNewerThan,
      15,
      apifyToken
    )
  }

  const posts: ApifyPostWithGroup[] = []

  for (const item of items) {
    if (!item.text || item.text.trim().length <= 10) continue

    const postUrl = item.url ?? ''
    const fbGroupIdFromPost = extractGroupIdFromUrl(postUrl)
    const dbGroupId = groupUrlIdMap.get(fbGroupIdFromPost) ?? ''

    if (!dbGroupId) {
      logger.warn(`Could not match post to group: ${postUrl}`)
      continue
    }

    posts.push({
      text: item.text,
      url: postUrl,
      facebookUrl: item.facebookUrl ?? '',
      userName: item.user?.name ?? '',
      userId: item.user?.id ?? '',
      rawJson: JSON.stringify(item),
      groupId: dbGroupId,
    })
  }

  logger.info(`Batch crawl complete: ${posts.length} posts from ${groups.length} groups`)
  return posts
}
