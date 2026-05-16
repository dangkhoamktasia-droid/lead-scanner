import { prisma } from '@/lib/prisma'
import { SettingsClient } from './SettingsClient'

export default async function SettingsPage() {
  const rows = await prisma.appSetting.findMany()
  const settings = Object.fromEntries(rows.map((r) => [r.key, r.value]))

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-500 text-sm mt-1">Cấu hình API keys và tùy chọn quét</p>
      </div>
      <SettingsClient initialSettings={settings} />
    </div>
  )
}
