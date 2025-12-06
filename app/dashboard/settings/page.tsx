'use client'

import { useState, useEffect } from 'react'
import Header from '../../../components/Header'
import Footer from '../../../components/Footer'

interface WhatsAppSettings {
  id: string
  verify_token: string
  access_token: string
  phone_number_id: string
  webhook_url: string | null
  n8n_webhook_url: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<WhatsAppSettings[]>([])
  const [activeSettings, setActiveSettings] = useState<WhatsAppSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    verify_token: '',
    access_token: '',
    phone_number_id: '',
    webhook_url: '',
    n8n_webhook_url: '',
    is_active: true,
  })

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    try {
      setLoading(true)
      const [allRes, activeRes] = await Promise.all([
        fetch('/api/whatsapp/settings'),
        fetch('/api/whatsapp/settings/active'),
      ])

      const allData = await allRes.json()
      const activeData = await activeRes.json()

      if (allData.success) {
        setSettings(allData.data)
      }

      if (activeData.success) {
        setActiveSettings(activeData.data)
        setFormData({
          verify_token: activeData.data.verify_token || '',
          access_token: activeData.data.access_token || '',
          phone_number_id: activeData.data.phone_number_id || '',
          webhook_url: activeData.data.webhook_url || '',
          n8n_webhook_url: activeData.data.n8n_webhook_url || '',
          is_active: activeData.data.is_active || false,
        })
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
      let response
      if (activeSettings) {
        // Update existing settings
        response = await fetch(`/api/whatsapp/settings/${activeSettings.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        })
      } else {
        // Create new settings
        response = await fetch('/api/whatsapp/settings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        })
      }

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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }))
  }

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50">
        <Header />
        <main className="flex-1 py-8">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">جاري التحميل...</div>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />
      <main className="flex-1 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold mb-8 text-gray-900">إعدادات WhatsApp</h1>

          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700">
              {success}
            </div>
          )}

          <div className="bg-white rounded-lg shadow-md p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="verify_token" className="block text-sm font-medium text-gray-700 mb-2">
                  Verify Token
                </label>
                <input
                  type="text"
                  id="verify_token"
                  name="verify_token"
                  value={formData.verify_token}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="meta-webhook-verify-2025"
                />
                <p className="mt-1 text-sm text-gray-500">
                  الرمز المستخدم للتحقق من webhook في Meta Developer Console
                </p>
              </div>

              <div>
                <label htmlFor="access_token" className="block text-sm font-medium text-gray-700 mb-2">
                  Access Token
                </label>
                <input
                  type="password"
                  id="access_token"
                  name="access_token"
                  value={formData.access_token}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="EAAekiSTO6eMBP..."
                />
                <p className="mt-1 text-sm text-gray-500">
                  Access Token من Meta Developer Console
                </p>
              </div>

              <div>
                <label htmlFor="phone_number_id" className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number ID
                </label>
                <input
                  type="text"
                  id="phone_number_id"
                  name="phone_number_id"
                  value={formData.phone_number_id}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="843049648895545"
                />
                <p className="mt-1 text-sm text-gray-500">
                  Phone Number ID من Meta Developer Console
                </p>
              </div>

              <div>
                <label htmlFor="webhook_url" className="block text-sm font-medium text-gray-700 mb-2">
                  Webhook URL
                </label>
                <input
                  type="url"
                  id="webhook_url"
                  name="webhook_url"
                  value={formData.webhook_url}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="https://himam-system.vercel.app/api/whatsapp"
                />
                <p className="mt-1 text-sm text-gray-500">
                  URL الخاص بـ webhook في النظام
                </p>
              </div>

              <div>
                <label htmlFor="n8n_webhook_url" className="block text-sm font-medium text-gray-700 mb-2">
                  n8n Webhook URL
                </label>
                <input
                  type="url"
                  id="n8n_webhook_url"
                  name="n8n_webhook_url"
                  value={formData.n8n_webhook_url}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="https://n8n-9q4d.onrender.com/webhook/whatsapp-integration"
                />
                <p className="mt-1 text-sm text-gray-500">
                  URL الخاص بـ n8n workflow webhook
                </p>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="is_active"
                  name="is_active"
                  checked={formData.is_active}
                  onChange={handleInputChange}
                  className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                />
                <label htmlFor="is_active" className="mr-2 block text-sm text-gray-700">
                  تفعيل هذه الإعدادات
                </label>
              </div>

              <div className="flex gap-4">
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2 bg-primary text-white rounded-md hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? 'جاري الحفظ...' : 'حفظ الإعدادات'}
                </button>
                <button
                  type="button"
                  onClick={loadSettings}
                  className="px-6 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400"
                >
                  إعادة تحميل
                </button>
              </div>
            </form>
          </div>

          {activeSettings && (
            <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h2 className="text-lg font-semibold text-blue-900 mb-2">الإعدادات النشطة</h2>
              <p className="text-sm text-blue-700">
                تم التحديث آخر مرة: {new Date(activeSettings.updated_at).toLocaleString('ar-SA')}
              </p>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  )
}

