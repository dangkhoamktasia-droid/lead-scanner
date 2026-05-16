'use client'
import { useState } from 'react'
import { ScanControl } from '@/components/ScanControl'
import { ScanProgress } from '@/components/ScanProgress'
import { useRouter } from 'next/navigation'

interface Group { id: string; name: string; url: string; enabled: boolean }
interface SessionGroupResult {
  id: string; groupId: string; status: string
  postsFound: number; leadsFound: number; errorMessage?: string | null
  group: { name: string }
}
interface Session {
  id: string; status: string; totalPosts: number; totalLeads: number
  totalDuplicated: number; totalRejected: number
  scanGroupResults: SessionGroupResult[]
}

export function DashboardClient({
  groups,
  lastSession,
}: {
  groups: Group[]
  lastSession: Session | null
}) {
  const router = useRouter()
  const [currentSession, setCurrentSession] = useState<Session | null>(lastSession)

  const handleScanStarted = async (sessionId: string) => {
    const res = await fetch(`/api/scan?sessionId=${sessionId}`)
    const session = await res.json()
    setCurrentSession(session)
    router.refresh()
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <ScanControl groups={groups} onScanStarted={handleScanStarted} />
      {currentSession ? (
        <ScanProgress session={currentSession} />
      ) : (
        <div className="bg-white rounded-2xl border p-6 shadow-sm flex items-center justify-center text-gray-400 text-sm">
          Chưa có phiên scan nào. Bấm &quot;Chạy Scan&quot; để bắt đầu.
        </div>
      )}
    </div>
  )
}
