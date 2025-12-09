'use client'

/**
 * Reception Settings Page
 * Manage reception settings and preferences
 */

import { useEffect, useState } from 'react'
import { Settings, Bell, Clock, Save, User, Building2 } from 'lucide-react'
import { toast } from 'sonner'

interface ReceptionSettings {
  notifications: {
    appointment_reminders: boolean
    queue_updates: boolean
    payment_notifications: boolean
    new_patient_alerts: boolean
  }
  queue: {
    auto_assign_numbers: boolean
    allow_walk_ins: boolean
    max_queue_size: number
    estimated_wait_time: number
  }
  display: {
    show_patient_photos: boolean
    show_insurance_info: boolean
    theme: 'light' | 'dark' | 'auto'
  }
}

export default function ReceptionSettingsPage() {
  const [settings, setSettings] = useState<ReceptionSettings>({
    notifications: {
      appointment_reminders: true,
      queue_updates: true,
      payment_notifications: true,
      new_patient_alerts: true,
    },
    queue: {
      auto_assign_numbers: true,
      allow_walk_ins: true,
      max_queue_size: 50,
      estimated_wait_time: 15,
    },
    display: {
      show_patient_photos: true,
      show_insurance_info: true,
      theme: 'light',
    },
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/reception/settings')
      const data = await res.json()
      if (data.success && data.data) {
        setSettings(data.data)
      }
    } catch (error) {
      console.error('Error loading settings:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await fetch('/api/reception/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      })
      const data = await res.json()

      if (data.success) {
        toast.success('تم حفظ الإعدادات بنجاح')
      } else {
        toast.error('فشل حفظ الإعدادات')
      }
    } catch (error) {
      console.error('Error saving settings:', error)
      toast.error('فشل حفظ الإعدادات')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="p-8">
        <div className="text-center text-gray-500">جاري تحميل الإعدادات...</div>
      </div>
    )
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-extrabold text-gray-900 mb-2">إعدادات الاستقبال</h1>
        <p className="text-gray-500 text-lg">إدارة إعدادات الاستقبال والتفضيلات</p>
      </div>

      <div className="space-y-6">
        {/* Notifications Settings */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Bell size={20} />
            الإشعارات
          </h2>

          <div className="space-y-4">
            {Object.entries(settings.notifications).map(([key, value]) => (
              <div key={key} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <label className="text-sm font-medium text-gray-700">
                    {key === 'appointment_reminders' && 'تذكيرات المواعيد'}
                    {key === 'queue_updates' && 'تحديثات الطابور'}
                    {key === 'payment_notifications' && 'إشعارات المدفوعات'}
                    {key === 'new_patient_alerts' && 'تنبيهات المرضى الجدد'}
                  </label>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={value}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        notifications: { ...settings.notifications, [key]: e.target.checked },
                      })
                    }
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                </label>
              </div>
            ))}
          </div>
        </div>

        {/* Queue Settings */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Clock size={20} />
            إعدادات الطابور
          </h2>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <label className="text-sm font-medium text-gray-700">تعيين الأرقام تلقائياً</label>
                <p className="text-xs text-gray-500">تعيين أرقام الطابور تلقائياً للمرضى</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.queue.auto_assign_numbers}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      queue: { ...settings.queue, auto_assign_numbers: e.target.checked },
                    })
                  }
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
              </label>
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <label className="text-sm font-medium text-gray-700">السماح بالمراجعين بدون موعد</label>
                <p className="text-xs text-gray-500">السماح بإضافة مرضى بدون موعد مسبق</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.queue.allow_walk_ins}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      queue: { ...settings.queue, allow_walk_ins: e.target.checked },
                    })
                  }
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
              </label>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">الحد الأقصى لحجم الطابور</label>
              <input
                type="number"
                value={settings.queue.max_queue_size}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    queue: { ...settings.queue, max_queue_size: parseInt(e.target.value) },
                  })
                }
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                min="10"
                max="200"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">الوقت المتوقع للانتظار (دقيقة)</label>
              <input
                type="number"
                value={settings.queue.estimated_wait_time}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    queue: { ...settings.queue, estimated_wait_time: parseInt(e.target.value) },
                  })
                }
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                min="5"
                max="120"
              />
            </div>
          </div>
        </div>

        {/* Display Settings */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Building2 size={20} />
            إعدادات العرض
          </h2>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <label className="text-sm font-medium text-gray-700">عرض صور المرضى</label>
                <p className="text-xs text-gray-500">عرض صور المرضى في قوائم الطابور</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.display.show_patient_photos}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      display: { ...settings.display, show_patient_photos: e.target.checked },
                    })
                  }
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
              </label>
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <label className="text-sm font-medium text-gray-700">عرض معلومات التأمين</label>
                <p className="text-xs text-gray-500">عرض معلومات التأمين في بطاقات المرضى</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.display.show_insurance_info}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      display: { ...settings.display, show_insurance_info: e.target.checked },
                    })
                  }
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
              </label>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">المظهر</label>
              <select
                value={settings.display.theme}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    display: { ...settings.display, theme: e.target.value as 'light' | 'dark' | 'auto' },
                  })
                }
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="light">فاتح</option>
                <option value="dark">داكن</option>
                <option value="auto">تلقائي</option>
              </select>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 bg-primary text-white px-6 py-3 rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-50"
          >
            <Save size={18} />
            {saving ? 'جاري الحفظ...' : 'حفظ الإعدادات'}
          </button>
        </div>
      </div>
    </div>
  )
}
