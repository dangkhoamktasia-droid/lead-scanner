'use client'
import { useState } from 'react'
import { CheckCircle, XCircle, Edit2, ExternalLink, Check, X, Handshake } from 'lucide-react'

interface Lead {
  id: string; userName: string | null; userProfileUrl: string | null; postUrl: string | null
  postText: string; hinhThucCast: string | null; sanPhamDichVu: string | null
  soLuongCanBook: string | null; nganSach: string | null; sdtLienHe: string | null
  message: string | null; confidence: number; reason: string | null
  rejectReason: string | null; status: string
}

const statusBadge: Record<string, string> = {
  AI_FILTERED: 'bg-blue-100 text-blue-700 border border-blue-200',
  NEED_REVIEW: 'bg-amber-100 text-amber-700 border border-amber-200',
  APPROVED: 'bg-emerald-100 text-emerald-700 border border-emerald-200',
  REJECTED: 'bg-red-100 text-red-600 border border-red-200',
  DUPLICATED: 'bg-gray-100 text-gray-500 border border-gray-200',
  CLOSED: 'bg-violet-100 text-violet-700 border border-violet-200',
}

const statusLabel: Record<string, string> = {
  AI_FILTERED: 'AI Lọc', NEED_REVIEW: 'Cần duyệt', APPROVED: 'Approved',
  REJECTED: 'Rejected', DUPLICATED: 'Trùng', CLOSED: 'Hợp tác',
}

interface LeadRowProps {
  lead: Lead; selected: boolean; onSelect: () => void
  onApprove: () => void; onReject: () => void; onClose: () => void
  onMessageEdit: (msg: string) => void
  onFieldEdit: (field: 'nganSach' | 'soLuongCanBook', val: string) => void
}

function InlineEdit({ value, onSave, placeholder }: { value: string | null; onSave: (v: string) => void; placeholder?: string }) {
  const [editing, setEditing] = useState(false)
  const [val, setVal] = useState(value ?? '')

  if (editing) return (
    <div className="flex items-center gap-1">
      <input autoFocus value={val} onChange={(e) => setVal(e.target.value)}
        onKeyDown={(e) => { if (e.key === 'Enter') { onSave(val); setEditing(false) } if (e.key === 'Escape') setEditing(false) }}
        className="w-24 text-xs border border-indigo-300 rounded px-1.5 py-1 focus:outline-none focus:ring-1 focus:ring-indigo-400" />
      <button onClick={() => { onSave(val); setEditing(false) }} className="text-emerald-600 hover:text-emerald-700">
        <Check className="w-3 h-3" />
      </button>
      <button onClick={() => setEditing(false)} className="text-red-400 hover:text-red-600">
        <X className="w-3 h-3" />
      </button>
    </div>
  )

  return (
    <div className="flex items-center gap-1 group cursor-pointer" onClick={() => setEditing(true)}>
      <span className="text-xs text-gray-800">{value || <span className="text-gray-300 italic">{placeholder || '—'}</span>}</span>
      <Edit2 className="w-3 h-3 text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
    </div>
  )
}

