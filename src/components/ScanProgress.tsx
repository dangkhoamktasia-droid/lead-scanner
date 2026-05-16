import { CheckCircle, XCircle, Loader2, Clock } from 'lucide-react'

interface GroupResult {
  id: string
  groupId: string
  status: string
  postsFound: number
  leadsFound: number
  errorMessage?: string | null
  group: { name: string }
}

interface ScanProgressProps {
  session: {
    id: string
    status: string
    totalPosts: number
    totalLeads: number
    totalDuplicated: number
    totalRejected: number
    scanGroupResults: GroupResult[]
  }
}

const StatusIcon = ({ status }: { status: string }) => {
  if (status === 'DONE') return <CheckCircle className="w-4 h-4 text-green-500" />
  if (status === 'FAILED') return <XCircle className="w-4 h-4 text-red-500" />
  if (status === 'RUNNING') return <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />
  return <Clock className="w-4 h-4 text-gray-400" />
}

export function ScanProgress({ session }: ScanProgressProps) {
  return (
    <div className="bg-white rounded-2xl border p-6 shadow-sm space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-gray-800">Kết quả Scan</h2>
        <span className={`text-xs px-2 py-1 rounded-full font-medium ${
          session.status === 'DONE' ? 'bg-green-100 text-green-700' :
          session.status === 'FAILED' ? 'bg-red-100 text-red-700' :
          'bg-blue-100 text-blue-700'
        }`}>
          {session.status}
        </span>
      </div>

      <div className="grid grid-cols-4 gap-3">
        <div className="text-center p-3 bg-gray-50 rounded-lg">
          <p className="text-2xl font-bold text-gray-800">{session.totalPosts}</p>
          <p className="text-xs text-gray-500">Tổng bài</p>
        </div>
        <div className="text-center p-3 bg-green-50 rounded-lg">
          <p className="text-2xl font-bold text-green-700">{session.totalLeads}</p>
          <p className="text-xs text-gray-500">Lead tiềm năng</p>
        </div>
        <div className="text-center p-3 bg-yellow-50 rounded-lg">
          <p className="text-2xl font-bold text-yellow-700">{session.totalDuplicated}</p>
          <p className="text-xs text-gray-500">Trùng lặp</p>
        </div>
        <div className="text-center p-3 bg-red-50 rounded-lg">
          <p className="text-2xl font-bold text-red-700">{session.totalRejected}</p>
          <p className="text-xs text-gray-500">Loại bỏ</p>
        </div>
      </div>

      <div className="space-y-2">
        {session.scanGroupResults.map((r) => (
          <div key={r.id} className="flex items-center gap-3 text-sm p-2 rounded-lg bg-gray-50">
            <StatusIcon status={r.status} />
            <span className="flex-1 text-gray-700 truncate">{r.group.name}</span>
            {r.status === 'DONE' && (
              <span className="text-xs text-gray-500">{r.postsFound} bài · {r.leadsFound} lead</span>
            )}
            {r.status === 'FAILED' && (
              <span className="text-xs text-red-500 truncate max-w-40">{r.errorMessage}</span>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
