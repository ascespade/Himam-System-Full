'use client'

/**
 * Patient Settings Page
 * Manage patient account settings and preferences
 */

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'
import { Settings, User, Bell, Shield, Save, Phone, Mail, Calendar } from 'lucide-react'
import { toast } from 'sonner'

interface PatientSettings {
  profile: {
    name: string
    phone: string
    email?: string
    date_of_birth?: string
    gender?: string
    blood_type?: string
    address?: string
  }
  notifications: {
    email_notifications: boolean
    sms_notifications: boolean
    appointment_reminders: boolean
    medication_reminders: boolean
    lab_results: boolean
  }
  privacy: {
    share_data_with_doctors: boolean
    allow_guardian_access: boolean
    data_retention: string
  }
}

export default function PatientSettingsPage() {
  const router = useRouter()
  const [settings, setSettings] = useState<PatientSettings>({
    profile: {
      name: '',
      phone: '',
      email: '',
    },
    notifications: {
      email_notifications: true,
      sms_notifications: true,
      appointment_reminders: true,
      medication_reminders: true,
      lab_results: true,
    },
    privacy: {
      share_data_with_doctors: true,
      allow_guardian_access: false,
      data_retention: 'indefinite',
    },
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    try {
      setLoading(true)

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }

      const patientRes = await fetch(`/api/patients?user_id=${user.id}`)
      const patientData = await patientRes.json()
      if (patientData.success && patientData.data?.length > 0) {
        const patientInfo = patientData.data[0]
        setSettings((prev) => ({
          ...prev,
          profile: {
            name: patientInfo.name || '',
            phone: patientInfo.phone || '',
            email: patientInfo.email || '',
            date_of_birth: patientInfo.date_of_birth || '',
            gender: patientInfo.gender || '',
            blood_type: patientInfo.blood_type || '',
            address: patientInfo.address || '',
          },
        }))

        // Load settings
        const settingsRes = await fetch(`/api/patients/${patientInfo.id}/settings`)
        const settingsData = await settingsRes.json()
        if (settingsData.success && settingsData.data) {
          setSettings((prev) => ({
            ...prev,
            notifications: settingsData.data.notifications || prev.notifications,
            privacy: settingsData.data.privacy || prev.privacy,
          }))
        }
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
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const patientRes = await fetch(`/api/patients?user_id=${user.id}`)
      const patientData = await patientRes.json()
      if (patientData.success && patientData.data?.length > 0) {
        const patientInfo = patientData.data[0]

        const response = await fetch(`/api/patients/${patientInfo.id}/settings`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            profile: settings.profile,
            notifications: settings.notifications,
            privacy: settings.privacy,
          }),
        })

        const data = await response.json()

        if (data.success) {
          toast.success('تم حفظ الإعدادات بنجاح')
        } else {
          toast.error('فشل حفظ الإعدادات')
        }
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
        <h1 className="text-4xl font-extrabold text-gray-900 mb-2">الإعدادات</h1>
        <p className="text-gray-500 text-lg">إدارة إعدادات الحساب والتفضيلات</p>
      </div>

      <div className="space-y-6">
        {/* Profile Settings */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <User size={20} />
            المعلومات الشخصية
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">الاسم</label>
              <input
                type="text"
                value={settings.profile.name}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    profile: { ...settings.profile, name: e.target.value },
                  })
                }
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">الهاتف</label>
              <input
                type="tel"
                value={settings.profile.phone}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    profile: { ...settings.profile, phone: e.target.value },
                  })
                }
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">البريد الإلكتروني</label>
              <input
                type="email"
                value={settings.profile.email}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    profile: { ...settings.profile, email: e.target.value },
                  })
                }
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">تاريخ الميلاد</label>
              <input
                type="date"
                value={settings.profile.date_of_birth || ''}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    profile: { ...settings.profile, date_of_birth: e.target.value },
                  })
                }
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">الجنس</label>
              <select
                value={settings.profile.gender || ''}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    profile: { ...settings.profile, gender: e.target.value },
                  })
                }
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">اختر</option>
                <option value="male">ذكر</option>
                <option value="female">أنثى</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">فصيلة الدم</label>
              <select
                value={settings.profile.blood_type || ''}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    profile: { ...settings.profile, blood_type: e.target.value },
                  })
                }
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">اختر</option>
                <option value="A+">A+</option>
                <option value="A-">A-</option>
                <option value="B+">B+</option>
                <option value="B-">B-</option>
                <option value="AB+">AB+</option>
                <option value="AB-">AB-</option>
                <option value="O+">O+</option>
                <option value="O-">O-</option>
              </select>
            </div>
          </div>
        </div>

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
                    {key === 'email_notifications' && 'الإشعارات عبر البريد'}
                    {key === 'sms_notifications' && 'الإشعارات عبر الرسائل'}
                    {key === 'appointment_reminders' && 'تذكيرات المواعيد'}
                    {key === 'medication_reminders' && 'تذكيرات الأدوية'}
                    {key === 'lab_results' && 'نتائج التحاليل'}
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

        {/* Privacy Settings */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Shield size={20} />
            الخصوصية
          </h2>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <label className="text-sm font-medium text-gray-700">مشاركة البيانات مع الأطباء</label>
                <p className="text-xs text-gray-500">السماح للأطباء بالوصول إلى بياناتك الطبية</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.privacy.share_data_with_doctors}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      privacy: {
                        ...settings.privacy,
                        share_data_with_doctors: e.target.checked,
                      },
                    })
                  }
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
              </label>
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <label className="text-sm font-medium text-gray-700">السماح لولي الأمر بالوصول</label>
                <p className="text-xs text-gray-500">السماح لولي الأمر بالاطلاع على بياناتك</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.privacy.allow_guardian_access}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      privacy: {
                        ...settings.privacy,
                        allow_guardian_access: e.target.checked,
                      },
                    })
                  }
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
              </label>
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
