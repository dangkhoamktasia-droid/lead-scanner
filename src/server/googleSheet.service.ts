import { google } from 'googleapis'
import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/logger'

async function getSheetClient(settings: Record<string, string>) {
  const credPath = settings.googleCredentialsPath || process.env.GOOGLE_APPLICATION_CREDENTIALS || ''
  const credJson = settings.googleCredentialsJson || ''

  let credentials: object
  if (credJson) {
    credentials = JSON.parse(credJson)
  } else if (credPath) {
    const fs = await import('fs')
    credentials = JSON.parse(fs.readFileSync(credPath, 'utf-8'))
  } else {
    throw new Error('Google credentials chưa được cấu hình. Thêm credentials.json vào Settings.')
  }

  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  })

  return google.sheets({ version: 'v4', auth })
}

export async function syncLeadsToSheet(leadIds: string[]): Promise<{ success: number; failed: number }> {
  const settings = Object.fromEntries(
    (await prisma.appSetting.findMany()).map((r) => [r.key, r.value])
  )

  const sheetId = settings.googleSheetId || process.env.GOOGLE_SHEET_ID || ''
  const sheetName = settings.googleSheetName || process.env.GOOGLE_SHEET_NAME || 'Sheet1'

  if (!sheetId) throw new Error('Google Sheet ID chưa được cấu hình')

  const sheets = await getSheetClient(settings)

  const existing = await sheets.spreadsheets.values.get({
    spreadsheetId: sheetId,
    range: `${sheetName}!A:J`,
  })

  const rows = existing.data.values ?? []
  const existingUrls = new Set(rows.map((r) => r[4] ?? '').filter(Boolean))
  const maxStt = rows.reduce((max, r) => {
    const n = parseInt(r[0] ?? '0')
    return isNaN(n) ? max : Math.max(max, n)
  }, 0)

  const leads = await prisma.lead.findMany({
    where: { id: { in: leadIds }, status: 'APPROVED' },
  })

  let stt = maxStt + 1
  let success = 0
  let failed = 0
  const today = new Date().toLocaleDateString('vi-VN')

  for (const lead of leads) {
    if (lead.postUrl && existingUrls.has(lead.postUrl)) {
      logger.warn(`Skip duplicate in sheet: ${lead.postUrl}`)
      await prisma.syncLog.create({
        data: { leadId: lead.id, status: 'FAILED', errorMessage: 'Duplicate in sheet' },
      })
      failed++
      continue
    }

    try {
      await sheets.spreadsheets.values.append({
        spreadsheetId: sheetId,
        range: `${sheetName}!A:J`,
        valueInputOption: 'USER_ENTERED',
        requestBody: {
          values: [[
            stt,
            today,
            lead.userProfileUrl ?? '',
            lead.userProfileUrl ?? '',
            lead.postUrl ?? '',
            lead.hinhThucCast ?? '',
            lead.sanPhamDichVu ?? '',
            lead.soLuongCanBook ?? '',
            lead.sdtLienHe ?? '',
            lead.message ?? '',
          ]],
        },
      })

      await prisma.lead.update({ where: { id: lead.id }, data: { status: 'SYNCED_TO_SHEET', syncedAt: new Date() } })
      await prisma.syncLog.create({ data: { leadId: lead.id, sheetRow: stt, status: 'SUCCESS' } })
      stt++
      success++
    } catch (err) {
      logger.error(`Sync lead ${lead.id} failed`, err)
      await prisma.syncLog.create({ data: { leadId: lead.id, status: 'FAILED', errorMessage: String(err) } })
      failed++
    }
  }

  return { success, failed }
}
