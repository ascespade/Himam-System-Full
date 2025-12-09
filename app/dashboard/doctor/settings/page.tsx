'use client'

import { Save, User, Mail, Phone, Calendar, GraduationCap, Award, Globe } from 'lucide-react'
import { useEffect, useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'

interface DoctorProfile {
  id: string
  user_id: string
  specialty?: string
  license_number?: string
  years_of_experience?: number
  education?: string[]
  certifications?: string[]
  languages?: string[]
  consultation_fee?: number
  bio_ar?: string
  bio_en?: string
  users?: {
    name: string
    email: string
    phone: string
  }
}

export default function DoctorSettingsPage() {
  const [profile, setProfile] = useState<DoctorProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    specialty: '',
    license_number: '',
    years_of_experience: 0,
    education: [] as string[],
    certifications: [] as string[],
    languages: [] as string[],
    consultation_fee: 0,
    bio_ar: '',
    bio_en: ''
  })

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  useEffect(() => {
    fetchProfile()
  }, [])

  const fetchProfile = async () => {
    try {
      setLoading(true)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const res = await fetch('/api/doctor/profile')
      const data = await res.json()
      if (data.success && data.data) {
        setProfile(data.data)
        setFormData({
          name: data.data.users?.name || '',
          email: data.data.users?.email || '',
          phone: data.data.users?.phone || '',
          specialty: data.data.specialty || '',
          license_number: data.data.license_number || '',
          years_of_experience: data.data.years_of_experience || 0,
          education: data.data.education || [],
          certifications: data.data.certifications || [],
          languages: data.data.languages || [],
          consultation_fee: data.data.consultation_fee || 0,
          bio_ar: data.data.bio_ar || '',
          bio_en: data.data.bio_en || ''
        })
      }
    } catch (error) {
      console.error('Error fetching profile:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      const res = await fetch('/api/doctor/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      const data = await res.json()
      if (data.success) {
        alert('تم حفظ التغييرات بنجاح')
        await fetchProfile()
      } else {
        alert('فشل في حفظ التغييرات: ' + (data.error || 'خطأ غير معروف'))
      }
    } catch (error) {
      console.error('Error saving profile:', error)
      alert('حدث خطأ أثناء حفظ التغييرات')
    } finally {
      setSaving(false)
    }
  }

  const addArrayItem = (field: 'education' | 'certifications' | 'languages') => {
    setFormData({
      ...formData,
      [field]: [...formData[field], '']
    })
  }

  const updateArrayItem = (field: 'education' | 'certifications' | 'languages', index: number, value: string) => {
    const newArray = [...formData[field]]
    newArray[index] = value
    setFormData({
      ...formData,
      [field]: newArray
    })
  }

  const removeArrayItem = (field: 'education' | 'certifications' | 'languages', index: number) => {
    setFormData({
      ...formData,
      [field]: formData[field].filter((_, i) => i !== index)
    })
  }

  if (loading) {
    return (
      <div className="p-8">
        <div className="text-center text-gray-500">جاري تحميل الملف الشخصي...</div>
      </div>
    )
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-4xl font-extrabold text-gray-900 mb-2">الإعدادات الشخصية</h1>
        <p className="text-gray-500 text-lg">إدارة ملفك الشخصي وإعداداتك</p>
      </div>

      <div className="space-y-6">
        {/* Basic Information */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <User size={24} className="text-primary" />
            المعلومات الأساسية
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">الاسم</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">البريد الإلكتروني</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                disabled
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">رقم الجوال</label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {/* Professional Information */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <GraduationCap size={24} className="text-primary" />
            المعلومات المهنية
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">التخصص</label>
              <select
                value={formData.specialty}
                onChange={(e) => setFormData({ ...formData, specialty: e.target.value })}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                <option value="">اختر التخصص</option>
                <option value="speech_therapy">علاج النطق والتخاطب</option>
                <option value="behavior_modification">تعديل السلوك</option>
                <option value="occupational_therapy">العلاج الوظيفي</option>
                <option value="sensory_integration">التكامل الحسي</option>
                <option value="early_intervention">التدخل المبكر</option>
                <option value="autism_therapy">علاج التوحد</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">رقم الرخصة</label>
              <input
                type="text"
                value={formData.license_number}
                onChange={(e) => setFormData({ ...formData, license_number: e.target.value })}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">سنوات الخبرة</label>
              <input
                type="number"
                value={formData.years_of_experience}
                onChange={(e) => setFormData({ ...formData, years_of_experience: parseInt(e.target.value) || 0 })}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                min="0"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">رسوم الاستشارة (ريال)</label>
              <input
                type="number"
                value={formData.consultation_fee}
                onChange={(e) => setFormData({ ...formData, consultation_fee: parseFloat(e.target.value) || 0 })}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                min="0"
                step="0.01"
              />
            </div>
          </div>
        </div>

        {/* Education */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <Award size={24} className="text-primary" />
              التعليم والشهادات
            </h2>
            <button
              onClick={() => addArrayItem('education')}
              className="text-sm text-primary hover:underline font-bold"
            >
              + إضافة
            </button>
          </div>
          <div className="space-y-2">
            {formData.education.map((item, index) => (
              <div key={index} className="flex gap-2">
                <input
                  type="text"
                  value={item}
                  onChange={(e) => updateArrayItem('education', index, e.target.value)}
                  placeholder="مثال: بكالوريوس علاج النطق - جامعة الملك سعود"
                  className="flex-1 px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                />
                <button
                  onClick={() => removeArrayItem('education', index)}
                  className="px-3 py-2 text-red-500 hover:bg-red-50 rounded-lg"
                >
                  ×
                </button>
              </div>
            ))}
            {formData.education.length === 0 && (
              <p className="text-sm text-gray-400">لا توجد شهادات</p>
            )}
          </div>
        </div>

        {/* Certifications */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <Award size={24} className="text-primary" />
              الشهادات المهنية
            </h2>
            <button
              onClick={() => addArrayItem('certifications')}
              className="text-sm text-primary hover:underline font-bold"
            >
              + إضافة
            </button>
          </div>
          <div className="space-y-2">
            {formData.certifications.map((item, index) => (
              <div key={index} className="flex gap-2">
                <input
                  type="text"
                  value={item}
                  onChange={(e) => updateArrayItem('certifications', index, e.target.value)}
                  placeholder="مثال: شهادة معتمدة في علاج التوحد"
                  className="flex-1 px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                />
                <button
                  onClick={() => removeArrayItem('certifications', index)}
                  className="px-3 py-2 text-red-500 hover:bg-red-50 rounded-lg"
                >
                  ×
                </button>
              </div>
            ))}
            {formData.certifications.length === 0 && (
              <p className="text-sm text-gray-400">لا توجد شهادات</p>
            )}
          </div>
        </div>

        {/* Languages */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <Globe size={24} className="text-primary" />
              اللغات
            </h2>
            <button
              onClick={() => addArrayItem('languages')}
              className="text-sm text-primary hover:underline font-bold"
            >
              + إضافة
            </button>
          </div>
          <div className="space-y-2">
            {formData.languages.map((item, index) => (
              <div key={index} className="flex gap-2">
                <input
                  type="text"
                  value={item}
                  onChange={(e) => updateArrayItem('languages', index, e.target.value)}
                  placeholder="مثال: العربية، الإنجليزية"
                  className="flex-1 px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                />
                <button
                  onClick={() => removeArrayItem('languages', index)}
                  className="px-3 py-2 text-red-500 hover:bg-red-50 rounded-lg"
                >
                  ×
                </button>
              </div>
            ))}
            {formData.languages.length === 0 && (
              <p className="text-sm text-gray-400">لا توجد لغات</p>
            )}
          </div>
        </div>

        {/* Bio */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">نبذة عني</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">بالعربية</label>
              <textarea
                rows={4}
                value={formData.bio_ar}
                onChange={(e) => setFormData({ ...formData, bio_ar: e.target.value })}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="اكتب نبذة عنك بالعربية..."
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">بالإنجليزية</label>
              <textarea
                rows={4}
                value={formData.bio_en}
                onChange={(e) => setFormData({ ...formData, bio_en: e.target.value })}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="Write a brief bio in English..."
              />
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-8 py-3 bg-primary text-white rounded-lg font-bold hover:bg-primary-dark transition-colors disabled:opacity-50"
          >
            <Save size={20} />
            {saving ? 'جاري الحفظ...' : 'حفظ التغييرات'}
          </button>
        </div>
      </div>
    </div>
  )
}

