import { prisma } from '@/lib/prisma'
import { crawlGroup } from './apify.service'
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
    },
  })

  logger.info(`Scan session created: ${session.id}, groups: ${groups.length}`)

  let successGroups = 0
  let failedGroups = 0
  let totalPosts = 0
  let totalLeads = 0
  let totalDuplicated = 0
  let totalRejected = 0

  for (const group of groups) {
    const groupResult = await prisma.scanGroupResult.create({
      data: {
        scanSessionId: session.id,
        groupId: group.id,
        status: 'RUNNING',
      },
    })

    onProgress?.({
      groupId: group.id,
      groupName: group.name,
      status: 'RUNNING',
      postsFound: 0,
      leadsFound: 0,
    })

    try {
      const posts = await crawlGroup({
        groupUrl: group.url,
        scanDays,
        resultLimit,
        apifyToken,
      })

      logger.info(`Group ${group.name}: found ${posts.length} posts`)

      let groupLeads = 0

      for (const post of posts) {
        const rawPost = await prisma.rawPost.create({
          data: {
            scanSessionId: session.id,
            groupId: group.id,
            postText: post.text,
            postUrl: post.url,
            facebookUrl: post.facebookUrl || null,
            userName: post.userName || null,
            userId: post.userId || null,
            rawJson: post.rawJson,
          },
        })

        totalPosts++

        const aiResult = await filterLeadWithAI({
          postText: post.text,
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
          groupLeads++
        }

        await prisma.lead.create({
          data: {
            scanSessionId: session.id,
            rawPostId: rawPost.id,
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

      await prisma.scanGroupResult.update({
        where: { id: groupResult.id },
        data: {
          status: 'DONE',
          postsFound: posts.length,
          leadsFound: groupLeads,
        },
      })

      successGroups++
      onProgress?.({
        groupId: group.id,
        groupName: group.name,
        status: 'DONE',
        postsFound: posts.length,
        leadsFound: groupLeads,
      })
    } catch (err) {
      const errorMessage = String(err)
      logger.error(`Group ${group.name} failed`, err)

      await prisma.scanGroupResult.update({
        where: { id: groupResult.id },
        data: { status: 'FAILED', errorMessage },
      })

      failedGroups++
      onProgress?.({
        groupId: group.id,
        groupName: group.name,
        status: 'FAILED',
        postsFound: 0,
        leadsFound: 0,
        errorMessage,
      })
    }
  }

  const finalStatus = failedGroups === groups.length ? 'FAILED' : 'DONE'

  await prisma.scanSession.update({
    where: { id: session.id },
    data: {
      endedAt: new Date(),
      status: finalStatus,
      successGroups,
      failedGroups,
      totalPosts,
      totalLeads,
      totalDuplicated,
      totalRejected,
    },
  })

  logger.info(`Scan session ${session.id} complete. Status: ${finalStatus}, Leads: ${totalLeads}`)
  return session.id
}
