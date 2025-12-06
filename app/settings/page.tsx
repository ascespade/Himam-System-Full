/**
 * Unified Settings Page
 * Manages all system configuration from Supabase settings table
 */

'use client'

import { useState, useEffect } from 'react'
import Header from '@/components/Header'
import Footer from '@/components/Footer'

interface SystemSetting {
  key: string
  value: string
  description?: string
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<SystemSetting[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [formData, setFormData] = useState<Record<string, string>>({})

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/settings')
      const data = await response.json()

      if (data.success) {
        setSettings(data.settings || [])
        const initialFormData: Record<string, string> = {}
        data.settings?.forEach((s: SystemSetting) => {
          initialFormData[s.key] = s.value || ''
        })
        setFormData(initialFormData)
      } else {
        setError('فشل تحميل الإعدادات')
      }
    } catch (error) {
      console.error('Error loading settings:', error)
      setError('فشل تحميل الإعدادات')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError(null)
    setSuccess(null)

    try {
      const response = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (data.success) {
        setSuccess('تم حفظ الإعدادات بنجاح')
        await loadSettings()
      } else {
        setError(data.error?.message || 'فشل حفظ الإعدادات')
      }
    } catch (error: any) {
      console.error('Error saving settings:', error)
      setError(error.message || 'فشل حفظ الإعدادات')
    } finally {
      setSaving(false)
    }
  }

  const handleInputChange = (key: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [key]: value,
    }))
  }

  if (loading) {
    return (
      <div className="page-container">
        <Header />
        <main className="page-content">
          <div className="max-w-4xl mx-auto">
            <div className="text-center">جاري التحميل...</div>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  // Group settings by category
  const categories = {
    ai: settings.filter((s) => s.key.includes('GEMINI') || s.key.includes('OPENAI')),
    whatsapp: settings.filter((s) => s.key.includes('WHATSAPP')),
    google: settings.filter((s) => s.key.includes('GOOGLE')),
    crm: settings.filter((s) => s.key.includes('CRM')),
  }

  return (
    <div className="page-container">
      <Header />
      <main className="page-content">
        <div className="max-w-6xl mx-auto">
          <h1 className="heading-primary mb-8">إعدادات النظام</h1>

          {error && (
            <div className="mb-4 alert-error">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-4 alert-success">
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* AI Settings */}
            <div className="card">
              <h2 className="heading-tertiary mb-4">إعدادات الذكاء الاصطناعي</h2>
              <div className="space-y-4">
                {categories.ai.map((setting) => (
                  <div key={setting.key}>
                    <label htmlFor={setting.key} className="form-label">
                      {setting.key}
                    </label>
                    <input
                      type={setting.key.includes('KEY') ? 'password' : 'text'}
                      id={setting.key}
                      value={formData[setting.key] || ''}
                      onChange={(e) => handleInputChange(setting.key, e.target.value)}
                      className="form-input"
                      placeholder={setting.description || setting.key}
                    />
                    {setting.description && (
                      <p className="mt-1 text-sm text-muted-foreground">{setting.description}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* WhatsApp Settings */}
            <div className="card">
              <h2 className="heading-tertiary mb-4">إعدادات WhatsApp</h2>
              <div className="space-y-4">
                {categories.whatsapp.map((setting) => (
                  <div key={setting.key}>
                    <label htmlFor={setting.key} className="form-label">
                      {setting.key}
                    </label>
                    <input
                      type={setting.key.includes('TOKEN') ? 'password' : 'text'}
                      id={setting.key}
                      value={formData[setting.key] || ''}
                      onChange={(e) => handleInputChange(setting.key, e.target.value)}
                      className="form-input"
                      placeholder={setting.description || setting.key}
                    />
                    {setting.description && (
                      <p className="mt-1 text-sm text-muted-foreground">{setting.description}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Google Calendar Settings */}
            <div className="card">
              <h2 className="heading-tertiary mb-4">إعدادات Google Calendar</h2>
              <div className="space-y-4">
                {categories.google.map((setting) => (
                  <div key={setting.key}>
                    <label htmlFor={setting.key} className="form-label">
                      {setting.key}
                    </label>
                    {setting.key === 'GOOGLE_PRIVATE_KEY' ? (
                      <textarea
                        id={setting.key}
                        value={formData[setting.key] || ''}
                        onChange={(e) => handleInputChange(setting.key, e.target.value)}
                        rows={4}
                        className="form-input font-mono text-sm"
                        placeholder={setting.description || setting.key}
                      />
                    ) : (
                      <input
                        type="text"
                        id={setting.key}
                        value={formData[setting.key] || ''}
                        onChange={(e) => handleInputChange(setting.key, e.target.value)}
                        className="form-input"
                        placeholder={setting.description || setting.key}
                      />
                    )}
                    {setting.description && (
                      <p className="mt-1 text-sm text-muted-foreground">{setting.description}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* CRM Settings */}
            <div className="card">
              <h2 className="heading-tertiary mb-4">إعدادات CRM</h2>
              <div className="space-y-4">
                {categories.crm.map((setting) => (
                  <div key={setting.key}>
                    <label htmlFor={setting.key} className="form-label">
                      {setting.key}
                    </label>
                    <input
                      type={setting.key.includes('TOKEN') ? 'password' : 'text'}
                      id={setting.key}
                      value={formData[setting.key] || ''}
                      onChange={(e) => handleInputChange(setting.key, e.target.value)}
                      className="form-input"
                      placeholder={setting.description || setting.key}
                    />
                    {setting.description && (
                      <p className="mt-1 text-sm text-muted-foreground">{setting.description}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-4">
              <button
                type="submit"
                disabled={saving}
                className="btn-primary"
              >
                {saving ? 'جاري الحفظ...' : 'حفظ الإعدادات'}
              </button>
              <button
                type="button"
                onClick={loadSettings}
                className="btn-secondary"
              >
                إعادة تحميل
              </button>
            </div>
          </form>
        </div>
      </main>
      <Footer />
    </div>
  )
}



