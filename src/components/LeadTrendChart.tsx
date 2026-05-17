'use client'

interface DayPoint {
  date: string   // "DD/MM"
  leads: number
  approved: number
}

interface Props {
  data: DayPoint[]
}

export function LeadTrendChart({ data }: Props) {
  if (data.length === 0) return (
    <div className="flex items-center justify-center h-32 text-gray-300 text-sm">Chưa có dữ liệu</div>
  )

  const W = 520
  const H = 120
  const PAD = { top: 10, right: 8, bottom: 24, left: 28 }
  const innerW = W - PAD.left - PAD.right
  const innerH = H - PAD.top - PAD.bottom

  const maxLeads = Math.max(...data.map((d) => d.leads), 1)

  const xOf = (i: number) => PAD.left + (i / (data.length - 1 || 1)) * innerW
  const yOf = (v: number) => PAD.top + innerH - (v / maxLeads) * innerH

  const leadsPath = data.map((d, i) => `${i === 0 ? 'M' : 'L'}${xOf(i).toFixed(1)},${yOf(d.leads).toFixed(1)}`).join(' ')
  const approvedPath = data.map((d, i) => `${i === 0 ? 'M' : 'L'}${xOf(i).toFixed(1)},${yOf(d.approved).toFixed(1)}`).join(' ')

  const leadsArea = `${leadsPath} L${xOf(data.length - 1).toFixed(1)},${(PAD.top + innerH).toFixed(1)} L${PAD.left},${(PAD.top + innerH).toFixed(1)} Z`
  const approvedArea = `${approvedPath} L${xOf(data.length - 1).toFixed(1)},${(PAD.top + innerH).toFixed(1)} L${PAD.left},${(PAD.top + innerH).toFixed(1)} Z`

  // Y axis ticks
  const yTicks = [0, Math.round(maxLeads / 2), maxLeads]

  // Show every ~3rd label to avoid crowding
  const step = Math.max(1, Math.floor(data.length / 7))

  return (
    <div className="w-full">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: 130 }}>
        <defs>
          <linearGradient id="gradLeads" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#6366f1" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#6366f1" stopOpacity="0.01" />
          </linearGradient>
          <linearGradient id="gradApproved" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#10b981" stopOpacity="0.20" />
            <stop offset="100%" stopColor="#10b981" stopOpacity="0.01" />
          </linearGradient>
        </defs>

        {/* Grid lines */}
        {yTicks.map((t) => (
          <g key={t}>
            <line
              x1={PAD.left} y1={yOf(t).toFixed(1)}
              x2={PAD.left + innerW} y2={yOf(t).toFixed(1)}
              stroke="#e5e7eb" strokeWidth="1" strokeDasharray="3 3"
            />
            <text x={PAD.left - 4} y={yOf(t) + 4} textAnchor="end" fontSize="9" fill="#9ca3af">{t}</text>
          </g>
        ))}

        {/* Area fills */}
        <path d={leadsArea} fill="url(#gradLeads)" />
        <path d={approvedArea} fill="url(#gradApproved)" />

        {/* Lines */}
        <path d={leadsPath} fill="none" stroke="#6366f1" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
        <path d={approvedPath} fill="none" stroke="#10b981" strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" strokeDasharray="4 2" />

        {/* Dots on leads line */}
        {data.map((d, i) => d.leads > 0 && (
          <circle key={i} cx={xOf(i)} cy={yOf(d.leads)} r="2.5" fill="white" stroke="#6366f1" strokeWidth="1.5" />
        ))}

        {/* X axis labels */}
        {data.map((d, i) => i % step === 0 && (
          <text key={i} x={xOf(i)} y={H - 4} textAnchor="middle" fontSize="9" fill="#9ca3af">{d.date}</text>
        ))}
      </svg>

      {/* Legend */}
      <div className="flex items-center gap-4 mt-1 text-xs text-gray-400">
        <span className="flex items-center gap-1.5">
          <span className="w-5 h-0.5 bg-indigo-500 inline-block rounded" />
          Lead mới
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-5 h-0.5 bg-emerald-500 inline-block rounded border-dashed" style={{ borderTop: '1.5px dashed #10b981', background: 'none' }} />
          Approved
        </span>
      </div>
    </div>
  )
}
