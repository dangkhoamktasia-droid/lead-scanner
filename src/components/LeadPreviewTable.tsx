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
    <div className="bg-white rounded-xl border overflow-hidden shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-3 py-3 text-left w-8"></th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">Người đăng</th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">Hình thức</th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">Sản phẩm</th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">SĐT</th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase w-20">Conf.</th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tin nhắn</th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
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