export function LeadRow({ lead, selected, onSelect, onApprove, onReject, onClose, onMessageEdit, onFieldEdit }: LeadRowProps) {
  const [editingMsg, setEditingMsg] = useState(false)
  const [msgValue, setMsgValue] = useState(lead.message ?? '')
  const [showPost, setShowPost] = useState(false)

  const saveMsg = () => { onMessageEdit(msgValue); setEditingMsg(false) }

  return (
    <>
      <tr className={`transition-colors ${selected ? 'bg-indigo-50/60' : 'hover:bg-white/60'}`}>
        <td className="px-4 py-3">
          <input type="checkbox" checked={selected} onChange={onSelect}
            className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
        </td>
        <td className="px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
              {(lead.userName || '?')[0].toUpperCase()}
            </div>
            <div>
              <p className="font-medium text-gray-900 text-xs">{lead.userName || '—'}</p>
              <div className="flex gap-2 mt-0.5">
                {lead.userProfileUrl && (
                  <a href={lead.userProfileUrl} target="_blank" rel="noopener noreferrer"
                    className="text-xs text-indigo-500 hover:underline flex items-center gap-0.5">
                    FB <ExternalLink className="w-2.5 h-2.5" />
                  </a>
                )}
                {lead.postUrl && (
                  <a href={lead.postUrl} target="_blank" rel="noopener noreferrer"
                    className="text-xs text-indigo-500 hover:underline flex items-center gap-0.5">
                    Bài <ExternalLink className="w-2.5 h-2.5" />
                  </a>
                )}
              </div>
              <button onClick={() => setShowPost(!showPost)} className="text-xs text-gray-500 hover:text-indigo-500 mt-0.5 transition-colors">
                {showPost ? 'Ẩn' : 'Xem bài'}
              </button>
            </div>
          </div>
        </td>
        <td className="px-4 py-3">
          <span className="text-xs text-gray-700 bg-gray-100 px-2 py-0.5 rounded-full">{lead.hinhThucCast || '—'}</span>
        </td>
        <td className="px-4 py-3 text-xs text-gray-900 font-medium">
          <div className="max-w-[160px] break-words whitespace-normal leading-relaxed">{lead.sanPhamDichVu || '—'}</div>
        </td>
        <td className="px-4 py-3 text-xs text-gray-700 font-mono">{lead.sdtLienHe || '—'}</td>
        {/* Số lượng — editable */}
        <td className="px-4 py-3">
          <InlineEdit value={lead.soLuongCanBook} onSave={(v) => onFieldEdit('soLuongCanBook', v)} placeholder="Nhập SL" />
        </td>
        {/* Ngân sách — editable */}
        <td className="px-4 py-3">
          <InlineEdit value={lead.nganSach} onSave={(v) => onFieldEdit('nganSach', v)} placeholder="Nhập NS" />
        </td>
        <td className="px-4 py-3 max-w-44">
          {editingMsg ? (
            <div className="flex flex-col gap-1">
              <textarea value={msgValue} onChange={(e) => setMsgValue(e.target.value)}
                className="text-xs border border-gray-200 rounded-lg p-2 w-full resize-none focus:outline-none focus:ring-2 focus:ring-indigo-400"
                rows={3} />
              <div className="flex gap-1">
                <button onClick={saveMsg} className="p-1 rounded bg-emerald-100 text-emerald-600 hover:bg-emerald-200"><Check className="w-3 h-3" /></button>
                <button onClick={() => setEditingMsg(false)} className="p-1 rounded bg-red-100 text-red-500 hover:bg-red-200"><X className="w-3 h-3" /></button>
              </div>
            </div>
          ) : (
            <div className="flex items-start gap-1 group">
              <p className="text-xs text-gray-700 line-clamp-2 flex-1">{lead.message || <span className="text-gray-300 italic">Chưa có</span>}</p>
              <button onClick={() => setEditingMsg(true)}
                className="text-gray-300 hover:text-indigo-500 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                <Edit2 className="w-3 h-3" />
              </button>
            </div>
          )}
        </td>
        <td className="px-4 py-3">
          <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${statusBadge[lead.status] ?? 'bg-gray-100 text-gray-600'}`}>
            {statusLabel[lead.status] ?? lead.status}
          </span>
        </td>
        <td className="px-4 py-3">
          <div className="flex gap-1">
            {lead.status !== 'APPROVED' && lead.status !== 'CLOSED' && (
              <button onClick={onApprove} title="Approve"
                className="p-1.5 rounded-lg hover:bg-emerald-100 text-emerald-500 hover:text-emerald-700 transition-colors">
                <CheckCircle className="w-4 h-4" />
              </button>
            )}
            {lead.status !== 'CLOSED' && (
              <button onClick={onClose} title="Hợp tác"
                className={`rounded-lg transition-colors flex items-center gap-1 ${
                  lead.status === 'APPROVED'
                    ? 'px-2.5 py-1.5 bg-violet-100 text-violet-700 hover:bg-violet-200 font-medium text-xs'
                    : 'p-1.5 hover:bg-violet-100 text-violet-400 hover:text-violet-700'
                }`}>
                <Handshake className="w-4 h-4 flex-shrink-0" />
                {lead.status === 'APPROVED' && <span>Hợp tác</span>}
              </button>
            )}
            {lead.status !== 'REJECTED' && lead.status !== 'CLOSED' && (
              <button onClick={onReject} title="Reject"
                className="p-1.5 rounded-lg hover:bg-red-100 text-red-400 hover:text-red-600 transition-colors">
                <XCircle className="w-4 h-4" />
              </button>
            )}
          </div>
        </td>
      </tr>
      {showPost && (
        <tr className={selected ? 'bg-indigo-50/40' : 'bg-gray-50/60'}>
          <td colSpan={10} className="px-6 pb-4 pt-1">
            <div className="text-xs text-gray-700 bg-white/80 border border-gray-100 rounded-xl p-3 max-h-40 overflow-y-auto whitespace-pre-wrap shadow-inner">
              {lead.postText}
            </div>
            {(lead.reason || lead.rejectReason) && (
              <p className="text-xs text-indigo-400 mt-1.5 italic pl-1">
                AI: {lead.reason || lead.rejectReason}
              </p>
            )}
          </td>
        </tr>
      )}
    </>
  )
}
