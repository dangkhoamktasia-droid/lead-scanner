import { prisma } from '@/lib/prisma'
import { formatDistanceToNow } from 'date-fns'
import { vi } from 'date-fns/locale'
import { CheckCircle, XCircle, Clock } from 'lucide-react'

export default async function ScanHistoryPage() {
  const sessions = await prisma.scanSession.findMany({
    orderBy: { startedAt: 'desc' },
    take: 50,
    include: {
      scanGroupResults: { include: { group: true } },
    },
  })

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Scan History</h1>
        <p className="text-gray-500 text-sm mt-1">{sessions.length} phiên quét gần đây</p>
      </div>

      {sessions.length === 0 ? (
        <div className="text-center py-12 text-gray-400">Chưa có phiên scan nào</div>
      ) : (
        <div className="space-y-4">
          {sessions.map((session) => {
            const duration = session.endedAt
              ? Math.round((session.endedAt.getTime() - session.startedAt.getTime()) / 1000)
              : null
            return (
              <div key={session.id} className="bg-white rounded-xl border p-5 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    {session.status === 'DONE' ? (
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    ) : session.status === 'FAILED' ? (
                      <XCircle className="w-5 h-5 text-red-500" />
                    ) : (
                      <Clock className="w-5 h-5 text-blue-500" />
                    )}
                    <div>
                      <p className="font-medium text-gray-800 text-sm">
                        {new Date(session.startedAt).toLocaleString('vi-VN')}
                      </p>
                      <p className="text-xs text-gray-400">
                        {formatDistanceToNow(new Date(session.startedAt), { addSuffix: true, locale: vi })}
                        {duration ? ` · ${duration}s` : ''}
                      </p>
                    </div>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                    session.status === 'DONE' ? 'bg-green-100 text-green-700' :
                    session.status === 'FAILED' ? 'bg-red-100 text-red-700' :
                    'bg-blue-100 text-blue-700'
                  }`}>
                    {session.status}
                  </span>
                </div>

                <div className="grid grid-cols-6 gap-3 mb-4">
                  {[
                    { label: 'Bài crawl', value: session.totalPosts },
                    { label: 'Lead tìm được', value: session.totalLeads, color: 'text-green-600' },
                    { label: 'Loại bỏ', value: session.totalRejected, color: 'text-red-500' },
                    { label: 'Trùng lặp', value: session.totalDuplicated, color: 'text-yellow-600' },
                    { label: 'Group OK', value: session.successGroups, color: 'text-green-600' },
                    { label: 'Group lỗi', value: session.failedGroups, color: 'text-red-500' },
                  ].map((stat) => (
                    <div key={stat.label} className="text-center p-2 bg-gray-50 rounded-lg">
                      <p className={`text-xl font-bold ${stat.color ?? 'text-gray-800'}`}>{stat.value}</p>
                      <p className="text-xs text-gray-500">{stat.label}</p>
                    </div>
                  ))}
                </div>

                {session.scanGroupResults.some((r) => r.status === 'FAILED') && (
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-red-600">Groups lỗi:</p>
                    {session.scanGroupResults
                      .filter((r) => r.status === 'FAILED')
                      .map((r) => (
                        <p key={r.id} className="text-xs text-gray-500 pl-2">
                          • {r.group.name}: {r.errorMessage}
                        </p>
                      ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
