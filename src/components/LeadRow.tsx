'use client'
import { useState } from 'react'
import { CheckCircle, XCircle, Edit2, ExternalLink, Check, X } from 'lucide-react'

interface Lead {
  id: string; userName: string | null; userProfileUrl: string | null; postUrl: string | null
  postText: string; hinhThucCast: string | null; sanPhamDichVu: string | null
  soLuongCanBook: string | null; sdtLienHe: string | null; message: string | null
  confidence: number; reason: string | null; rejectReason: string | null; status: string
}

const statusBadge: Record<string, string> = {
  AI_FILTERED: 'bg-blue-100 text-blue-700',
  NEED_REVIEW: 'bg-yellow-100 text-yellow-700',
  APPROVED: 'bg-green-100 text-green-700',
  REJECTED: 'bg-red-100 text-red-700',
  DUPLICATED: 'bg-gray-100 text-gray-500',
  SYNCED_TO_SHEET: 'bg-purple-100 text-purple-700',
}

const statusLabel: Record<string, string> = {
  AI_FILTERED: 'AI Lọc',
  NEED_REVIEW: 'Cần duyệt',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
  DUPLICATED: 'Trùng',
  SYNCED_TO_SHEET: 'Đã sync',
}

interface LeadRowProps {
  lead: Lead
  selected: boolean
  onSelect: () => void
  onApprove: () => void
  onReject: () => void
  onMessageEdit: (msg: string) => void
}

export function LeadRow({ lead, selected, onSelect, onApprove, onReject, onMessageEdit }: LeadRowProps) {
  const [editingMsg, setEditingMsg] = useState(false)
  const [msgValue, setMsgValue] = useState(lead.message ?? '')
  const [showPost, setShowPost] = useState(false)

  const confidencePct = Math.round(lead.confidence * 100)
  const confColor = lead.confidence >= 0.85 ? 'text-green-600' : lead.confidence >= 0.6 ? 'text-yellow-600' : 'text-red-500'

  const saveMsg = () => {
    onMessageEdit(msgValue)
    setEditingMsg(false)
  }

  return (
    <>
      <tr className={`hover:bg-gray-50 ${selected ? 'bg-indigo-50' : ''}`}>
        <td className="px-3 py-3">
          <input type="checkbox" checked={selected} onChange={onSelect} className="rounded" />
        </td>
        <td className="px-3 py-3">
          <div>
            <p className="font-medium text-gray-800 text-xs">{lead.userName || '—'}</p>
            {lead.userProfileUrl && (
              <a href={lead.userProfileUrl} target="_blank" rel="noopener noreferrer"
                className="text-xs text-indigo-500 hover:underline flex items-center gap-0.5">
                FB <ExternalLink className="w-3 h-3" />
              </a>
            )}
            {lead.postUrl && (
              <a href={lead.postUrl} target="_blank" rel="noopener noreferrer"
                className="text-xs text-indigo-500 hover:underline flex items-center gap-0.5">
                Bài <ExternalLink className="w-3 h-3" />
              </a>
            )}
            <button onClick={() => setShowPost(!showPost)} className="text-xs text-gray-400 hover:text-gray-600 mt-0.5">
              {showPost ? 'Ẩn' : 'Xem nội dung'}
            </button>
          </div>
        </td>
        <td className="px-3 py-3 text-xs text-gray-600">{lead.hinhThucCast || '—'}</td>
        <td className="px-3 py-3 text-xs text-gray-600 max-w-32 truncate">{lead.sanPhamDichVu || '—'}</td>
        <td className="px-3 py-3 text-xs text-gray-600">{lead.sdtLienHe || '—'}</td>
        <td className="px-3 py-3">
          <span className={`font-bold text-sm ${confColor}`}>{confidencePct}%</span>
        </td>
        <td className="px-3 py-3 max-w-48">
          {editingMsg ? (
            <div className="flex flex-col gap-1">
              <textarea
                value={msgValue}
                onChange={(e) => setMsgValue(e.target.value)}
                className="text-xs border rounded p-1 w-full resize-none"
                rows={3}
              />
              <div className="flex gap-1">
                <button onClick={saveMsg} className="text-green-600 hover:text-green-800"><Check className="w-4 h-4" /></button>
                <button onClick={() => setEditingMsg(false)} className="text-red-500 hover:text-red-700"><X className="w-4 h-4" /></button>
              </div>
            </div>
          ) : (
            <div className="flex items-start gap-1">
              <p className="text-xs text-gray-600 line-clamp-2 flex-1">{lead.message || '—'}</p>
              <button onClick={() => setEditingMsg(true)} className="text-gray-400 hover:text-gray-600 flex-shrink-0">
                <Edit2 className="w-3 h-3" />
              </button>
            </div>
          )}
        </td>
        <td className="px-3 py-3">
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusBadge[lead.status] ?? 'bg-gray-100 text-gray-500'}`}>
            {statusLabel[lead.status] ?? lead.status}
          </span>
        </td>
        <td className="px-3 py-3">
          <div className="flex gap-1">
            {lead.status !== 'APPROVED' && (
              <button onClick={onApprove} title="Approve" className="p-1 rounded hover:bg-green-50 text-green-600 hover:text-green-800">
                <CheckCircle className="w-4 h-4" />
              </button>
            )}
            {lead.status !== 'REJECTED' && (
              <button onClick={onReject} title="Reject" className="p-1 rounded hover:bg-red-50 text-red-500 hover:text-red-700">
                <XCircle className="w-4 h-4" />
              </button>
            )}
          </div>
        </td>
      </tr>
      {showPost && (
        <tr className={selected ? 'bg-indigo-50' : 'bg-gray-50'}>
          <td colSpan={9} className="px-6 pb-3">
            <div className="text-xs text-gray-600 bg-white border rounded p-3 max-h-40 overflow-y-auto whitespace-pre-wrap">
              {lead.postText}
            </div>
            {(lead.reason || lead.rejectReason) && (
              <p className="text-xs text-gray-400 mt-1 italic">
                AI: {lead.reason || lead.rejectReason}
              </p>
            )}
          </td>
        </tr>
      )}
    </>
  )
}
