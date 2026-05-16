'use client'
import { useState, useEffect, useCallback } from 'react'
import { LeadPreviewTable } from '@/components/LeadPreviewTable'
import { toast } from 'sonner'

interface Session { id: string; startedAt: string; totalLeads: number; status: string }
interface Lead {
  id: string; userName: string | null; userProfileUrl: string | null; postUrl: string | null
  postText: string; hinhThucCast: string | null; sanPhamDichVu: string | null
  soLuongCanBook: string | null; sdtLienHe: string | null; message: string | null
  confidence: number; reason: string | null; rejectReason: string | null; status: string
}

export function LeadsClient({ sessions }: { sessions: Session[] }) {
  const [selectedSession, setSelectedSession] = useState<string>(sessions[0]?.id ?? '')
  const [statusFilter, setStatusFilter] = useState<string>('AI_FILTERED,NEED_REVIEW')
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedLeadIds, setSelectedLeadIds] = useState<string[]>([])
  const [syncing, setSyncing] = useState(false)

  const loadLeads = useCallback(async () => {
    if (!selectedSession) return
    setLoading(true)
    const params = new URLSearchParams({ sessionId: selectedSession, status: statusFilter })
    const res = await fetch(`/api/leads?${params}`)
    const data = await res.json()
    setLeads(Array.isArray(data) ? data : [])
    setSelectedLeadIds([])
    setLoading(false)
  }, [selectedSession, statusFilter])

  useEffect(() => { loadLeads() }, [loadLeads])

  const updateLead = async (id: string, patch: { status?: string; message?: string }) => {
    const res = await fetch(`/api/leads/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patch),
    })
    if (res.ok) {
      const updated = await res.json()
      setLeads((prev) => prev.map((l) => l.id === id ? { ...l, ...updated } : l))
    } else {
      toast.error('Cập nhật lead thất bại')
    }
  }

  const handleSync = async () => {
    const approvedIds = selectedLeadIds.length > 0
      ? selectedLeadIds
      : leads.filter((l) => l.status === 'APPROVED').map((l) => l.id)

    if (approvedIds.length === 0) {
      toast.error('Không có lead APPROVED nào để sync')
      return
    }

    setSyncing(true)
    try {
      const res = await fetch('/api/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leadIds: approvedIds }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast.success(`Sync thành công ${data.success} lead. Thất bại: ${data.failed}`)
      loadLeads()
    } catch (err) {
      toast.error(String(err))
    } finally {
      setSyncing(false)
    }
  }

  const approvedCount = leads.filter((l) => l.status === 'APPROVED').length

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl border p-4 flex flex-wrap gap-4 items-end">
        <div>
          <label className="text-xs font-medium text-gray-600 block mb-1">Phiên scan</label>
          <select
            value={selectedSession}
            onChange={(e) => setSelectedSession(e.target.value)}
            className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            {sessions.map((s) => (
              <option key={s.id} value={s.id}>
                {new Date(s.startedAt).toLocaleString('vi-VN')} ({s.totalLeads} leads)
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs font-medium text-gray-600 block mb-1">Trạng thái</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="AI_FILTERED,NEED_REVIEW">Chờ duyệt (AI_FILTERED + NEED_REVIEW)</option>
            <option value="APPROVED">Đã approve</option>
            <option value="REJECTED">Đã reject</option>
            <option value="SYNCED_TO_SHEET">Đã sync</option>
          </select>
        </div>
        <div className="ml-auto flex gap-2">
          <span className="text-sm text-gray-500 self-center">{approvedCount} đã approve</span>
          <button
            onClick={handleSync}
            disabled={syncing || approvedCount === 0}
            className="bg-green-600 hover:bg-green-700 disabled:bg-gray-300 text-white text-sm font-medium px-4 py-1.5 rounded-lg transition-colors"
          >
            {syncing ? 'Đang sync...' : 'Sync Google Sheet'}
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-400">Đang tải lead...</div>
      ) : leads.length === 0 ? (
        <div className="text-center py-12 text-gray-400">Không có lead nào trong phiên này</div>
      ) : (
        <LeadPreviewTable
          leads={leads}
          selectedIds={selectedLeadIds}
          onSelectChange={setSelectedLeadIds}
          onApprove={(id) => updateLead(id, { status: 'APPROVED' })}
          onReject={(id) => updateLead(id, { status: 'REJECTED' })}
          onMessageEdit={(id, msg) => updateLead(id, { message: msg })}
        />
      )}
    </div>
  )
}
