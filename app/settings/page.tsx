/**
 * Enhanced Settings Page with Helper Features
 * Manages all system configuration from Supabase settings table
 * Features: Copy, Show/Hide, Paste, Clear buttons for each field
 */

'use client'

import { useState, useEffect, useRef } from 'react'
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
  const [visibleFields, setVisibleFields] = useState<Record<string, boolean>>({})
  const [copiedField, setCopiedField] = useState<string | null>(null)
  const pasteRefs = useRef<Record<string, HTMLInputElement | HTMLTextAreaElement | null>>({})

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    try {
      setLoading(true)
      setError(null)
      
      // Add timeout fallback to ensure loading clears
      const timeoutId = setTimeout(() => {
        setLoading(false)
        setError('انتهت مهلة تحميل الإعدادات. يرجى المحاولة مرة أخرى.')
      }, 10000)
      
      const response = await fetch('/api/settings')
      
      clearTimeout(timeoutId)
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const data = await response.json()

      if (data.success && data.data) {
        const settingsList = Array.isArray(data.data) ? data.data : []
        setSettings(settingsList)
        const initialFormData: Record<string, string> = {}
        const initialVisible: Record<string, boolean> = {}
        settingsList.forEach((s: SystemSetting) => {
          initialFormData[s.key] = s.value || ''
          // Password fields start hidden, others visible
          initialVisible[s.key] = !isPasswordField(s.key)
        })
        setFormData(initialFormData)
        setVisibleFields(initialVisible)
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
        setError(data.error || 'فشل حفظ الإعدادات')
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

  const isPasswordField = (key: string): boolean => {
    return key.includes('TOKEN') || key.includes('KEY') || key.includes('SECRET') || key.includes('PASSWORD')
  }

  const toggleVisibility = (key: string) => {
    setVisibleFields((prev) => ({
      ...prev,
      [key]: !prev[key],
    }))
  }

  const copyToClipboard = async (key: string, value: string) => {
    try {
      await navigator.clipboard.writeText(value)
      setCopiedField(key)
      setTimeout(() => setCopiedField(null), 2000)
    } catch (error) {
      console.error('Failed to copy:', error)
      setError('فشل نسخ القيمة')
    }
  }

  const pasteFromClipboard = async (key: string) => {
    try {
      const text = await navigator.clipboard.readText()
      handleInputChange(key, text)
      setSuccess('تم لصق القيمة بنجاح')
      setTimeout(() => setSuccess(null), 2000)
    } catch (error) {
      console.error('Failed to paste:', error)
      setError('فشل لصق القيمة')
    }
  }

  const clearField = (key: string) => {
    handleInputChange(key, '')
  }

  // Filter out n8n-related settings and only show Himam system settings
  const himamSettings = settings.filter((s) => {
    const key = s.key
    return (
      key === 'GEMINI_KEY' ||
      key === 'OPENAI_KEY' ||
      key === 'WHATSAPP_TOKEN' ||
      key === 'WHATSAPP_PHONE_NUMBER_ID' ||
      key === 'WHATSAPP_VERIFY_TOKEN' ||
      key === 'WHATSAPP_APP_ID' ||
      key === 'WHATSAPP_WABA_ID' ||
      key === 'WHATSAPP_PHONE_NUMBER' ||
      key === 'GOOGLE_CLIENT_EMAIL' ||
      key === 'GOOGLE_PRIVATE_KEY' ||
      key === 'GOOGLE_CALENDAR_ID' ||
      key === 'CRM_URL' ||
      key === 'CRM_TOKEN'
    ) && !key.startsWith('features.') && !key.startsWith('license.') && !key.startsWith('ui.') && !key.startsWith('userManagement.')
  })

  // Group settings by category
  const categories = {
    ai: himamSettings.filter((s) => s.key.includes('GEMINI') || s.key.includes('OPENAI')),
    whatsapp: himamSettings.filter((s) => s.key.includes('WHATSAPP')),
    google: himamSettings.filter((s) => s.key.includes('GOOGLE')),
    crm: himamSettings.filter((s) => s.key.includes('CRM')),
  }

  const formatLabel = (key: string): string => {
    const labelMap: Record<string, string> = {
      'GEMINI_KEY': 'Gemini API Key',
      'OPENAI_KEY': 'OpenAI API Key',
      'WHATSAPP_TOKEN': 'Access Token',
      'WHATSAPP_PHONE_NUMBER_ID': 'Phone Number ID',
      'WHATSAPP_VERIFY_TOKEN': 'Verify Token',
      'WHATSAPP_APP_ID': 'App ID',
      'WHATSAPP_WABA_ID': 'WABA ID',
      'WHATSAPP_PHONE_NUMBER': 'Phone Number',
      'GOOGLE_CLIENT_EMAIL': 'Client Email',
      'GOOGLE_PRIVATE_KEY': 'Private Key',
      'GOOGLE_CALENDAR_ID': 'Calendar ID',
      'CRM_URL': 'CRM URL',
      'CRM_TOKEN': 'CRM Token',
    }
    return labelMap[key] || key.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())
  }

  const renderFieldWithHelpers = (setting: SystemSetting) => {
    const key = setting.key
    const value = formData[key] || ''
    const isPassword = isPasswordField(key)
    const isVisible = visibleFields[key] ?? !isPassword
    const isTextarea = key === 'GOOGLE_PRIVATE_KEY'
    const hasValue = value.length > 0

    return (
      <div key={key} className="space-y-2">
        <div className="flex items-center justify-between">
          <label htmlFor={key} className="form-label">
            {formatLabel(key)}
          </label>
          <div className="flex gap-2">
            {/* Show/Hide Toggle (for password fields) */}
            {isPassword && (
              <button
                type="button"
                onClick={() => toggleVisibility(key)}
                className="px-3 py-1.5 text-xs font-medium text-gray-600 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
                title={isVisible ? 'إخفاء' : 'إظهار'}
              >
                {isVisible ? '👁️ إخفاء' : '👁️‍🗨️ إظهار'}
              </button>
            )}
            {/* Copy Button */}
            {hasValue && (
              <button
                type="button"
                onClick={() => copyToClipboard(key, value)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                  copiedField === key
                    ? 'bg-green-100 text-green-700'
                    : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                }`}
                title="نسخ"
              >
                {copiedField === key ? '✓ تم النسخ' : '📋 نسخ'}
              </button>
            )}
            {/* Paste Button */}
            <button
              type="button"
              onClick={() => pasteFromClipboard(key)}
              className="px-3 py-1.5 text-xs font-medium text-purple-600 hover:text-purple-900 bg-purple-100 hover:bg-purple-200 rounded-md transition-colors"
              title="لصق"
            >
              📥 لصق
            </button>
            {/* Clear Button */}
            {hasValue && (
              <button
                type="button"
                onClick={() => clearField(key)}
                className="px-3 py-1.5 text-xs font-medium text-red-600 hover:text-red-900 bg-red-100 hover:bg-red-200 rounded-md transition-colors"
                title="مسح"
              >
                🗑️ مسح
              </button>
            )}
          </div>
        </div>
        
        {isTextarea ? (
          <textarea
            ref={(el) => {
              pasteRefs.current[key] = el
            }}
            id={key}
            value={value}
            onChange={(e) => handleInputChange(key, e.target.value)}
            rows={4}
            className="form-input font-mono text-sm w-full"
            placeholder={setting.description || key}
          />
        ) : (
          <input
            ref={(el) => {
              pasteRefs.current[key] = el
            }}
            type={isPassword && !isVisible ? 'password' : 'text'}
            id={key}
            value={value}
            onChange={(e) => handleInputChange(key, e.target.value)}
            className="form-input w-full"
            placeholder={setting.description || key}
          />
        )}
        
        {setting.description && (
          <p className="mt-1 text-sm text-muted-foreground">{setting.description}</p>
        )}
      </div>
    )
  }

  if (loading) {
    return (
      <div className="page-container">
        <Header />
        <main className="page-content">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <p className="mt-4 text-gray-500">جاري التحميل...</p>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  return (
    <div className="page-container">
      <Header />
      <main className="page-content">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
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

          {himamSettings.length === 0 ? (
            <div className="card">
              <p className="text-center text-gray-500 py-8">
                لا توجد إعدادات متاحة. يرجى التحقق من اتصال قاعدة البيانات.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* AI Settings */}
              {categories.ai.length > 0 && (
                <div className="card">
                  <h2 className="heading-tertiary mb-4">إعدادات الذكاء الاصطناعي</h2>
                  <div className="space-y-4">
                    {categories.ai.map((setting) => renderFieldWithHelpers(setting))}
                  </div>
                </div>
              )}

              {/* WhatsApp Settings */}
              {categories.whatsapp.length > 0 && (
                  <div className="card">
                  <h2 className="heading-tertiary mb-4">إعدادات WhatsApp</h2>
                  
                  {/* Webhook URL Display */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                    <h3 className="text-sm font-semibold text-blue-900 mb-2">🔴 رابط الويب هوك (Webhook URL)</h3>
                    <p className="text-xs text-blue-700 mb-3">انسخ هذا الرابط وضعه في إعدادات Webhook في لوحة تحكم Meta.</p>
                    <div className="flex items-center gap-2">
                       <code className="flex-1 bg-white border border-blue-300 rounded px-3 py-2 text-sm font-mono text-gray-800 break-all">
                         {typeof window !== 'undefined' ? `${window.location.origin}/api/whatsapp` : '/api/whatsapp'}
                       </code>
                       <button
                         type="button"
                         onClick={() => copyToClipboard('webhook_url', typeof window !== 'undefined' ? `${window.location.origin}/api/whatsapp` : '')}
                         className={`px-4 py-2 text-sm font-medium rounded-md transition-colors whitespace-nowrap ${
                           copiedField === 'webhook_url'
                             ? 'bg-green-600 text-white'
                             : 'bg-blue-600 text-white hover:bg-blue-700'
                         }`}
                       >
                         {copiedField === 'webhook_url' ? '✓ تم النسخ' : '📋 نسخ الرابط'}
                       </button>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {categories.whatsapp.map((setting) => renderFieldWithHelpers(setting))}
                  </div>
                </div>
              )}

              {/* Google Calendar Settings */}
              {categories.google.length > 0 && (
                <div className="card">
                  <h2 className="heading-tertiary mb-4">إعدادات Google Calendar</h2>
                  <div className="space-y-4">
                    {categories.google.map((setting) => renderFieldWithHelpers(setting))}
                  </div>
                </div>
              )}

              {/* CRM Settings */}
              {categories.crm.length > 0 && (
                <div className="card">
                  <h2 className="heading-tertiary mb-4">إعدادات CRM</h2>
                  <div className="space-y-4">
                    {categories.crm.map((setting) => renderFieldWithHelpers(setting))}
                  </div>
                </div>
              )}

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
          )}
        </div>
      </main>
      <Footer />
    </div>
  )
}
