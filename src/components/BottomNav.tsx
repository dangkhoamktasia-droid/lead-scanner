'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Users, History, Settings, Briefcase } from 'lucide-react'

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/jobs', label: 'Jobs', icon: Briefcase },
  { href: '/leads', label: 'Leads', icon: Users },
  { href: '/scan-history', label: 'Scan', icon: History },
  { href: '/settings', label: 'Cài đặt', icon: Settings },
]

export function BottomNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-white/90 backdrop-blur-md border-t border-gray-100 shadow-lg">
      <div className="flex items-center justify-around px-2 py-1 safe-area-bottom">
        {navItems.map((item) => {
          const Icon = item.icon
          const active = pathname.startsWith(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center gap-0.5 px-3 py-2 rounded-xl transition-all min-w-0 ${
                active ? 'text-indigo-600' : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              <Icon className={`w-5 h-5 flex-shrink-0 ${active ? 'text-indigo-600' : ''}`} />
              <span className={`text-[10px] font-medium truncate ${active ? 'text-indigo-600' : ''}`}>
                {item.label}
              </span>
              {active && <span className="absolute top-1 w-1 h-1 bg-indigo-500 rounded-full" />}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
