'use client'
import { useState } from 'react'
import { LeadRow } from './LeadRow'
import { CheckCircle, XCircle, ExternalLink, Handshake, Edit2, Check, X } from 'lucide-react'

interface Lead {
  id: string; userName: string | null; userProfileUrl: string | null; postUrl: string | null
  postText: string; hinhThucCast: string | null; sanPhamDichVu: string | null
  soLuongCanBook: string | null; nganSach: string | null; sdtLienHe: string | null
  message: string | null; confidence: number; reason: string | null
  rejectReason: string | null; status: string
}

interface LeadPreviewTableProps {
  leads: Lead[]
  selectedIds: string[]
  onSelectChange: (ids: string[]) => void
  onApprove: (id: string) => void
  onReject: (id: string) => void
  onClose: (id: string) => void
  onMessageEdit: (id: string, message: string) => void
  onFieldEdit: (id: string, field: 'nganSach' | 'soLuongCanBook', val: string) => void
}

const statusBadge: Record<string, string> = {
  AI_FILTERED: 'bg-blue-100 text-blue-700 border border-blue-200',
  NEED_REVIEW: 'bg-amber-100 text-amber-700 border border-amber-200',
  APPROVED: 'bg-emerald-100 text-emerald-700 border border-emerald-200',
  REJECTED: 'bg-red-100 text-red-600 border border-red-200',
  DUPLICATED: 'bg-gray-100 text-gray-600 border border-gray-200',
  CLOSED: 'bg-violet-100 text-violet-700 border border-violet-200',
}
const statusLabel: Record<string, string> = {
  AI_FILTERED: 'AI Lọc', NEED_REVIEW: 'Cần duyệt', APPROVED: 'Approved',
  REJECTED: 'Rejected', DUPLICATED: 'Trùng', CLOSED: 'Hợp tác',
}

function MobileInlineEdit({ label, value, onSave, placeholder }: { label: string; value: string | null; onSave: (v: string) => void; placeholder?: string }) {
  const [editing, setEditing] = useState(false)
  const [val, setVal] = useState(value ?? '')
  return (
    <div className="bg-gray-50 rounded-xl p-2.5">
      <p className="text-xs text-gray-500 mb-0.5">{label}</p>
      {editing ? (
        <div className="flex items-center gap-1.5">
          <input autoFocus value={val} onChange={(e) => setVal(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { onSave(val); setEditing(false) } if (e.key === 'Escape') setEditing(false) }}
            className="flex-1 text-sm border border-indigo-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-indigo-400 bg-white" />
          <button onClick={() => { onSave(val); setEditing(false) }} className="text-emerald-600"><Check className="w-4 h-4" /></button>
          <button onClick={() => setEditing(false)} className="text-red-400"><X className="w-4 h-4" /></button>
        </div>
      ) : (
        <div className="flex items-center justify-between gap-1 cursor-pointer group" onClick={() => setEditing(true)}>
          <p className="text-sm font-medium text-gray-900">{value || <span className="text-gray-400 italic text-xs">{placeholder || 'Chạm để nhập'}</span>}</p>
          <Edit2 className="w-3.5 h-3.5 text-gray-300 opacity-0 group-hover:opacity-100 flex-shrink-0" />
        </div>
      )}
    </div>
  )
}

