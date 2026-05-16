interface ReportCardProps {
  label: string
  value: string | number
  sub?: string
  color?: 'default' | 'green' | 'red' | 'yellow' | 'blue'
}

const colorMap = {
  default: 'bg-white',
  green: 'bg-green-50 border-green-200',
  red: 'bg-red-50 border-red-200',
  yellow: 'bg-yellow-50 border-yellow-200',
  blue: 'bg-blue-50 border-blue-200',
}

export function ReportCard({ label, value, sub, color = 'default' }: ReportCardProps) {
  return (
    <div className={`rounded-xl border p-4 shadow-sm ${colorMap[color]}`}>
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
  )
}
