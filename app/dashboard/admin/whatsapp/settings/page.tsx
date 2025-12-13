'use client'

/**
 * WhatsApp Settings & Connection Page
 * Configure WhatsApp integration with Meta Cloud API
 */

import { useEffect, useState } from 'react'
import { Settings, CheckCircle, XCircle, AlertCircle, RefreshCw, Save, Link as LinkIcon, Key, Smartphone, Bot, Sparkles } from 'lucide-react'
import { toast } from 'sonner'

interface WhatsAppSettings {
  id?: string
  name: string
  phone_number_id: string
  access_token: string
  verify_token: string
  app_id?: string
  waba_id?: string
  phone_number?: string
  webhook_url?: string
  is_active: boolean
  created_at?: string
  updated_at?: string
}

interface AISettings {
  ai_agent_enabled: boolean
  ai_provider: 'gemini' | 'openai' | 'auto' | ''
  gemini_key: string
  openai_key: string
}

export default function WhatsAppSettingsPage() {
  const [settings, setSettings] = useState<WhatsAppSettings | null>(null)
  const [aiSettings, setAiSettings] = useState<AISettings>({
    ai_agent_enabled: false,
    ai_provider: '',
    gemini_key: '',
    openai_key: '',
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'checking'>('checking')

  useEffect(() => {
    loadSettings()
    loadAISettings()
    checkConnection()
  }, [])

  const loadSettings = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/whatsapp/settings')
      const data = await res.json()
      
      if (data.success && data.data) {
        // Handle both array and single object responses
        const settingsArray = Array.isArray(data.data) ? data.data : [data.data]
        
        if (settingsArray.length > 0) {
          // Get active settings or first one
          const activeSettings = settingsArray.find((s: WhatsAppSettings) => s.is_active) || settingsArray[0]
          setSettings({
            ...activeSettings,
            name: activeSettings.name || 'WhatsApp Business Account',
          })
        } else {
          // Create default empty settings
          setSettings({
            name: 'WhatsApp Business Account',
            phone_number_id: '',
            access_token: '',
            verify_token: '',
            is_active: false,
          })
        }
      } else {
        // Create default empty settings
        setSettings({
          name: 'WhatsApp Business Account',
          phone_number_id: '',
          access_token: '',
          verify_token: '',
          is_active: false,
        })
      }
    } catch (error) {
      const { logError } = await import('@/shared/utils/logger')
      logError('Error loading WhatsApp settings', error, { endpoint: '/dashboard/admin/whatsapp/settings' })
      const errorMessage = error instanceof Error ? error.message : 'فشل تحميل الإعدادات'
      toast.error(errorMessage)
      setSettings({
        name: 'WhatsApp Business Account',
        phone_number_id: '',
        access_token: '',
        verify_token: '',
        is_active: false,
      })
    } finally {
      setLoading(false)
    }
  }

  const loadAISettings = async () => {
    try {
      const res = await fetch('/api/settings')
      const data = await res.json()
      
      if (data.success && data.data) {
        const settingsMap = new Map(data.data.map((s: { key: string; value: unknown }) => [s.key, s.value]))
        const geminiKey = (settingsMap.get('GEMINI_KEY') as string) || ''
        const openaiKey = (settingsMap.get('OPENAI_KEY') as string) || ''
        
        // Determine if AI agent is enabled (if at least one key exists)
        const aiEnabled = !!(geminiKey || openaiKey)
        // Get model preference from settings (default to 'auto' if both keys exist)
        const modelPreference = (settingsMap.get('AI_MODEL') as 'gemini' | 'openai' | 'auto') || 
          (geminiKey && openaiKey ? 'auto' : (geminiKey ? 'gemini' : (openaiKey ? 'openai' : '')))
        
        setAiSettings({
          ai_agent_enabled: aiEnabled,
          ai_provider: modelPreference as 'gemini' | 'openai' | 'auto' | '',
          gemini_key: geminiKey,
          openai_key: openaiKey,
        })
      }
    } catch (error) {
      console.error('Error loading AI settings:', error)
    }
  }

  const checkConnection = async () => {
    try {
      setConnectionStatus('checking')
      
      // First check if we have active settings
      const activeRes = await fetch('/api/whatsapp/settings/active')
      const activeData = await activeRes.json()
      
      if (!activeRes.ok || !activeData.success || !activeData.data || !activeData.data.is_active) {
        setConnectionStatus('disconnected')
        return
      }

      // Test connection by checking business profile
      // Use a simpler endpoint or just verify settings are valid
      const profileRes = await fetch('/api/whatsapp/business-profile')
      
      if (profileRes.ok) {
        const profileData = await profileRes.json()
        if (profileData.success) {
          setConnectionStatus('connected')
          return
        }
      }
      
      // If profile fetch fails, check if it's just a configuration issue
      // Don't mark as disconnected if settings are present and active
      if (activeData.data && activeData.data.is_active && activeData.data.phone_number_id && activeData.data.access_token) {
        // Settings are configured, but API test failed - might be temporary
        // Try a simpler test: just verify we can reach Meta API
        try {
          const testRes = await fetch(
            `https://graph.facebook.com/v20.0/${activeData.data.phone_number_id}?fields=verified_name`,
            {
              headers: {
                Authorization: `Bearer ${activeData.data.access_token}`,
              },
            }
          )
          if (testRes.ok) {
            setConnectionStatus('connected')
            return
          }
        } catch (testError) {
          // Meta API test failed
        }
      }
      
      setConnectionStatus('disconnected')
    } catch (error) {
      console.error('Error checking connection:', error)
      setConnectionStatus('disconnected')
    }
  }

  const handleSave = async () => {
    if (!settings) return

    // Validation
    if (!settings.phone_number_id || !settings.access_token || !settings.verify_token) {
      toast.error('يرجى ملء جميع الحقول المطلوبة')
      return
    }

    // Validate AI settings if enabled
    if (aiSettings.ai_agent_enabled) {
      if (aiSettings.ai_provider === 'gemini' && !aiSettings.gemini_key) {
        toast.error('يرجى إدخال Gemini API Key')
        return
      }
      if (aiSettings.ai_provider === 'openai' && !aiSettings.openai_key) {
        toast.error('يرجى إدخال OpenAI API Key')
        return
      }
    }

    try {
      setSaving(true)

      // Save WhatsApp settings
      if (settings.id) {
        const res = await fetch(`/api/whatsapp/settings/${settings.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(settings),
        })
        const data = await res.json()
        
        if (!data.success) {
          toast.error('فشل حفظ إعدادات الواتساب: ' + (data.error?.message || 'خطأ غير معروف'))
          return
        }
      } else {
        const res = await fetch('/api/whatsapp/settings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(settings),
        })
        const data = await res.json()
        
        if (!data.success) {
          toast.error('فشل إنشاء إعدادات الواتساب: ' + (data.error?.message || 'خطأ غير معروف'))
          return
        }
      }

      // Save AI settings
      const aiSettingsToSave: Record<string, string> = {}
      if (aiSettings.ai_agent_enabled) {
        // Save API keys (keep both if auto mode)
        if (aiSettings.gemini_key) {
          aiSettingsToSave['GEMINI_KEY'] = aiSettings.gemini_key
        }
        if (aiSettings.openai_key) {
          aiSettingsToSave['OPENAI_KEY'] = aiSettings.openai_key
        }
        
        // Save model preference
        if (aiSettings.ai_provider) {
          aiSettingsToSave['AI_MODEL'] = aiSettings.ai_provider
        }
      } else {
        // If disabled, clear both keys and model preference
        aiSettingsToSave['GEMINI_KEY'] = ''
        aiSettingsToSave['OPENAI_KEY'] = ''
        aiSettingsToSave['AI_MODEL'] = ''
      }

      if (Object.keys(aiSettingsToSave).length > 0) {
        const aiRes = await fetch('/api/settings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(aiSettingsToSave),
        })
        const aiData = await aiRes.json()
        
        if (!aiData.success) {
          toast.error('فشل حفظ إعدادات AI: ' + (aiData.error || 'خطأ غير معروف'))
          return
        }
      }

      toast.success('تم حفظ جميع الإعدادات بنجاح')
      await loadSettings()
      await loadAISettings()
      await checkConnection()
    } catch (error: unknown) {
      const { logError } = await import('@/shared/utils/logger')
      logError('Error saving WhatsApp settings', error, { endpoint: '/dashboard/admin/whatsapp/settings' })
      const errorMessage = error instanceof Error ? error.message : 'حدث خطأ أثناء حفظ الإعدادات'
      toast.error(errorMessage)
    } finally {
      setSaving(false)
    }
  }

  const handleTestConnection = async () => {
    if (!settings?.access_token || !settings?.phone_number_id) {
      toast.error('يرجى إدخال Access Token و Phone Number ID أولاً')
      return
    }

    try {
      setTesting(true)
      setConnectionStatus('checking')
      
      // First save settings if they have an ID (to ensure they're active)
      if (settings.id) {
        const saveRes = await fetch(`/api/whatsapp/settings/${settings.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...settings,
            is_active: true,
          }),
        })
        
        if (!saveRes.ok) {
          const saveData = await saveRes.json()
          throw new Error(saveData.error?.message || 'Failed to save settings')
        }
      }
      
      // Test connection by making a direct call to Meta API
      try {
        const testRes = await fetch(
          `https://graph.facebook.com/v20.0/${settings.phone_number_id}?fields=verified_name`,
          {
            headers: {
              Authorization: `Bearer ${settings.access_token}`,
            },
          }
        )

        if (testRes.ok) {
          const testData = await testRes.json()
          if (testData.verified_name || testData.id) {
            toast.success('✅ الاتصال يعمل بشكل صحيح!')
            setConnectionStatus('connected')
            // Also refresh settings to get updated status
            await loadSettings()
            return
          }
        } else {
          const errorData = await testRes.json().catch(() => ({}))
          const errorMsg = errorData.error?.message || errorData.error?.error_user_msg || 'فشل الاتصال بـ Meta API'
          toast.error('❌ فشل الاتصال: ' + errorMsg)
          setConnectionStatus('disconnected')
          return
        }
      } catch (apiError: unknown) {
        const { logError } = await import('@/shared/utils/logger')
        logError('Error testing WhatsApp connection', apiError, { endpoint: '/dashboard/admin/whatsapp/settings' })
        // If direct API call fails, try the business profile endpoint as fallback
        const res = await fetch('/api/whatsapp/business-profile')
        const data = await res.json()
        
        if (res.ok && data.success) {
          toast.success('✅ الاتصال يعمل بشكل صحيح!')
          setConnectionStatus('connected')
        } else {
          const errorMsg = data.error?.message || data.error || 'تحقق من الإعدادات'
          toast.error('❌ فشل الاتصال: ' + errorMsg)
          setConnectionStatus('disconnected')
        }
        return
      }
      
      // If we get here, connection failed
      toast.error('❌ فشل الاتصال: تحقق من صحة Access Token و Phone Number ID')
      setConnectionStatus('disconnected')
    } catch (error: any) {
      console.error('Error testing connection:', error)
      toast.error('حدث خطأ أثناء اختبار الاتصال: ' + (error.message || 'خطأ غير معروف'))
      setConnectionStatus('disconnected')
    } finally {
      setTesting(false)
    }
  }

  if (loading) {
    return (
      <div className="p-8">
        <div className="text-center text-gray-500">جاري تحميل الإعدادات...</div>
      </div>
    )
  }

  if (!settings) {
    return (
      <div className="p-8">
        <div className="text-center text-red-500">فشل تحميل الإعدادات</div>
      </div>
    )
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-extrabold text-gray-900 mb-2">إعدادات واتساب والربط</h1>
        <p className="text-gray-500 text-lg">تكوين تكامل واتساب للأعمال مع Meta Cloud API</p>
      </div>

      {/* Connection Status */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
              connectionStatus === 'connected' 
                ? 'bg-green-100 text-green-600' 
                : connectionStatus === 'disconnected'
                ? 'bg-red-100 text-red-600'
                : 'bg-yellow-100 text-yellow-600'
            }`}>
              {connectionStatus === 'connected' ? (
                <CheckCircle size={24} />
              ) : connectionStatus === 'disconnected' ? (
                <XCircle size={24} />
              ) : (
                <RefreshCw size={24} className="animate-spin" />
              )}
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">حالة الاتصال</h2>
              <p className="text-sm text-gray-500">
                {connectionStatus === 'connected' 
                  ? 'متصل بنجاح' 
                  : connectionStatus === 'disconnected'
                  ? 'غير متصل'
                  : 'جارٍ التحقق...'}
              </p>
            </div>
          </div>
          <button
            onClick={handleTestConnection}
            disabled={testing}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-50"
          >
            <RefreshCw size={18} className={testing ? 'animate-spin' : ''} />
            {testing ? 'جارٍ الاختبار...' : 'اختبار الاتصال'}
          </button>
        </div>
      </div>

      {/* Settings Form */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">إعدادات Meta Cloud API</h2>
          <p className="text-gray-500">احصل على هذه المعلومات من Meta Developer Console</p>
        </div>

        <div className="space-y-6">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              اسم الحساب
            </label>
            <input
              type="text"
              value={settings.name}
              onChange={(e) => setSettings({ ...settings, name: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder="WhatsApp Business Account"
            />
          </div>

          {/* Phone Number ID */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
              <Smartphone size={16} />
              Phone Number ID <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={settings.phone_number_id}
              onChange={(e) => setSettings({ ...settings, phone_number_id: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder="843049648895545"
              required
            />
            <p className="text-xs text-gray-500 mt-1">من Meta Developer Console → WhatsApp → API Setup</p>
          </div>

          {/* Access Token */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
              <Key size={16} />
              Access Token <span className="text-red-500">*</span>
            </label>
            <textarea
              value={settings.access_token}
              onChange={(e) => setSettings({ ...settings, access_token: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder="EAAxxxxxxxxxxxxx"
              rows={3}
              required
            />
            <p className="text-xs text-gray-500 mt-1">من Meta Developer Console → WhatsApp → API Setup (Permanent Token)</p>
          </div>

          {/* Verify Token */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
              <Key size={16} />
              Verify Token <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={settings.verify_token}
              onChange={(e) => setSettings({ ...settings, verify_token: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder="meta-webhook-verify-2025"
              required
            />
            <p className="text-xs text-gray-500 mt-1">استخدم نفس القيمة في Meta Webhook Configuration</p>
          </div>

          {/* Webhook URL */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
              <LinkIcon size={16} />
              Webhook URL
            </label>
            <input
              type="text"
              value={settings.webhook_url || ''}
              onChange={(e) => setSettings({ ...settings, webhook_url: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder="https://your-domain.com/api/whatsapp"
            />
            <p className="text-xs text-gray-500 mt-1">URL الخاص بـ Webhook في Meta Developer Console</p>
          </div>

          {/* App ID (Optional) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              App ID (اختياري)
            </label>
            <input
              type="text"
              value={settings.app_id || ''}
              onChange={(e) => setSettings({ ...settings, app_id: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder="123456789"
            />
          </div>

          {/* WABA ID (Optional) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              WABA ID (اختياري - للحصول على معلومات البروفايل الكاملة)
            </label>
            <input
              type="text"
              value={settings.waba_id || ''}
              onChange={(e) => setSettings({ ...settings, waba_id: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder="123456789012345"
            />
            <p className="text-xs text-gray-500 mt-1">
              WhatsApp Business Account ID - للوصول الكامل لمعلومات البروفايل (الوصف، البريد الإلكتروني، الموقع، العنوان، صورة البروفايل). 
              يمكنك الحصول عليه من Meta Business Suite → Settings → Business Info أو من Phone Number API Response
            </p>
          </div>

          {/* Phone Number (Optional) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              رقم الهاتف (اختياري)
            </label>
            <input
              type="text"
              value={settings.phone_number || ''}
              onChange={(e) => setSettings({ ...settings, phone_number: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder="+966501234567"
            />
          </div>

          {/* Active Status */}
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="is_active"
              checked={settings.is_active}
              onChange={(e) => setSettings({ ...settings, is_active: e.target.checked })}
              className="w-5 h-5 text-primary border-gray-300 rounded focus:ring-primary"
            />
            <label htmlFor="is_active" className="text-sm font-medium text-gray-700">
              تفعيل هذا الحساب
            </label>
          </div>
        </div>

        {/* Save Button */}
        <div className="mt-8 flex justify-end">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-50 font-bold"
          >
            <Save size={18} />
            {saving ? 'جارٍ الحفظ...' : 'حفظ الإعدادات'}
          </button>
        </div>
      </div>

      {/* AI Agent Settings */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2 flex items-center gap-2">
            <Bot size={24} className="text-primary" />
            إعدادات AI Agent
          </h2>
          <p className="text-gray-500">تفعيل الذكاء الاصطناعي للرد التلقائي على رسائل الواتساب</p>
        </div>

        <div className="space-y-6">
          {/* Enable AI Agent */}
          <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
            <input
              type="checkbox"
              id="ai_agent_enabled"
              checked={aiSettings.ai_agent_enabled}
              onChange={(e) => {
                setAiSettings({
                  ...aiSettings,
                  ai_agent_enabled: e.target.checked,
                  ai_provider: e.target.checked ? (aiSettings.gemini_key ? 'gemini' : aiSettings.openai_key ? 'openai' : '') : '',
                })
              }}
              className="w-5 h-5 text-primary border-gray-300 rounded focus:ring-primary"
            />
            <label htmlFor="ai_agent_enabled" className="text-sm font-bold text-gray-700 flex items-center gap-2">
              <Sparkles size={18} />
              تفعيل AI Agent للرد التلقائي
            </label>
          </div>

          {aiSettings.ai_agent_enabled && (
            <>
              {/* AI Provider Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  اختر مزود AI <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Gemini Option */}
                  <button
                    type="button"
                    onClick={() => setAiSettings({ ...aiSettings, ai_provider: 'gemini' })}
                    className={`p-4 border-2 rounded-xl transition-all text-right ${
                      aiSettings.ai_provider === 'gemini'
                        ? 'border-primary bg-primary/10 shadow-md'
                        : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <input
                        type="radio"
                        checked={aiSettings.ai_provider === 'gemini'}
                        onChange={() => setAiSettings({ ...aiSettings, ai_provider: 'gemini' })}
                        className="w-4 h-4 text-primary cursor-pointer"
                      />
                      <span className="font-bold text-gray-900">Google Gemini</span>
                    </div>
                    <p className="text-xs text-gray-500">يجرب نماذج Gemini تلقائياً</p>
                  </button>

                  {/* OpenAI Option */}
                  <button
                    type="button"
                    onClick={() => setAiSettings({ ...aiSettings, ai_provider: 'openai' })}
                    className={`p-4 border-2 rounded-xl transition-all text-right ${
                      aiSettings.ai_provider === 'openai'
                        ? 'border-primary bg-primary/10 shadow-md'
                        : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <input
                        type="radio"
                        checked={aiSettings.ai_provider === 'openai'}
                        onChange={() => setAiSettings({ ...aiSettings, ai_provider: 'openai' })}
                        className="w-4 h-4 text-primary cursor-pointer"
                      />
                      <span className="font-bold text-gray-900">OpenAI</span>
                    </div>
                    <p className="text-xs text-gray-500">مزود احتياطي</p>
                  </button>

                  {/* Auto Option */}
                  <button
                    type="button"
                    onClick={() => setAiSettings({ ...aiSettings, ai_provider: 'auto' })}
                    className={`p-4 border-2 rounded-xl transition-all text-right ${
                      aiSettings.ai_provider === 'auto'
                        ? 'border-primary bg-primary/10 shadow-md'
                        : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <input
                        type="radio"
                        checked={aiSettings.ai_provider === 'auto'}
                        onChange={() => setAiSettings({ ...aiSettings, ai_provider: 'auto' })}
                        className="w-4 h-4 text-primary cursor-pointer"
                      />
                      <span className="font-bold text-gray-900">تلقائي (Auto)</span>
                    </div>
                    <p className="text-xs text-gray-500">Gemini ثم OpenAI</p>
                  </button>
                </div>
              </div>

              {/* Gemini API Key */}
              {(aiSettings.ai_provider === 'gemini' || aiSettings.ai_provider === 'auto') && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                    <Key size={16} />
                    Gemini API Key <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={aiSettings.gemini_key}
                    onChange={(e) => setAiSettings({ ...aiSettings, gemini_key: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent font-mono text-sm"
                    placeholder="AIzaSy..."
                    rows={3}
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    احصل على المفتاح من{' '}
                    <a href="https://aistudio.google.com/apikey" target="_blank" rel="noopener noreferrer" className="text-primary underline">
                      Google AI Studio
                    </a>
                  </p>
                </div>
              )}

              {/* OpenAI API Key */}
              {(aiSettings.ai_provider === 'openai' || aiSettings.ai_provider === 'auto') && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                    <Key size={16} />
                    OpenAI API Key <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={aiSettings.openai_key}
                    onChange={(e) => setAiSettings({ ...aiSettings, openai_key: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent font-mono text-sm"
                    placeholder="sk-..."
                    rows={3}
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    احصل على المفتاح من{' '}
                    <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer" className="text-primary underline">
                      OpenAI Platform
                    </a>
                  </p>
                </div>
              )}

              {/* AI Status Info */}
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
                <div className="flex items-start gap-2">
                  <AlertCircle size={20} className="text-blue-600 mt-0.5" />
                  <div className="text-sm text-blue-800">
                    <p className="font-bold mb-1">ملاحظة مهمة:</p>
                    <ul className="list-disc list-inside space-y-1 mr-4">
                      {aiSettings.ai_provider === 'auto' ? (
                        <>
                          <li>سيتم تجربة نماذج Gemini تلقائياً (flash-2.5, flash-2.0, flash-1.5, pro) حتى يجد واحد يعمل</li>
                          <li>إذا فشلت كل نماذج Gemini، سيتم تجربة OpenAI تلقائياً</li>
                          <li>يجب إدخال مفتاحي API (Gemini و OpenAI) للعمل في الوضع التلقائي</li>
                        </>
                      ) : aiSettings.ai_provider === 'gemini' ? (
                        <>
                          <li>سيتم تجربة نماذج Gemini تلقائياً (flash-2.5, flash-2.0, flash-1.5, pro) حتى يجد واحد يعمل</li>
                          <li>لن يتم التبديل إلى OpenAI تلقائياً - Gemini فقط</li>
                        </>
                      ) : (
                        <>
                          <li>سيتم استخدام OpenAI للرد التلقائي على جميع رسائل الواتساب</li>
                          <li>لن يتم التبديل إلى Gemini تلقائياً - OpenAI فقط</li>
                        </>
                      )}
                      <li>تأكد من صحة API Key قبل الحفظ</li>
                    </ul>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Instructions */}
      <div className="bg-blue-50 rounded-2xl border border-blue-100 p-6">
        <div className="flex items-start gap-3">
          <AlertCircle className="text-blue-600 mt-1" size={24} />
          <div>
            <h3 className="text-lg font-bold text-blue-900 mb-2">كيفية الحصول على الإعدادات</h3>
            <ol className="list-decimal list-inside space-y-2 text-sm text-blue-800">
              <li>اذهب إلى <a href="https://developers.facebook.com/" target="_blank" rel="noopener noreferrer" className="underline">Meta Developer Console</a></li>
              <li>اختر أو أنشئ WhatsApp Business App</li>
              <li>اذهب إلى <strong>WhatsApp → API Setup</strong></li>
              <li>انسخ <strong>Phone Number ID</strong> و <strong>Access Token</strong></li>
              <li>في <strong>Configuration → Webhooks</strong>، اضبط:
                <ul className="list-disc list-inside mr-4 mt-1">
                  <li>Callback URL: <code className="bg-blue-100 px-1 rounded">https://your-domain.com/api/whatsapp</code></li>
                  <li>Verify Token: نفس القيمة التي أدخلتها أعلاه</li>
                </ul>
              </li>
              <li>اشترك في <strong>messages</strong> و <strong>message_status</strong> events</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  )
}

