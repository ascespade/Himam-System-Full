'use client'

import { Monitor, Settings, Save, Video, Mic, Shield } from 'lucide-react'
import { useApi, useMutation } from '@/core/hooks/use-api'
import { API_ROUTES } from '@/shared/constants/api-routes'

interface VideoSettings {
  provider: string
  recording_enabled: boolean
  auto_record: boolean
  quality: string
  max_duration: number
  require_consent: boolean
  notifications_enabled: boolean
}

export default function VideoSessionsSettingsPage() {
  // Use centralized hooks for data fetching
  const { data: settings, loading, mutate: setSettings } = useApi<VideoSettings>(
    API_ROUTES.DOCTOR_VIDEO_SETTINGS,
    {
      immediate: true,
      showToast: false,
    }
  )

  const { mutate: saveSettings, loading: saving } = useMutation<VideoSettings, VideoSettings>(
    API_ROUTES.DOCTOR_VIDEO_SETTINGS,
    'PUT',
    {
      showToast: true,
      onSuccess: () => {
        // Settings are automatically updated via refetch
      },
    }
  )

  const handleSave = async () => {
    if (settings) {
      await saveSettings(settings)
    }
  }

  const updateSetting = <K extends keyof VideoSettings>(key: K, value: VideoSettings[K]) => {
    if (settings) {
      setSettings({ ...settings, [key]: value })
    }
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="bg-white rounded-xl p-12 shadow-sm border border-gray-100 text-center">
          <div className="text-gray-400">جاري التحميل...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">إعدادات الجلسات المرئية</h1>
        <p className="text-sm text-gray-500 mt-1">تكوين إعدادات الجلسات المرئية والتسجيلات</p>
      </div>

      {/* Settings Form */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 space-y-6">
        {/* Provider */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            مزود الخدمة
          </label>
          <select
            value={settings?.provider || 'slack_huddle'}
            onChange={(e) => updateSetting('provider', e.target.value)}
            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="slack_huddle">Slack Huddle</option>
            <option value="zoom">Zoom</option>
            <option value="google_meet">Google Meet</option>
            <option value="custom">مخصص</option>
          </select>
        </div>

        {/* Recording Settings */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
            <Video size={20} />
            إعدادات التسجيل
          </h3>
          
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <label className="text-sm font-medium text-gray-700">تفعيل التسجيل</label>
              <p className="text-xs text-gray-500">السماح بتسجيل الجلسات المرئية</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings?.recording_enabled || false}
                onChange={(e) => updateSetting('recording_enabled', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
            </label>
          </div>

          {settings?.recording_enabled && (
            <>
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <label className="text-sm font-medium text-gray-700">تسجيل تلقائي</label>
                  <p className="text-xs text-gray-500">بدء التسجيل تلقائياً عند بدء الجلسة</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings?.auto_record || false}
                    onChange={(e) => updateSetting('auto_record', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  جودة التسجيل
                </label>
                <select
                  value={settings?.quality || 'high'}
                  onChange={(e) => updateSetting('quality', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="low">منخفضة</option>
                  <option value="medium">متوسطة</option>
                  <option value="high">عالية</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  المدة القصوى (دقيقة)
                </label>
                <input
                  type="number"
                  value={settings?.max_duration || 60}
                  onChange={(e) => updateSetting('max_duration', parseInt(e.target.value))}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  min="15"
                  max="180"
                />
              </div>
            </>
          )}
        </div>

        {/* Privacy Settings */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
            <Shield size={20} />
            إعدادات الخصوصية
          </h3>
          
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <label className="text-sm font-medium text-gray-700">طلب الموافقة</label>
              <p className="text-xs text-gray-500">طلب موافقة المريض قبل التسجيل</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings?.require_consent ?? true}
                onChange={(e) => updateSetting('require_consent', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
            </label>
          </div>
        </div>

        {/* Notifications */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
            <Mic size={20} />
            الإشعارات
          </h3>
          
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <label className="text-sm font-medium text-gray-700">تفعيل الإشعارات</label>
              <p className="text-xs text-gray-500">إرسال إشعارات عند بدء أو انتهاء الجلسات</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings?.notifications_enabled ?? true}
                onChange={(e) => updateSetting('notifications_enabled', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
            </label>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end pt-4 border-t border-gray-200">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 bg-primary text-white px-6 py-2 rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-50"
          >
            <Save size={18} />
            {saving ? 'جاري الحفظ...' : 'حفظ الإعدادات'}
          </button>
        </div>
      </div>
    </div>
  )
}