function MobileLeadCard({ lead, selected, onSelect, onApprove, onReject, onClose, onMessageEdit, onFieldEdit }: {
  lead: Lead; selected: boolean; onSelect: () => void
  onApprove: () => void; onReject: () => void; onClose: () => void
  onMessageEdit: (msg: string) => void
  onFieldEdit: (field: 'nganSach' | 'soLuongCanBook', val: string) => void
}) {
  const [editingMsg, setEditingMsg] = useState(false)
  const [msgValue, setMsgValue] = useState(lead.message ?? '')
  const [expanded, setExpanded] = useState(false)

  return (
    <div className={`animate-fade-in-up rounded-2xl border p-4 shadow-sm transition-all ${selected ? 'border-indigo-300 bg-indigo-50' : 'border-gray-100 bg-white'}`}>
      {/* Header */}
      <div className="flex items-start gap-3">
        <input type="checkbox" checked={selected} onChange={onSelect}
          className="mt-1 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 flex-shrink-0" />
        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
          {(lead.userName || '?')[0].toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-semibold text-gray-900 text-sm">{lead.userName || 'Ẩn danh'}</p>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusBadge[lead.status] ?? 'bg-gray-100 text-gray-600'}`}>
              {statusLabel[lead.status] ?? lead.status}
            </span>
          </div>
          <div className="flex gap-2 mt-0.5 flex-wrap">
            {lead.userProfileUrl && (
              <a href={lead.userProfileUrl} target="_blank" rel="noopener noreferrer"
                className="text-xs text-indigo-500 hover:underline flex items-center gap-0.5">
                Facebook <ExternalLink className="w-2.5 h-2.5" />
              </a>
            )}
            {lead.postUrl && (
              <a href={lead.postUrl} target="_blank" rel="noopener noreferrer"
                className="text-xs text-indigo-500 hover:underline flex items-center gap-0.5">
                Bài đăng <ExternalLink className="w-2.5 h-2.5" />
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Info grid */}
      <div className="mt-3 grid grid-cols-2 gap-2">
        <div className="bg-gray-50 rounded-xl p-2.5">
          <p className="text-xs text-gray-500 mb-0.5">Hình thức</p>
          <p className="text-sm font-medium text-gray-900">{lead.hinhThucCast || '—'}</p>
        </div>
        <div className="bg-gray-50 rounded-xl p-2.5">
          <p className="text-xs text-gray-500 mb-0.5">Sản phẩm</p>
          <p className="text-sm font-medium text-gray-900 break-words">{lead.sanPhamDichVu || '—'}</p>
        </div>
        {lead.sdtLienHe && (
          <div className="bg-blue-50 rounded-xl p-2.5 col-span-2">
            <p className="text-xs text-gray-500 mb-0.5">SĐT / Zalo</p>
            <p className="text-sm font-semibold text-blue-700 font-mono">{lead.sdtLienHe}</p>
          </div>
        )}
        <MobileInlineEdit label="Số lượng" value={lead.soLuongCanBook} onSave={(v) => onFieldEdit('soLuongCanBook', v)} placeholder="Chạm để nhập" />
        <MobileInlineEdit label="Ngân sách" value={lead.nganSach} onSave={(v) => onFieldEdit('nganSach', v)} placeholder="Chạm để nhập" />
      </div>

      {/* Message */}
      <div className="mt-3 bg-gray-50 rounded-xl p-3">
        <div className="flex items-center justify-between mb-1.5">
          <p className="text-xs font-medium text-gray-700">Tin nhắn gợi ý</p>
          {!editingMsg && (
            <button onClick={() => setEditingMsg(true)} className="text-gray-400 hover:text-indigo-500 transition-colors">
              <Edit2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
        {editingMsg ? (
          <div className="space-y-2">
            <textarea value={msgValue} onChange={(e) => setMsgValue(e.target.value)}
              className="text-sm border border-gray-200 rounded-lg p-2 w-full resize-none focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white"
              rows={3} />
            <div className="flex gap-2">
              <button onClick={() => { onMessageEdit(msgValue); setEditingMsg(false) }}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-100 text-emerald-700 text-xs font-medium hover:bg-emerald-200 transition-colors">
                <Check className="w-3 h-3" /> Lưu
              </button>
              <button onClick={() => setEditingMsg(false)}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-red-50 text-red-600 text-xs font-medium hover:bg-red-100 transition-colors">
                <X className="w-3 h-3" /> Huỷ
              </button>
            </div>
          </div>
        ) : (
          <p className="text-sm text-gray-800 leading-relaxed">
            {lead.message || <span className="text-gray-400 italic text-xs">Chưa có tin nhắn</span>}
          </p>
        )}
      </div>

      {/* Expandable post */}
      <button onClick={() => setExpanded(!expanded)}
        className="mt-2 text-xs text-indigo-500 hover:text-indigo-700 font-medium transition-colors">
        {expanded ? '▲ Ẩn nội dung bài' : '▼ Xem nội dung bài'}
      </button>
      {expanded && (
        <div className="mt-2 text-xs text-gray-700 bg-gray-50 rounded-xl p-3 max-h-32 overflow-y-auto whitespace-pre-wrap leading-relaxed border border-gray-100">
          {lead.postText}
          {(lead.reason || lead.rejectReason) && (
            <p className="text-indigo-500 mt-2 italic">AI: {lead.reason || lead.rejectReason}</p>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="mt-3 flex gap-2">
        {lead.status !== 'APPROVED' && lead.status !== 'CLOSED' && (
          <button onClick={onApprove}
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-emerald-50 text-emerald-700 text-sm font-medium hover:bg-emerald-100 active:scale-95 transition-all border border-emerald-100">
            <CheckCircle className="w-4 h-4" /> Approve
          </button>
        )}
        {lead.status !== 'CLOSED' && (
          <button onClick={onClose}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-medium active:scale-95 transition-all ${
              lead.status === 'APPROVED'
                ? 'bg-violet-600 text-white hover:bg-violet-700 border border-violet-600 shadow-md'
                : 'bg-violet-50 text-violet-700 hover:bg-violet-100 border border-violet-100'
            }`}>
            <Handshake className="w-4 h-4" /> Hợp tác
          </button>
        )}
        {lead.status !== 'REJECTED' && lead.status !== 'CLOSED' && (
          <button onClick={onReject}
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-red-50 text-red-600 text-sm font-medium hover:bg-red-100 active:scale-95 transition-all border border-red-100">
            <XCircle className="w-4 h-4" /> Reject
          </button>
        )}
      </div>
    </div>
  )
}

export function LeadPreviewTable({
  leads, selectedIds, onSelectChange, onApprove, onReject, onClose, onMessageEdit, onFieldEdit
}: LeadPreviewTableProps) {
  const toggleSelect = (id: string) => {
    onSelectChange(
      selectedIds.includes(id) ? selectedIds.filter((s) => s !== id) : [...selectedIds, id]
    )
  }

  return (
    <>
      {/* Mobile: card list */}
      <div className="md:hidden space-y-3">
        {leads.map((lead) => (
          <MobileLeadCard
            key={lead.id}
            lead={lead}
            selected={selectedIds.includes(lead.id)}
            onSelect={() => toggleSelect(lead.id)}
            onApprove={() => onApprove(lead.id)}
            onReject={() => onReject(lead.id)}
            onClose={() => onClose(lead.id)}
            onMessageEdit={(msg) => onMessageEdit(lead.id, msg)}
            onFieldEdit={(field, val) => onFieldEdit(lead.id, field, val)}
          />
        ))}
      </div>

      {/* Desktop: table */}
      <div className="hidden md:block glass-card rounded-2xl overflow-hidden shadow-sm animate-fade-in">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gradient-to-r from-indigo-50/80 to-purple-50/80 border-b border-white/60">
                <th className="px-4 py-3 text-left w-8"></th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wide">Người đăng</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wide">Hình thức</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wide">Sản phẩm</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wide">SĐT</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wide">Số lượng</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wide">Ngân sách</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wide">Tin nhắn</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wide">Trạng thái</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wide">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100/60">
              {leads.map((lead) => (
                <LeadRow
                  key={lead.id}
                  lead={lead}
                  selected={selectedIds.includes(lead.id)}
                  onSelect={() => toggleSelect(lead.id)}
                  onApprove={() => onApprove(lead.id)}
                  onReject={() => onReject(lead.id)}
                  onClose={() => onClose(lead.id)}
                  onMessageEdit={(msg) => onMessageEdit(lead.id, msg)}
                  onFieldEdit={(field, val) => onFieldEdit(lead.id, field, val)}
                />
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  )
}
