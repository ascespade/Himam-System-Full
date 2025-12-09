'use client'

import { Building2, Clock, DollarSign, Save, Settings, Users, XCircle, CheckCircle } from 'lucide-react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

interface ClinicSettings {
  is_open: boolean
  daily_capacity: number
  appointment_buffer_minutes: number
  allow_same_day_booking: boolean
  allow_online_booking: boolean
  booking_advance_days: number
  consultation_fee: number
  follow_up_fee: number
  notify_on_new_appointment: boolean
  notify_on_cancellation: boolean
  notify_before_appointment_minutes: number
  auto_open_time?: string
  auto_close_time?: string
}

export default function ClinicSettingsPage() {
  const [settings, setSettings] = useState<ClinicSettings>({
    is_open: false,
    daily_capacity: 20,
    appointment_buffer_minutes: 15,
    allow_same_day_booking: true,
    allow_online_booking: true,
    booking_advance_days: 30,
    consultation_fee: 0,
    follow_up_fee: 0,
    notify_on_new_appointment: true,
    notify_on_cancellation: true,
    notify_before_appointment_minutes: 30,
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/doctor/clinic/settings')
      const json = await res.json()
      if (json.success && json.data) {
        setSettings(json.data)
      }
    } catch (error) {
      console.error('Error fetching settings:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      const res = await fetch('/api/doctor/clinic/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      })

      const json = await res.json()
      if (json.success) {
        toast.success('تم حفظ الإعدادات بنجاح')
      } else {
        toast.error(json.error || 'حدث خطأ في الحفظ')
      }
    } catch (error) {
      toast.error('حدث خطأ في الحفظ')
    } finally {
      setSaving(false)
    }
  }

  const handleToggleClinic = async () => {
    try {
      const endpoint = settings.is_open ? '/api/doctor/clinic/close' : '/api/doctor/clinic/open'
      const res = await fetch(endpoint, { method: 'POST' })
      const json = await res.json()
      if (json.success) {
        setSettings((prev) => ({ ...prev, is_open: !prev.is_open }))
        toast.success(json.message || (settings.is_open ? 'تم إغلاق العيادة' : 'تم فتح العيادة'))
      }
    } catch (error) {
      toast.error('حدث خطأ')
    }
  }

  if (loading) {
    return (
      <div className="p-8">
        <div className="text-center py-12">جاري تحميل البيانات...</div>
      </div>
    )
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-extrabold text-gray-900 mb-2">إعدادات العيادة</h1>
        <p className="text-gray-500 text-lg">إدارة إعدادات العيادة والمواعيد</p>
      </div>

      {/* Clinic Status */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div
              className={`w-16 h-16 rounded-full flex items-center justify-center ${
                settings.is_open ? 'bg-green-100' : 'bg-red-100'
              }`}
            >
              <Building2
                size={32}
                className={settings.is_open ? 'text-green-600' : 'text-red-600'}
              />
            </div>
            <div>
              <h3 className="font-bold text-xl text-gray-900 mb-1">
                {settings.is_open ? 'العيادة مفتوحة' : 'العيادة مغلقة'}
              </h3>
              <p className="text-sm text-gray-500">الحالة الحالية للعيادة</p>
            </div>
          </div>
          <button
            onClick={handleToggleClinic}
            className={`px-8 py-4 rounded-xl font-bold text-lg transition-colors flex items-center gap-2 ${
              settings.is_open
                ? 'bg-red-600 hover:bg-red-700 text-white'
                : 'bg-green-600 hover:bg-green-700 text-white'
            }`}
          >
            {settings.is_open ? (
              <>
                <XCircle size={20} />
                إغلاق العيادة
              </>
            ) : (
              <>
                <CheckCircle size={20} />
                فتح العيادة
              </>
            )}
          </button>
        </div>
      </div>

      {/* Settings Sections */}
      <div className="space-y-6">
        {/* Capacity Settings */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center gap-3 mb-6">
            <Users className="text-primary" size={24} />
            <h2 className="text-xl font-bold text-gray-900">السعة والمواعيد</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                السعة اليومية
              </label>
              <input
                type="number"
                value={settings.daily_capacity}
                onChange={(e) =>
                  setSettings((prev) => ({ ...prev, daily_capacity: parseInt(e.target.value) || 20 }))
                }
                min="1"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                وقت الفاصل بين المواعيد (دقيقة)
              </label>
              <input
                type="number"
                value={settings.appointment_buffer_minutes}
                onChange={(e) =>
                  setSettings((prev) => ({
                    ...prev,
                    appointment_buffer_minutes: parseInt(e.target.value) || 15,
                  }))
                }
                min="0"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                عدد الأيام المتاحة للحجز مسبقاً
              </label>
              <input
                type="number"
                value={settings.booking_advance_days}
                onChange={(e) =>
                  setSettings((prev) => ({
                    ...prev,
                    booking_advance_days: parseInt(e.target.value) || 30,
                  }))
                }
                min="1"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                وقت الفتح التلقائي
              </label>
              <input
                type="time"
                value={settings.auto_open_time || ''}
                onChange={(e) =>
                  setSettings((prev) => ({ ...prev, auto_open_time: e.target.value || undefined }))
                }
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                وقت الإغلاق التلقائي
              </label>
              <input
                type="time"
                value={settings.auto_close_time || ''}
                onChange={(e) =>
                  setSettings((prev) => ({ ...prev, auto_close_time: e.target.value || undefined }))
                }
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>
        </div>

        {/* Booking Settings */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center gap-3 mb-6">
            <Settings className="text-primary" size={24} />
            <h2 className="text-xl font-bold text-gray-900">إعدادات الحجز</h2>
          </div>
          <div className="space-y-4">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.allow_same_day_booking}
                onChange={(e) =>
                  setSettings((prev) => ({ ...prev, allow_same_day_booking: e.target.checked }))
                }
                className="w-5 h-5 text-primary rounded focus:ring-primary"
              />
              <span className="text-gray-700 font-medium">السماح بالحجز في نفس اليوم</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.allow_online_booking}
                onChange={(e) =>
                  setSettings((prev) => ({ ...prev, allow_online_booking: e.target.checked }))
                }
                className="w-5 h-5 text-primary rounded focus:ring-primary"
              />
              <span className="text-gray-700 font-medium">السماح بالحجز عبر الإنترنت</span>
            </label>
          </div>
        </div>

        {/* Fees */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center gap-3 mb-6">
            <DollarSign className="text-primary" size={24} />
            <h2 className="text-xl font-bold text-gray-900">الرسوم</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                رسوم الاستشارة (ريال)
              </label>
              <input
                type="number"
                value={settings.consultation_fee}
                onChange={(e) =>
                  setSettings((prev) => ({ ...prev, consultation_fee: parseFloat(e.target.value) || 0 }))
                }
                min="0"
                step="0.01"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                رسوم المتابعة (ريال)
              </label>
              <input
                type="number"
                value={settings.follow_up_fee}
                onChange={(e) =>
                  setSettings((prev) => ({ ...prev, follow_up_fee: parseFloat(e.target.value) || 0 }))
                }
                min="0"
                step="0.01"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>
        </div>

        {/* Notifications */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center gap-3 mb-6">
            <Clock className="text-primary" size={24} />
            <h2 className="text-xl font-bold text-gray-900">الإشعارات</h2>
          </div>
          <div className="space-y-4">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.notify_on_new_appointment}
                onChange={(e) =>
                  setSettings((prev) => ({ ...prev, notify_on_new_appointment: e.target.checked }))
                }
                className="w-5 h-5 text-primary rounded focus:ring-primary"
              />
              <span className="text-gray-700 font-medium">الإشعار عند حجز موعد جديد</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.notify_on_cancellation}
                onChange={(e) =>
                  setSettings((prev) => ({ ...prev, notify_on_cancellation: e.target.checked }))
                }
                className="w-5 h-5 text-primary rounded focus:ring-primary"
              />
              <span className="text-gray-700 font-medium">الإشعار عند إلغاء موعد</span>
            </label>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                وقت التذكير قبل الموعد (دقيقة)
              </label>
              <input
                type="number"
                value={settings.notify_before_appointment_minutes}
                onChange={(e) =>
                  setSettings((prev) => ({
                    ...prev,
                    notify_before_appointment_minutes: parseInt(e.target.value) || 30,
                  }))
                }
                min="0"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="mt-8 flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-8 py-4 bg-primary hover:bg-primary-dark text-white rounded-xl font-bold text-lg transition-colors flex items-center gap-2 disabled:opacity-50"
        >
          <Save size={20} />
          {saving ? 'جاري الحفظ...' : 'حفظ الإعدادات'}
        </button>
      </div>
    </div>
  )
}
