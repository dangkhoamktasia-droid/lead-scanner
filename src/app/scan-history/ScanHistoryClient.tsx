'use client'
import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { CheckCircle, XCircle, Clock, ChevronRight, Users, Filter, DollarSign } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { vi } from 'date-fns/locale'

interface Session {
  id: string
  startedAt: string
  endedAt: string | null
  status: string
  totalPosts: number
  totalLeads: number
  totalRejected: number
  totalDuplicated: number
  successGroups: number
  failedGroups: number
  apifyCostUsd: number | null
  aiCostUsd: number | null
  jobId: string | null
  job: { id: string; name: string; color: string } | null
}

interface Job { id: string; name: string; color: string }

interface Props {
  sessions: Session[]
  jobs: Job[]
  totalLeadsAll: number
  monthCostUsd: number
  monthApifyCostUsd: number
  monthAiCostUsd: number
  totalCostUsd: number
  monthLeads: number
}

export function ScanHistoryClient({ sessions, jobs, totalLeadsAll, monthCostUsd, monthApifyCostUsd, monthAiCostUsd, totalCostUsd, monthLeads }: Props) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [costTooltip, setCostTooltip] = useState<string | null>(null)
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 })

  useEffect(() => {
    const close = () => setCostTooltip(null)
    window.addEventListener('click', close)
    return () => window.removeEventListener('click', close)
  }, [])

  const jobFilter = searchParams.get('jobId') ?? 'all'
  const statusFilter = searchParams.get('status') ?? 'all'

  const setFilter = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (value === 'all') params.delete(key)
    else params.set(key, value)
    router.push(`?${params.toString()}`)
  }

  const filtered = sessions.filter((s) => {
    if (jobFilter !== 'all' && s.jobId !== jobFilter) return false
    if (statusFilter !== 'all' && s.status !== statusFilter) return false
    return true
  })

  const avgCostPerLead = totalLeadsAll > 0 ? totalCostUsd / totalLeadsAll : 0
  const monthSessionsCount = sessions.filter(s => { const now = new Date(); return new Date(s.startedAt) >= new Date(now.getFullYear(), now.getMonth(), 1) }).length

  const summaryCards = [
    { label: 'Lead tháng này', value: monthLeads.toString(), sub: `${monthSessionsCount} phiên scan`, color: 'text-green-600' },
    { label: 'Apify (tháng này)', value: `$${monthApifyCostUsd.toFixed(3)}`, sub: `≈ ${Math.round(monthApifyCostUsd * 25400).toLocaleString('vi-VN')}đ`, color: 'text-orange-500' },
    { label: 'AI Filter (tháng này)', value: `$${monthAiCostUsd.toFixed(3)}`, sub: `≈ ${Math.round(monthAiCostUsd * 25400).toLocaleString('vi-VN')}đ`, color: 'text-blue-500' },
    { label: 'Tổng chi phí tháng', value: `$${monthCostUsd.toFixed(3)}`, sub: `≈ ${Math.round(monthCostUsd * 25400).toLocaleString('vi-VN')}đ`, color: 'text-indigo-600' },
    { label: 'Chi phí / lead', value: avgCostPerLead > 0 ? `$${avgCostPerLead.toFixed(3)}` : '—', sub: `${totalLeadsAll} leads tổng`, color: 'text-purple-600' },
  ]

  return (
    <div className="space-y-5">
      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 md:gap-4">
        {summaryCards.map((c) => (
          <div key={c.label} className="glass-card rounded-2xl px-5 py-4 shadow-sm">
            <p className="text-xs text-gray-500 mb-1">{c.label}</p>
            <p className={`text-2xl font-bold ${c.color}`}>{c.value}</p>
            <p className="text-xs text-gray-400 mt-0.5">{c.sub}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="glass-card rounded-2xl p-3 flex items-center gap-3 shadow-sm">
        <Filter className="w-4 h-4 text-gray-400 ml-1" />
        {jobs.length > 1 && (
          <select
            value={jobFilter}
            onChange={(e) => setFilter('jobId', e.target.value)}
            className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
          >
            <option value="all">Tất cả Jobs</option>
            {jobs.map((j) => <option key={j.id} value={j.id}>{j.name}</option>)}
          </select>
        )}
        <select
          value={statusFilter}
          onChange={(e) => setFilter('status', e.target.value)}
          className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
        >
          <option value="all">Tất cả trạng thái</option>
          <option value="DONE">Thành công</option>
          <option value="FAILED">Thất bại</option>
          <option value="RUNNING">Đang chạy</option>
        </select>
        <span className="text-xs text-gray-400 ml-auto">{filtered.length} phiên</span>
      </div>

      {/* Table */}
      <div className="glass-card rounded-2xl shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50/60">
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Thời gian</th>
              <th className="text-center px-3 py-3 text-xs font-semibold text-gray-500">Trạng thái</th>
              <th className="text-center px-3 py-3 text-xs font-semibold text-gray-500">Bài crawl</th>
              <th className="text-center px-3 py-3 text-xs font-semibold text-gray-500">Lead mới</th>
              <th className="text-center px-3 py-3 text-xs font-semibold text-gray-500">Loại bỏ</th>
              <th className="text-center px-3 py-3 text-xs font-semibold text-gray-500">Trùng</th>
              <th className="text-center px-3 py-3 text-xs font-semibold text-gray-500">Chi phí</th>
              <th className="px-3 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filtered.length === 0 ? (
              <tr><td colSpan={8} className="text-center py-12 text-gray-400">Không có phiên scan nào</td></tr>
            ) : filtered.map((s) => {
              const totalCost = (s.apifyCostUsd ?? 0) + (s.aiCostUsd ?? 0)
              const hasCost = s.apifyCostUsd != null
              const duration = s.endedAt
                ? Math.round((new Date(s.endedAt).getTime() - new Date(s.startedAt).getTime()) / 1000)
                : null

              return (
                <tr
                  key={s.id}
                  className="hover:bg-indigo-50/40 cursor-pointer transition-colors group"
                  onClick={() => router.push(`/leads?sessionId=${s.id}${s.jobId ? `&jobId=${s.jobId}` : ''}`)}
                >
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-800">
                      {new Date(s.startedAt).toLocaleString('vi-VN')}
                    </p>
                    <p className="text-xs text-gray-400">
                      {formatDistanceToNow(new Date(s.startedAt), { addSuffix: true, locale: vi })}
                      {duration ? ` · ${duration}s` : ''}
                      {s.job && <span className="ml-1" style={{ color: s.job.color }}>· {s.job.name}</span>}
                    </p>
                  </td>
                  <td className="px-3 py-3 text-center">
                    {s.status === 'DONE' ? (
                      <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded-full font-medium min-w-[72px] justify-center">
                        <CheckCircle className="w-3 h-3" /> Xong
                      </span>
                    ) : s.status === 'FAILED' ? (
                      <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 bg-red-100 text-red-600 rounded-full font-medium min-w-[72px] justify-center">
                        <XCircle className="w-3 h-3" /> Lỗi
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 bg-blue-100 text-blue-600 rounded-full font-medium min-w-[72px] justify-center">
                        <Clock className="w-3 h-3" /> Đang chạy
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-3 text-center font-medium text-gray-700">{s.totalPosts}</td>
                  <td className="px-3 py-3 text-center">
                    <span className={`font-bold ${s.totalLeads > 0 ? 'text-green-600' : 'text-gray-400'}`}>{s.totalLeads}</span>
                  </td>
                  <td className="px-3 py-3 text-center text-red-400 font-medium">{s.totalRejected}</td>
                  <td className="px-3 py-3 text-center text-yellow-500 font-medium">{s.totalDuplicated}</td>
                  <td className="px-3 py-3 text-center">
                    {hasCost ? (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          const rect = (e.target as HTMLElement).getBoundingClientRect()
                          setTooltipPos({ x: rect.left + rect.width / 2, y: rect.top })
                          setCostTooltip(costTooltip === s.id ? null : s.id)
                        }}
                        className="inline-flex items-center gap-0.5 text-indigo-600 font-semibold hover:text-indigo-800 underline decoration-dotted"
                      >
                        <DollarSign className="w-3 h-3" />{totalCost.toFixed(3)}
                      </button>
                    ) : (
                      <span className="text-gray-300 text-xs">—</span>
                    )}
                  </td>
                  <td className="px-3 py-3 text-right">
                    {s.totalLeads > 0 && (
                      <span className="inline-flex items-center gap-1 text-xs text-indigo-500 group-hover:text-indigo-700 font-medium">
                        <Users className="w-3 h-3" />{s.totalLeads}
                        <ChevronRight className="w-3 h-3" />
                      </span>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Fixed tooltip rendered outside table to avoid overflow clipping */}
      {costTooltip && (() => {
        const s = sessions.find((x) => x.id === costTooltip)
        if (!s || s.apifyCostUsd == null) return null
        const total = (s.apifyCostUsd ?? 0) + (s.aiCostUsd ?? 0)
        return (
          <div
            className="fixed z-[9999] bg-gray-900 text-white text-xs rounded-xl p-3 w-56 shadow-2xl pointer-events-none"
            style={{ left: tooltipPos.x - 112, top: tooltipPos.y - 150 }}
          >
            <p className="font-semibold mb-2 text-gray-200 border-b border-gray-700 pb-1.5">Chi tiết chi phí</p>
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <span className="text-orange-400 font-medium">Apify</span>
                <span className="font-semibold">${(s.apifyCostUsd ?? 0).toFixed(4)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-blue-400 font-medium">GPT-4o-mini <span className="text-gray-500">(ước tính)</span></span>
                <span className="font-semibold">${(s.aiCostUsd ?? 0).toFixed(4)}</span>
              </div>
              <div className="flex justify-between items-center border-t border-gray-700 pt-1.5 font-bold">
                <span className="text-white">Tổng</span>
                <span className="text-indigo-300">${total.toFixed(4)}</span>
              </div>
              <div className="flex justify-between items-center text-gray-400">
                <span>≈ VNĐ</span>
                <span>{Math.round(total * 25400).toLocaleString('vi-VN')}đ</span>
              </div>
            </div>
          </div>
        )
      })()}
    </div>
  )
}
