import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Sidebar } from '@/components/Sidebar'
import { BottomNav } from '@/components/BottomNav'
import { Toaster } from 'sonner'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Lead Scanner — KOL/KOC Booking',
  description: 'Internal tool to scan and filter booking leads',
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi">
      <body className={inter.className}>
        {/* Background orbs */}
        <div className="orb orb-purple" />
        <div className="orb orb-pink" />

        <div className="flex min-h-screen relative z-10">
          <div className="hidden md:flex">
            <Sidebar />
          </div>
          <main className="flex-1 p-4 md:p-6 overflow-auto pb-20 md:pb-6">{children}</main>
        </div>
        <BottomNav />
        <Toaster richColors position="top-right" />
      </body>
    </html>
  )
}
