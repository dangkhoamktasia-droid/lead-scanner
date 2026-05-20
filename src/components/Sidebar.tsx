import Link from 'next/link'
import { LayoutDashboard, Users, History, Settings, Zap, Briefcase, Clock } from 'lucide-react'
import { prisma } from '@/lib/prisma'
import { SidebarNav } from './SidebarNav'

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: 'dashboard' },
  { href: '/jobs', label: 'Jobs', icon: 'jobs' },
  { href: '/leads', label: 'Leads', icon: 'leads' },
  { href: '/scan-history', label: 'Lịch sử Scan', icon: 'history' },
  { href: '/settings', label: 'Cài đặt', icon: 'settings' },
]

async function getScanHours(): Promise<string[]> {
  try {
    const row = await prisma.appSetting.findUnique({ where: { key: 'cronScheduleHours' } })
    if (row?.value) return JSON.parse(row.value) as string[]
  } catch { /* ignore */ }
  return ['7h', '19h']
}

export async function Sidebar() {
  const scanHours = await getScanHours()
  const hoursDisplay = scanHours.join(' · ')

  return (
    <aside className="w-60 glass-card flex flex-col min-h-screen shadow-xl rounded-none border-r border-white/60">
      {/* Logo */}
      <div className="p-5 border-b border-white/40">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg">
            <Zap className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="font-bold text-gray-800 text-sm leading-none">Lead Scanner</p>
            <p className="text-xs text-gray-500 mt-0.5">KOL/KOC Booking</p>
          </div>
        </div>
      </div>

      {/* Nav — client component for active state */}
      <SidebarNav navItems={navItems} />

      {/* Footer — scan schedule from DB */}
      <div className="p-4 border-t border-white/40">
        <Link href="/settings" className="block bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-3 border border-indigo-100 hover:border-indigo-300 transition-colors">
          <div className="flex items-center gap-1.5 mb-0.5">
            <Clock className="w-3 h-3 text-indigo-600" />
            <p className="text-xs font-semibold text-indigo-700">Auto-scan</p>
          </div>
          <p className="text-xs text-gray-700 font-medium">{hoursDisplay}</p>
        </Link>
      </div>
    </aside>
  )
}
