import { LeadRow } from './LeadRow'

interface Lead {
  id: string; userName: string | null; userProfileUrl: string | null; postUrl: string | null
  postText: string; hinhThucCast: string | null; sanPhamDichVu: string | null
  soLuongCanBook: string | null; sdtLienHe: string | null; message: string | null
  confidence: number; reason: string | null; rejectReason: string | null; status: string
}

interface LeadPreviewTableProps {
  leads: Lead[]
  selectedIds: string[]
  onSelectChange: (ids: string[]) => void
  onApprove: (id: string) => void
  onReject: (id: string) => void
  onMessageEdit: (id: string, message: string) => void
}

export function LeadPreviewTable({
  leads, selectedIds, onSelectChange, onApprove, onReject, onMessageEdit
}: LeadPreviewTableProps) {
  const toggleSelect = (id: string) => {
    onSelectChange(
      selectedIds.includes(id) ? selectedIds.filter((s) => s !== id) : [...selectedIds, id]
    )
  }

  return (
    <div className="glass-card rounded-2xl overflow-hidden shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gradient-to-r from-indigo-50/80 to-purple-50/80 border-b border-white/60">
              <th className="px-4 py-3 text-left w-8"></th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Người đăng</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Hình thức</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Sản phẩm</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">SĐT</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide w-20">AI %</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Tin nhắn</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Trạng thái</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Thao tác</th>
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
                onMessageEdit={(msg) => onMessageEdit(lead.id, msg)}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
