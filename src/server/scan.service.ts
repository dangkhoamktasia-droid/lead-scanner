import { prisma } from '@/lib/prisma'
import { crawlAllGroups } from './apify.service'
import { filterLeadWithAI, classifyByConfidence } from './aiLeadFilter.service'
import { isDuplicate, getFingerprint } from './duplicate.service'
import { logger } from '@/lib/logger'

export async function getSettings(): Promise<Record<string, string>> {
  const rows = await prisma.appSetting.findMany()
  return Object.fromEntries(rows.map((r) => [r.key, r.value]))
}

export interface ScanGroupProgress {
  groupId: string
  groupName: string
  status: 'PENDING' | 'RUNNING' | 'DONE' | 'FAILED'
  postsFound: number
  leadsFound: number
  errorMessage?: string
}

export async function runScan(params: {
  groupIds: string[]
  scanDays: number
  resultLimit: number
  jobId?: string
  onProgress?: (progress: ScanGroupProgress) => void
}): Promise<string> {
  const { groupIds, scanDays, resultLimit, onProgress } = params
  const settings = await getSettings()

  const apifyToken = settings.apifyToken || process.env.APIFY_API_TOKEN || ''
  const openaiKey = settings.openaiKey || process.env.OPENAI_API_KEY || ''
  const anthropicKey = settings.anthropicKey || process.env.ANTHROPIC_API_KEY || ''
  const aiProvider = (settings.aiProvider || process.env.AI_PROVIDER || 'openai') as 'openai' | 'anthropic'

  if (!apifyToken) throw new Error('Apify API token chưa được cấu hình. Vào Settings để thêm.')

  const aiKey = aiProvider === 'anthropic' ? anthropicKey : openaiKey
  if (!aiKey) throw new Error(`${aiProvider === 'anthropic' ? 'Anthropic' : 'OpenAI'} API key chưa được cấu hình.`)

  const groups = await prisma.group.findMany({
    where: { id: { in: groupIds } },
    orderBy: { priority: 'asc' },
  })

  const session = await prisma.scanSession.create({
    data: {
      scanDays,
      resultLimit,
      totalGroups: groups.length,
      status: 'RUNNING',
      jobId: params.jobId ?? null,
    },
  })

  logger.info(`Scan session created: ${session.id}, groups: ${groups.length}`)

  // Create group result records — all RUNNING at once (1 batch run)
  const groupResultMap = new Map<string, string>() // groupId → groupResultId
  for (const group of groups) {
    const gr = await prisma.scanGroupResult.create({
      data: { scanSessionId: session.id, groupId: group.id, status: 'RUNNING' },
    })
    groupResultMap.set(group.id, gr.id)
    onProgress?.({ groupId: group.id, groupName: group.name, status: 'RUNNING', postsFound: 0, leadsFound: 0 })
  }

  const scanStartedAt = new Date()

  let totalPosts = 0
  let totalLeads = 0
  let totalDuplicated = 0
  let totalRejected = 0
  let aiPostsProcessed = 0
  const groupLeadsMap = new Map<string, number>()
  const groupPostsMap = new Map<string, number>()

  try {
    // Single Apify run for all groups
    const crawlResult = await crawlAllGroups({
      groups: groups.map((g) => ({
        groupId: g.id,
        groupUrl: g.url,
        sinceDate: g.lastScannedAt ?? undefined,
      })),
      scanDays,
      resultLimit,
      apifyToken,
    })
    const allPosts = crawlResult.posts
    const apifyRunId = crawlResult.runId
    const apifyCostUsd = crawlResult.apifyCostUsd

    // Dedup by postUrl against already-processed posts
    const allPostUrls = allPosts.map((p) => p.url).filter(Boolean)
    const existingUrlSet = new Set(
      (await prisma.rawPost.findMany({
        where: { postUrl: { in: allPostUrls } },
        select: { postUrl: true },
      })).map((r) => r.postUrl)
    )

    const newPosts = allPosts.filter((p) => !existingUrlSet.has(p.url))
    logger.info(`Total posts: ${allPosts.length}, new (after dedup): ${newPosts.length}`)

    for (const post of newPosts) {
      const rawPost = await prisma.rawPost.create({
        data: {
          scanSessionId: session.id,
          groupId: post.groupId,
          postText: post.text,
          postUrl: post.url,
          facebookUrl: post.facebookUrl || null,
          userName: post.userName || null,
          userId: post.userId || null,
          rawJson: post.rawJson,
        },
      })

      totalPosts++
      aiPostsProcessed++
      groupPostsMap.set(post.groupId, (groupPostsMap.get(post.groupId) ?? 0) + 1)

      const aiResult = await filterLeadWithAI({
        postText: post.text,
        postUrl: post.url,
        provider: aiProvider,
        openaiKey,
        anthropicKey,
      })

      let status = classifyByConfidence(aiResult)

      if (status !== 'REJECTED') {
        const dup = await isDuplicate({
          hinhThucCast: aiResult.hinhThucCast,
          sanPhamDichVu: aiResult.sanPhamDichVu,
          userName: post.userName,
        })
        if (dup) {
          status = 'DUPLICATED'
          totalDuplicated++
        }
      }

      if (status === 'REJECTED') totalRejected++
      if (status === 'AI_FILTERED' || status === 'NEED_REVIEW') {
        totalLeads++
        groupLeadsMap.set(post.groupId, (groupLeadsMap.get(post.groupId) ?? 0) + 1)
      }

      await prisma.lead.create({
        data: {
          scanSessionId: session.id,
          rawPostId: rawPost.id,
          jobId: params.jobId ?? null,
          userName: post.userName || null,
          userProfileUrl: post.facebookUrl || null,
          postUrl: post.url || null,
          postText: post.text,
          hinhThucCast: aiResult.hinhThucCast || null,
          sanPhamDichVu: aiResult.sanPhamDichVu || null,
          soLuongCanBook: aiResult.soLuongCanBook || null,
          sdtLienHe: aiResult.sdtLienHe || null,
          message: aiResult.message || null,
          confidence: aiResult.confidence,
          reason: aiResult.reason || null,
          rejectReason: aiResult.rejectReason || null,
          fingerprint: getFingerprint({
            hinhThucCast: aiResult.hinhThucCast,
            sanPhamDichVu: aiResult.sanPhamDichVu,
            userName: post.userName,
          }),
          status,
        },
      })
    }

    // Update per-group results and lastScannedAt
    for (const group of groups) {
      const grId = groupResultMap.get(group.id)!
      const posts = groupPostsMap.get(group.id) ?? 0
      const leads = groupLeadsMap.get(group.id) ?? 0

      await prisma.scanGroupResult.update({
        where: { id: grId },
        data: { status: 'DONE', postsFound: posts, leadsFound: leads },
      })

      await prisma.group.update({
        where: { id: group.id },
        data: { lastScannedAt: scanStartedAt },
      })

      onProgress?.({ groupId: group.id, groupName: group.name, status: 'DONE', postsFound: posts, leadsFound: leads })
    }

    // GPT-4o-mini: $0.15/1M input + $0.60/1M output, avg ~600 tokens/post
    const aiCostUsd = aiPostsProcessed * 600 * (0.15 + 0.60) / 2 / 1_000_000

    await prisma.scanSession.update({
      where: { id: session.id },
      data: {
        endedAt: new Date(),
        status: 'DONE',
        successGroups: groups.length,
        failedGroups: 0,
        totalPosts,
        totalLeads,
        totalDuplicated,
        totalRejected,
        apifyRunId,
        apifyCostUsd,
        aiCostUsd,
      },
    })

    logger.info(`Scan session ${session.id} complete. Leads: ${totalLeads}`)
  } catch (err) {
    const errorMessage = String(err)
    logger.error('Batch scan failed', err)

    // Mark all groups as failed
    for (const group of groups) {
      const grId = groupResultMap.get(group.id)!
      await prisma.scanGroupResult.update({
        where: { id: grId },
        data: { status: 'FAILED', errorMessage },
      })
      onProgress?.({ groupId: group.id, groupName: group.name, status: 'FAILED', postsFound: 0, leadsFound: 0, errorMessage })
    }

    await prisma.scanSession.update({
      where: { id: session.id },
      data: { endedAt: new Date(), status: 'FAILED', failedGroups: groups.length, errorMessage },
    })
  }

  return session.id
}
