'use client'

interface Group {
  id: string
  name: string
  url: string
  enabled: boolean
}

interface GroupSelectorProps {
  groups: Group[]
  selectedIds: string[]
  onChange: (ids: string[]) => void
}

export function GroupSelector({ groups, selectedIds, onChange }: GroupSelectorProps) {
  const toggle = (id: string) => {
    onChange(
      selectedIds.includes(id)
        ? selectedIds.filter((s) => s !== id)
        : [...selectedIds, id]
    )
  }

  const toggleAll = () => {
    if (selectedIds.length === groups.length) {
      onChange([])
    } else {
      onChange(groups.map((g) => g.id))
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-gray-700">Chọn Groups ({selectedIds.length}/{groups.length})</span>
        <button
          onClick={toggleAll}
          className="text-xs text-indigo-600 hover:text-indigo-800"
        >
          {selectedIds.length === groups.length ? 'Bỏ chọn tất cả' : 'Chọn tất cả'}
        </button>
      </div>
      <div className="space-y-1 max-h-60 overflow-y-auto border rounded-lg p-2 bg-gray-50">
        {groups.map((group) => (
          <label
            key={group.id}
            className="flex items-center gap-2 cursor-pointer px-2 py-1.5 rounded hover:bg-white text-sm"
          >
            <input
              type="checkbox"
              checked={selectedIds.includes(group.id)}
              onChange={() => toggle(group.id)}
              className="rounded border-gray-300 text-indigo-600"
            />
            <span className="text-gray-700 truncate">{group.name}</span>
          </label>
        ))}
      </div>
    </div>
  )
}
