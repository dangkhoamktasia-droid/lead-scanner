'use client'
import { useState, useEffect, useRef } from 'react'
import { useSearchParams } from 'next/navigation'
import { LeadPreviewTable } from '@/components/LeadPreviewTable'
import { toast } from 'sonner'

interface Session { id: string; startedAt: string; totalLeads: number; status: string; jobId: string | null }
interface Job { id: string; name: string; color: string }
interface Lead {
  id: string; userName: string | null; userProfileUrl: string | null; postUrl: string | null
  postText: string; hinhThucCast: string | null; sanPhamDichVu: string | null
  soLuongCanBook: string | null; nganSach: string | null; sdtLienHe: string | null
  message: string | null; confidence: number; reason: string | null
  rejectReason: string | null; status: string
}

export function LeadsClient({ sessions, jobs, initialLeads = [] }: { sessions: Session[]; jobs: Job[]; initialLeads?: Lead[] }) {
  const searchParams = useSearchParams()
  const initialStatus = searchParams.get('status') ?? ''
  const [selectedSession, setSelectedSession] = useState<string>('')
  const [statusFilter, setStatusFilter] = useState<string>(initialStatus)
  const [jobFilter, setJobFilter] = useState<string>('all')
  const [leads, setLeads] = useState<Lead[]>(initialLeads)
  const [loading, setLoading] = useState(false)
  const [selectedLeadIds, setSelectedLeadIds] = useState<string[]>([])
  // Track if this is the first render — skip fetch on mount (use initialLeads instead)
  const hasMounted = useRef(false)

  useEffect(() => {
    // Skip the very first mount — initialLeads from server is already shown
    if (!hasMounted.current) {
      hasMounted.current = true
      // But if there's a URL status filter, initialLeads isn't filtered — fetch it
      if (initialStatus) {
        doFetch(initialStatus, '', 'all')
      }
      return
    }
    doFetch(statusFilter, selectedSession, jobFilter)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, selectedSession, jobFilter])

  async function doFetch(status: string, session: string, job: string) {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (status) params.set('status', status)
      if (session) params.set('sessionId', session)
      if (job !== 'all') params.set('jobId', job)
      const res = await fetch(`/api/leads?${params}`)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      setLeads(Array.isArray(data) ? data : [])
      setSelectedLeadIds([])
    } catch (err) {
      toast.error('Lỗi tải dữ liệu: ' + String(err))
    } finally {
      setLoading(false)
    }
  }

  function reload() {
    doFetch(statusFilter, selectedSession, jobFilter)
  }

  const updateLead = async (id: string, patch: { status?: string; message?: string; nganSach?: string; soLuongCanBook?: string }) => {
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

  const filteredSessions = jobFilter === 'all'
    ? sessions
    : sessions.filter((s) => s.jobId === jobFilter)

  return (
    <div className="space-y-4">
      {/* Job tabs */}
      <div className="flex items-center gap-2 flex-wrap">
        <button
          onClick={() => { setJobFilter('all'); setSelectedSession('') }}
          className={`px-4 py-2 rounded-xl text-sm font-medium transition-all border ${
            jobFilter === 'all'
              ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white border-transparent shadow-md shadow-indigo-100'
              : 'bg-white text-gray-700 border-gray-200 hover:border-indigo-300 hover:text-indigo-600'
          }`}
        >
          Tất cả
        </button>
        {jobs.map((j) => (
          <button
            key={j.id}
            onClick={() => { setJobFilter(j.id); setSelectedSession('') }}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all border ${
              jobFilter === j.id
                ? 'text-white border-transparent shadow-md'
                : 'bg-white text-gray-700 border-gray-200 hover:text-gray-900'
            }`}
            style={jobFilter === j.id ? { background: j.color, borderColor: j.color, boxShadow: `0 4px 12px ${j.color}40` } : { '--hover-color': j.color } as React.CSSProperties}
          >
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: jobFilter === j.id ? 'white' : j.color }} />
              {j.name}
            </span>
          </button>
        ))}
      </div>

      <div className="glass-card rounded-2xl p-4 flex flex-col sm:flex-row flex-wrap gap-3 sm:items-end shadow-sm">
        <div>
          <label className="text-xs font-medium text-gray-800 font-semibold block mb-1">Phiên scan</label>
          <select
            value={selectedSession}
            onChange={(e) => setSelectedSession(e.target.value)}
            className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">Tất cả phiên</option>
            {filteredSessions.map((s) => (
              <option key={s.id} value={s.id}>
                {new Date(s.startedAt).toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })} ({s.totalLeads} leads)
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs font-medium text-gray-800 font-semibold block mb-1">Trạng thái</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">Tất cả</option>
            <option value="AI_FILTERED,NEED_REVIEW">Chờ duyệt</option>
            <option value="APPROVED">Đã approve</option>
            <option value="CLOSED">Hợp tác</option>
            <option value="DUPLICATED">Trùng lặp</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-600 animate-pulse">Đang tải lead...</div>
      ) : leads.length === 0 ? (
        <div className="text-center py-12 space-y-3">
          <p className="text-gray-600">Không có lead nào</p>
          <button onClick={reload} className="px-4 py-2 rounded-xl border border-gray-200 bg-white text-gray-700 text-sm hover:border-indigo-300 hover:text-indigo-600 transition-colors">
            Tải lại
          </button>
        </div>
      ) : (
        <LeadPreviewTable
          leads={leads}
          selectedIds={selectedLeadIds}
          onSelectChange={setSelectedLeadIds}
          onApprove={(id) => updateLead(id, { status: 'APPROVED' })}
          onReject={(id) => updateLead(id, { status: 'REJECTED' })}
          onClose={(id) => updateLead(id, { status: 'CLOSED' })}
          onMessageEdit={(id, msg) => updateLead(id, { message: msg })}
          onFieldEdit={(id, field, val) => updateLead(id, { [field]: val })}
        />
      )}
    </div>
  )
}
