import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3'
import { PrismaClient } from '@prisma/client'
import * as dotenv from 'dotenv'
import * as path from 'path'

dotenv.config({ path: path.resolve(__dirname, '../.env') })

const dbUrl = process.env.DATABASE_URL ?? 'file:./dev.db'
// Resolve relative file paths to absolute so the adapter can find the DB
const resolvedUrl = dbUrl.startsWith('file:.')
  ? `file:${path.resolve(__dirname, '..', dbUrl.replace('file:', ''))}`
  : dbUrl

const adapter = new PrismaBetterSqlite3({ url: resolvedUrl })
const prisma = new PrismaClient({ adapter })

const DEFAULT_GROUPS = [
  { name: 'Booking KOL, KOC, Review, Tiktoker Việt Nam', url: 'https://www.facebook.com/groups/230385329770556/', priority: 1 },
  { name: 'Booking KOC, KOL, TikTok, LiveStream Việt Nam', url: 'https://www.facebook.com/groups/940913056976466/', priority: 2 },
  { name: 'Booking KOL KOC Livestream - Booking TikToker Việt Nam', url: 'https://www.facebook.com/groups/608461244760642/', priority: 3 },
  { name: 'Cộng Đồng Booking KOC, KOL - Tiktok Shop Việt Nam', url: 'https://www.facebook.com/groups/217943854900918/', priority: 4 },
  { name: 'Booking Tiktok Review - Kol, Koc, Diễn Viên, Mẫu LiveStream', url: 'https://www.facebook.com/groups/booking.kol.genstar/', priority: 5 },
  { name: 'Booking TikTok KOL, KOC - Diễn Viên Vietnam', url: 'https://www.facebook.com/groups/1553295434945710/', priority: 6 },
  { name: 'BooKing KOL, KOC TikTok - Brands Việt Nam', url: 'https://www.facebook.com/groups/198180969735210/', priority: 7 },
  { name: 'Cộng Đồng Booking KOLs/KOC - Influencer Việt Nam', url: 'https://www.facebook.com/groups/bookinginfluencerkolvietnam/', priority: 8 },
  { name: 'Booking KOLs Việt Nam', url: 'https://www.facebook.com/groups/bookingkolsvietnam/', priority: 9 },
]

async function main() {
  for (const group of DEFAULT_GROUPS) {
    await prisma.group.upsert({
      where: { url: group.url },
      update: {},
      create: group,
    })
  }
  console.log('Seeded', DEFAULT_GROUPS.length, 'groups')

  const defaults = [
    { key: 'defaultScanDays', value: '2' },
    { key: 'defaultResultLimit', value: '30' },
    { key: 'messageTemplate', value: 'Chào anh/ chị, em thấy mình có cần tìm tiktoker review [sản phẩm], em làm freelancer nên chi phí cũng oki, nếu được chị cho em xin zalo để gửi chị xem qua nha. Em cảm ơn ạ.' },
    { key: 'apifyToken', value: '' },
    { key: 'openaiKey', value: '' },
    { key: 'anthropicKey', value: '' },
    { key: 'aiProvider', value: 'openai' },
    { key: 'googleSheetId', value: '' },
    { key: 'googleSheetName', value: 'Sheet1' },
    { key: 'googleCredentialsJson', value: '' },
  ]
  for (const s of defaults) {
    await prisma.appSetting.upsert({ where: { key: s.key }, update: {}, create: s })
  }
  console.log('Seeded default settings')
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => { console.error(e); prisma.$disconnect(); process.exit(1) })
