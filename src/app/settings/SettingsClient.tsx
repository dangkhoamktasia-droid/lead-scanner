'use client'
import { useState } from 'react'
import { toast } from 'sonner'
import { Save, Eye, EyeOff } from 'lucide-react'

interface SettingsClientProps {
  initialSettings: Record<string, string>
}

function Field({ label, name, value, onChange, type = 'text', placeholder = '' }: {
  label: string; name: string; value: string; onChange: (v: string) => void
  type?: string; placeholder?: string
}) {
  const [show, setShow] = useState(false)
  const isSecret = type === 'password'

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <div className="relative">
        <input
          type={isSecret && !show ? 'password' : 'text'}
          name={name}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 pr-10"
        />
        {isSecret && (
          <button type="button" onClick={() => setShow(!show)}
            className="absolute right-2 top-2 text-gray-400 hover:text-gray-600">
            {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        )}
      </div>
    </div>
  )
}

export function SettingsClient({ initialSettings }: SettingsClientProps) {
  const [settings, setSettings] = useState<Record<string, string>>(initialSettings)
  const [saving, setSaving] = useState(false)

  const set = (key: string) => (value: string) => setSettings((s) => ({ ...s, [key]: value }))

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      })
      if (!res.ok) throw new Error('Save failed')
      toast.success('Đã lưu settings')
    } catch (err) {
      toast.error(String(err))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="glass-card rounded-2xl p-6 shadow-sm space-y-4">
        <h2 className="font-semibold text-gray-800">Apify</h2>
        <Field label="Apify API Token" name="apifyToken" value={settings.apifyToken ?? ''} onChange={set('apifyToken')} type="password" placeholder="apify_api_..." />
      </div>

      <div className="glass-card rounded-2xl p-6 shadow-sm space-y-4">
        <h2 className="font-semibold text-gray-800">AI Provider</h2>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Provider</label>
          <select
            value={settings.aiProvider ?? 'openai'}
            onChange={(e) => set('aiProvider')(e.target.value)}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="openai">OpenAI</option>
            <option value="anthropic">Anthropic (Claude)</option>
          </select>
        </div>
        <Field label="OpenAI API Key" name="openaiKey" value={settings.openaiKey ?? ''} onChange={set('openaiKey')} type="password" placeholder="sk-..." />
        <Field label="Anthropic API Key" name="anthropicKey" value={settings.anthropicKey ?? ''} onChange={set('anthropicKey')} type="password" placeholder="sk-ant-..." />
      </div>

      <div className="glass-card rounded-2xl p-6 shadow-sm space-y-4">
        <h2 className="font-semibold text-gray-800">Scan Defaults</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Số ngày mặc định</label>
            <select
              value={settings.defaultScanDays ?? '2'}
              onChange={(e) => set('defaultScanDays')(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            >
              <option value="1">1 ngày</option>
              <option value="2">2 ngày</option>
              <option value="7">7 ngày</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Số bài / group mặc định</label>
            <select
              value={settings.defaultResultLimit ?? '30'}
              onChange={(e) => set('defaultResultLimit')(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            >
              <option value="15">15</option>
              <option value="30">30</option>
              <option value="50">50</option>
            </select>
          </div>
        </div>
      </div>

      <div className="glass-card rounded-2xl p-6 shadow-sm space-y-4">
        <h2 className="font-semibold text-gray-800">Message Template</h2>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Template tin nhắn mặc định</label>
          <textarea
            value={settings.messageTemplate ?? ''}
            onChange={(e) => set('messageTemplate')(e.target.value)}
            rows={4}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <p className="text-xs text-gray-400 mt-1">Dùng [sản phẩm] làm placeholder cho tên sản phẩm</p>
        </div>
      </div>

      <button
        onClick={handleSave}
        disabled={saving}
        className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-medium py-2.5 rounded-lg transition-colors"
      >
        <Save className="w-4 h-4" />
        {saving ? 'Đang lưu...' : 'Lưu Settings'}
      </button>
    </div>
  )
}
