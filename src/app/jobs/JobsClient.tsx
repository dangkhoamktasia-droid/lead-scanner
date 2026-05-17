'use client'
import { useState } from 'react'
import { toast } from 'sonner'
import { Plus, Pencil, Trash2, ToggleLeft, ToggleRight } from 'lucide-react'

interface Job {
  id: string
  name: string
  description: string | null
  color: string
  enabled: boolean
  createdAt: string
  updatedAt: string
  _count: { groups: number; leads: number }
}

const PRESET_COLORS = ['#6366F1', '#8B5CF6', '#EC4899', '#10B981', '#F59E0B', '#EF4444']

export function JobsClient({ initialJobs }: { initialJobs: Job[] }) {
  const [jobs, setJobs] = useState<Job[]>(initialJobs)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState({ name: '', description: '', color: '#6366F1' })
  const [saving, setSaving] = useState(false)

  const resetForm = () => {
    setForm({ name: '', description: '', color: '#6366F1' })
    setShowForm(false)
    setEditingId(null)
  }

  const handleSave = async () => {
    if (!form.name.trim()) { toast.error('Tên job không được trống'); return }
    setSaving(true)
    try {
      if (editingId) {
        const res = await fetch(`/api/jobs/${editingId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form),
        })
        const updated = await res.json()
        setJobs((prev) => prev.map((j) => j.id === editingId ? { ...j, ...updated } : j))
        toast.success('Đã cập nhật job')
      } else {
        const res = await fetch('/api/jobs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form),
        })
        const created = await res.json()
        setJobs((prev) => [...prev, { ...created, _count: { groups: 0, leads: 0 } }])
        toast.success('Đã tạo job mới')
      }
      resetForm()
    } catch (err) {
      toast.error(String(err))
    } finally {
      setSaving(false)
    }
  }

  const handleToggle = async (job: Job) => {
    const res = await fetch(`/api/jobs/${job.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ enabled: !job.enabled }),
    })
    const updated = await res.json()
    setJobs((prev) => prev.map((j) => j.id === job.id ? { ...j, ...updated } : j))
  }

  const handleDelete = async (job: Job) => {
    if (job._count.groups > 0) {
      toast.error(`Job có ${job._count.groups} groups — hãy chuyển groups sang job khác trước`)
      return
    }
    if (!confirm(`Xóa job "${job.name}"?`)) return
    const res = await fetch(`/api/jobs/${job.id}`, { method: 'DELETE' })
    if (res.ok) {
      setJobs((prev) => prev.filter((j) => j.id !== job.id))
      toast.success('Đã xóa job')
    } else {
      const data = await res.json()
      toast.error(data.error)
    }
  }

  const startEdit = (job: Job) => {
    setForm({ name: job.name, description: job.description ?? '', color: job.color })
    setEditingId(job.id)
    setShowForm(true)
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {jobs.map((job) => (
          <div key={job.id} className="glass-card rounded-2xl p-5 shadow-sm">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex-shrink-0" style={{ backgroundColor: job.color }} />
                <div>
                  <p className="font-semibold text-gray-900">{job.name}</p>
                  {job.description && <p className="text-xs text-gray-500 mt-0.5">{job.description}</p>}
                </div>
              </div>
              <div className="flex gap-1">
                <button onClick={() => handleToggle(job)} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
                  {job.enabled
                    ? <ToggleRight className="w-5 h-5 text-indigo-500" />
                    : <ToggleLeft className="w-5 h-5 text-gray-400" />}
                </button>
                <button onClick={() => startEdit(job)} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
                  <Pencil className="w-4 h-4 text-gray-500" />
                </button>
                <button onClick={() => handleDelete(job)} className="p-1.5 rounded-lg hover:bg-red-50 transition-colors">
                  <Trash2 className="w-4 h-4 text-red-400" />
                </button>
              </div>
            </div>
            <div className="flex gap-4 text-xs text-gray-500">
              <span>{job._count.groups} groups</span>
              <span>{job._count.leads} leads</span>
              <span className={`font-medium ${job.enabled ? 'text-emerald-600' : 'text-gray-400'}`}>
                {job.enabled ? 'Đang hoạt động' : 'Tắt'}
              </span>
            </div>
          </div>
        ))}

        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="glass-card rounded-2xl p-5 border-2 border-dashed border-indigo-200 hover:border-indigo-400 flex items-center justify-center gap-2 text-indigo-500 hover:text-indigo-700 transition-colors shadow-sm"
          >
            <Plus className="w-5 h-5" />
            <span className="font-medium">Thêm Job mới</span>
          </button>
        )}
      </div>

      {showForm && (
        <div className="glass-card rounded-2xl p-6 shadow-sm space-y-4">
          <h3 className="font-semibold text-gray-800">{editingId ? 'Chỉnh sửa Job' : 'Tạo Job mới'}</h3>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tên Job *</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="VD: Booking TikToker, AI Automation..."
              className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Mô tả</label>
            <input
              type="text"
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              placeholder="Mô tả ngắn về job này..."
              className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Màu nhận diện</label>
            <div className="flex gap-2">
              {PRESET_COLORS.map((c) => (
                <button
                  key={c}
                  onClick={() => setForm((f) => ({ ...f, color: c }))}
                  className={`w-8 h-8 rounded-lg transition-transform ${form.color === c ? 'scale-125 ring-2 ring-offset-2 ring-gray-400' : 'hover:scale-110'}`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleSave}
              disabled={saving}
              className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-sm font-medium px-5 py-2 rounded-xl shadow-md disabled:opacity-50"
            >
              {saving ? 'Đang lưu...' : editingId ? 'Lưu' : 'Tạo Job'}
            </button>
            <button onClick={resetForm} className="text-sm text-gray-500 hover:text-gray-700 px-4 py-2 rounded-xl hover:bg-gray-100">
              Hủy
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
