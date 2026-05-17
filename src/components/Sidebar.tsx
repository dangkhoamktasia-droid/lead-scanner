'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Users, History, Settings, Zap, Briefcase } from 'lucide-react'

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/jobs', label: 'Jobs', icon: Briefcase },
  { href: '/leads', label: 'Leads', icon: Users },
  { href: '/scan-history', label: 'Lịch sử Scan', icon: History },
  { href: '/settings', label: 'Cài đặt', icon: Settings },
]

export function Sidebar() {
  const pathname = usePathname()

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
            <p className="text-xs text-gray-400 mt-0.5">KOL/KOC Booking</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-4 space-y-1">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 px-2">Menu</p>
        {navItems.map((item) => {
          const Icon = item.icon
          const active = pathname.startsWith(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                active
                  ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-md shadow-indigo-200'
                  : 'text-gray-600 hover:bg-white/70 hover:text-gray-900 hover:shadow-sm'
              }`}
            >
              <Icon className="w-4 h-4" />
              {item.label}
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-white/40">
        <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-3 border border-indigo-100">
          <p className="text-xs font-semibold text-indigo-700">Auto-scan</p>
          <p className="text-xs text-gray-500 mt-0.5">6h · 10h · 14h · 18h · 22h</p>
        </div>
      </div>
    </aside>
  )
}
