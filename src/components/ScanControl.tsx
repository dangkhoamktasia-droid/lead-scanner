'use client'
import { useState } from 'react'
import { GroupSelector } from './GroupSelector'
import { Play, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

interface Group {
  id: string
  name: string
  url: string
  enabled: boolean
}

interface ScanControlProps {
  groups: Group[]
  onScanStarted: (sessionId: string) => void
}

export function ScanControl({ groups, onScanStarted }: ScanControlProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>(groups.map((g) => g.id))
  const [scanDays, setScanDays] = useState<1 | 2 | 7>(2)
  const [resultLimit, setResultLimit] = useState<15 | 30 | 50>(30)
  const [loading, setLoading] = useState(false)

  const handleRun = async () => {
    if (selectedIds.length === 0) {
      toast.error('Chọn ít nhất 1 group')
      return
    }
    setLoading(true)
    try {
      const res = await fetch('/api/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ groupIds: selectedIds, scanDays, resultLimit }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Scan failed')
      toast.success(`Scan hoàn thành! Session: ${data.sessionId}`)
      onScanStarted(data.sessionId)
    } catch (err) {
      toast.error(String(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white rounded-2xl border p-6 shadow-sm space-y-5">
      <h2 className="font-semibold text-gray-800">Cài đặt Scan</h2>

      <GroupSelector groups={groups} selectedIds={selectedIds} onChange={setSelectedIds} />

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium text-gray-700 block mb-1">Khoảng thời gian</label>
          <select
            value={scanDays}
            onChange={(e) => setScanDays(Number(e.target.value) as 1 | 2 | 7)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value={1}>24 giờ qua</option>
            <option value={2}>48 giờ qua</option>
            <option value={7}>7 ngày qua</option>
          </select>
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700 block mb-1">Số bài / group</label>
          <select
            value={resultLimit}
            onChange={(e) => setResultLimit(Number(e.target.value) as 15 | 30 | 50)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value={15}>15 bài</option>
            <option value={30}>30 bài</option>
            <option value={50}>50 bài</option>
          </select>
        </div>
      </div>

      <button
        onClick={handleRun}
        disabled={loading}
        className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-medium py-2.5 px-4 rounded-lg transition-colors"
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Đang quét... (có thể mất vài phút)
          </>
        ) : (
          <>
            <Play className="w-4 h-4" />
            Chạy Scan
          </>
        )}
      </button>
    </div>
  )
}
