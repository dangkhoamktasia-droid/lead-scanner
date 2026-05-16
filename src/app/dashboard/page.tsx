import { prisma } from '@/lib/prisma'
import { ReportCard } from '@/components/ReportCard'
import Link from 'next/link'
import { ArrowRight, Clock, CheckCircle, AlertCircle } from 'lucide-react'

export default async function DashboardPage() {
  const [
    totalLeads,
    pendingLeads,
    approvedLeads,
    syncedLeads,
    rejectedLeads,
    lastSession,
    recentLeads,
  ] = await Promise.all([
    prisma.lead.count({ where: { status: { notIn: ['REJECTED', 'DUPLICATED'] } } }),
    prisma.lead.count({ where: { status: { in: ['AI_FILTERED', 'NEED_REVIEW'] } } }),
    prisma.lead.count({ where: { status: 'APPROVED' } }),
    prisma.lead.count({ where: { status: 'SYNCED_TO_SHEET' } }),
    prisma.lead.count({ where: { status: 'REJECTED' } }),
    prisma.scanSession.findFirst({
      orderBy: { startedAt: 'desc' },
    }),
    prisma.lead.findMany({
      where: { status: { in: ['AI_FILTERED', 'NEED_REVIEW'] } },
      orderBy: { createdAt: 'desc' },
      take: 5,
    }),
  ])

  const nextScanHours = [6, 10, 14, 18, 22]
  const now = new Date()
  const vietnamOffset = 7 * 60
  const vietnamMs = now.getTime() + (vietnamOffset - now.getTimezoneOffset()) * 60000
  const vietnamNow = new Date(vietnamMs)
  const currentHour = vietnamNow.getHours() + vietnamNow.getMinutes() / 60
  const nextHour = nextScanHours.find((h) => h > currentHour) ?? nextScanHours[0]
  const hoursUntilNext = nextHour > currentHour ? nextHour - currentHour : 24 - currentHour + nextScanHours[0]

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500 text-sm mt-1">Quản lý lead booking KOL/KOC</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-500 bg-white border rounded-lg px-3 py-2">
          <Clock className="w-4 h-4 text-indigo-500" />
          <span>Scan tự động lúc <strong>{nextHour}:00</strong> ({hoursUntilNext.toFixed(1)}h nữa)</span>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <ReportCard label="Tổng lead" value={totalLeads} color="blue" />
        <ReportCard label="Chờ duyệt" value={pendingLeads} color="yellow" sub="Cần xem ngay" />
        <ReportCard label="Đã approve" value={approvedLeads} color="green" sub="Chưa sync" />
        <ReportCard label="Đã sync Sheet" value={syncedLeads} color="default" />
        <ReportCard label="Đã loại" value={rejectedLeads} color="red" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent pending leads */}
        <div className="bg-white rounded-2xl border p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-800">Lead mới chờ duyệt</h2>
            <Link href="/leads" className="text-sm text-indigo-600 hover:text-indigo-800 flex items-center gap-1">
              Xem tất cả <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          {recentLeads.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-8">Không có lead mới</p>
          ) : (
            <div className="space-y-3">
              {recentLeads.map((lead) => (
                <div key={lead.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                  <AlertCircle className="w-4 h-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{lead.userName || 'Ẩn danh'}</p>
                    <p className="text-xs text-gray-500 truncate">{lead.hinhThucCast || '—'} · {lead.sanPhamDichVu || '—'}</p>
                    <p className="text-xs text-gray-400">{new Date(lead.createdAt).toLocaleString('vi-VN')}</p>
                  </div>
                  <span className="text-xs font-bold text-indigo-600">{Math.round(lead.confidence * 100)}%</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Last scan info */}
        <div className="bg-white rounded-2xl border p-6 shadow-sm">
          <h2 className="font-semibold text-gray-800 mb-4">Phiên scan gần nhất</h2>
          {!lastSession ? (
            <p className="text-gray-400 text-sm text-center py-8">Chưa có phiên scan nào</p>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                  lastSession.status === 'DONE' ? 'bg-green-100 text-green-700' :
                  lastSession.status === 'FAILED' ? 'bg-red-100 text-red-700' :
                  'bg-blue-100 text-blue-700'
                }`}>{lastSession.status}</span>
                <span className="text-xs text-gray-400">{new Date(lastSession.startedAt).toLocaleString('vi-VN')}</span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-gray-50 rounded-lg text-center">
                  <p className="text-xl font-bold text-gray-800">{lastSession.totalPosts}</p>
                  <p className="text-xs text-gray-500">Bài crawl</p>
                </div>
                <div className="p-3 bg-green-50 rounded-lg text-center">
                  <p className="text-xl font-bold text-green-700">{lastSession.totalLeads}</p>
                  <p className="text-xs text-gray-500">Lead tìm được</p>
                </div>
                <div className="p-3 bg-yellow-50 rounded-lg text-center">
                  <p className="text-xl font-bold text-yellow-700">{lastSession.totalDuplicated}</p>
                  <p className="text-xs text-gray-500">Trùng lặp</p>
                </div>
                <div className="p-3 bg-red-50 rounded-lg text-center">
                  <p className="text-xl font-bold text-red-700">{lastSession.totalRejected}</p>
                  <p className="text-xs text-gray-500">Loại bỏ</p>
                </div>
              </div>
              <Link href="/scan-history" className="text-sm text-indigo-600 hover:text-indigo-800 flex items-center gap-1">
                Xem lịch sử scan <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Cron setup instructions */}
      <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-5">
        <h3 className="font-semibold text-indigo-800 mb-2">Cài đặt scan tự động</h3>
        <p className="text-sm text-indigo-700 mb-3">Dùng <strong>cron-job.org</strong> (miễn phí) để tự động gọi URL scan mỗi 4 giờ:</p>
        <code className="block bg-white border border-indigo-200 rounded-lg px-4 py-2 text-sm text-gray-700 font-mono break-all">
          http://localhost:3000/api/cron?secret=lead-scanner-cron-2024
        </code>
        <p className="text-xs text-indigo-600 mt-2">Schedule: <strong>0 6,10,14,18,22 * * *</strong> (6h, 10h, 14h, 18h, 22h mỗi ngày)</p>
      </div>
    </div>
  )
}
