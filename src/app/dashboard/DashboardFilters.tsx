'use client'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'

const RANGES = [
  { value: 'today', label: 'Hôm nay' },
  { value: '7d', label: '7 ngày' },
  { value: '30d', label: '30 ngày' },
  { value: 'all', label: 'Tất cả' },
]

interface Job { id: string; name: string; color: string }

export function DashboardFilters({
  currentRange,
  jobs,
  currentJobId,
}: {
  currentRange: string
  jobs: Job[]
  currentJobId: string
}) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const navigate = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set(key, value)
    router.push(`${pathname}?${params.toString()}`)
  }

  return (
    <div className="flex items-center gap-3">
      {jobs.length > 1 && (
        <select
          value={currentJobId}
          onChange={(e) => navigate('jobId', e.target.value)}
          className="rounded-xl border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
        >
          <option value="all">Tất cả Jobs</option>
          {jobs.map((j) => (
            <option key={j.id} value={j.id}>{j.name}</option>
          ))}
        </select>
      )}

      <div className="flex items-center gap-1 bg-gray-100 rounded-xl p-1">
        {RANGES.map((r) => (
          <button
            key={r.value}
            onClick={() => navigate('range', r.value)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
              currentRange === r.value
                ? 'bg-white text-indigo-600 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {r.label}
          </button>
        ))}
      </div>
    </div>
  )
}
