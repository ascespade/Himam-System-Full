<<<<<<< HEAD
'use client'

import { useEffect, useState } from 'react'
import { Save, RefreshCw, Image as ImageIcon, Building2, Mail, Globe, MapPin } from 'lucide-react'
import { toast } from 'sonner'

interface BusinessProfile {
  id: string
  business_name: string
  business_description?: string
  business_category?: string
  business_email?: string
  business_website?: string
  business_address?: string
  profile_picture_url?: string
  cover_photo_url?: string
  phone_number_id: string
  is_active: boolean
}

export default function WhatsAppBusinessProfilePage() {
  const [profile, setProfile] = useState<BusinessProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [formData, setFormData] = useState<Partial<BusinessProfile>>({})

  useEffect(() => {
    fetchProfile()
  }, [])

  const fetchProfile = async () => {
    setIsLoading(true)
    try {
      const res = await fetch('/api/whatsapp/business-profile')
      const data = await res.json()
      if (data.success) {
        setProfile(data.data)
        setFormData(data.data)
      } else {
        toast.error('فشل في تحميل البروفايل: ' + data.error)
      }
    } catch (error: any) {
      console.error('Error fetching profile:', error)
      toast.error('خطأ في تحميل البروفايل')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const res = await fetch('/api/whatsapp/business-profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })
      const data = await res.json()
      if (data.success) {
        setProfile(data.data)
        toast.success('تم حفظ البروفايل بنجاح')
      } else {
        toast.error('فشل في حفظ البروفايل: ' + data.error)
      }
    } catch (error: any) {
      console.error('Error saving profile:', error)
      toast.error('خطأ في حفظ البروفايل')
    } finally {
      setIsSaving(false)
    }
  }

  const handleRefresh = async () => {
    setIsLoading(true)
    try {
      await fetchProfile()
      toast.success('تم تحديث البروفايل من Meta')
    } catch (error) {
      toast.error('فشل في تحديث البروفايل')
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">إدارة بروفايل الواتساب للأعمال</h1>
          <p className="text-gray-500 mt-1">إدارة معلومات المركز في الواتساب</p>
        </div>
        <button
          onClick={handleRefresh}
          className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
        >
          <RefreshCw size={18} />
          تحديث من Meta
        </button>
      </div>

      {/* Profile Picture Section */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
          <ImageIcon size={24} className="text-primary" />
          صورة البروفايل
        </h2>
        <div className="flex items-center gap-6">
          {formData.profile_picture_url ? (
            <img
              src={formData.profile_picture_url}
              alt="Profile"
              className="w-24 h-24 rounded-full object-cover border-4 border-gray-200"
            />
          ) : (
            <div className="w-24 h-24 rounded-full bg-gray-100 flex items-center justify-center border-4 border-gray-200">
              <ImageIcon size={32} className="text-gray-400" />
            </div>
          )}
          <div className="flex-1">
            <input
              type="url"
              placeholder="رابط صورة البروفايل"
              value={formData.profile_picture_url || ''}
              onChange={(e) => setFormData({ ...formData, profile_picture_url: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            />
            <p className="text-xs text-gray-500 mt-1">أدخل رابط الصورة من Meta Business Manager</p>
          </div>
        </div>
      </div>

      {/* Business Information */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Building2 size={24} className="text-primary" />
          معلومات المركز
        </h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">اسم المركز</label>
            <input
              type="text"
              value={formData.business_name || ''}
              onChange={(e) => setFormData({ ...formData, business_name: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">الوصف</label>
            <textarea
              rows={4}
              value={formData.business_description || ''}
              onChange={(e) => setFormData({ ...formData, business_description: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder="وصف مختصر عن المركز..."
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">التصنيف</label>
            <input
              type="text"
              value={formData.business_category || ''}
              onChange={(e) => setFormData({ ...formData, business_category: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder="مثال: مركز طبي، مركز تأهيل..."
            />
          </div>
        </div>
      </div>

      {/* Contact Information */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">معلومات التواصل</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
              <Mail size={16} />
              البريد الإلكتروني
            </label>
            <input
              type="email"
              value={formData.business_email || ''}
              onChange={(e) => setFormData({ ...formData, business_email: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
              <Globe size={16} />
              الموقع الإلكتروني
            </label>
            <input
              type="url"
              value={formData.business_website || ''}
              onChange={(e) => setFormData({ ...formData, business_website: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
              <MapPin size={16} />
              العنوان
            </label>
            <input
              type="text"
              value={formData.business_address || ''}
              onChange={(e) => setFormData({ ...formData, business_address: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-lg font-bold hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSaving ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              جاري الحفظ...
            </>
          ) : (
            <>
              <Save size={20} />
              حفظ التغييرات
            </>
          )}
        </button>
      </div>
    </div>
  )
}

=======
'use client'

import { useEffect, useState } from 'react'
import { Save, RefreshCw, Image as ImageIcon, Building2, Mail, Globe, MapPin } from 'lucide-react'
import { toast } from '@/shared/utils/toast'

interface BusinessProfile {
  id: string
  business_name: string
  business_description?: string
  business_category?: string
  business_email?: string
  business_website?: string
  business_address?: string
  profile_picture_url?: string
  cover_photo_url?: string
  phone_number_id: string
  is_active: boolean
}

export default function WhatsAppBusinessProfilePage() {
  const [profile, setProfile] = useState<BusinessProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [formData, setFormData] = useState<Partial<BusinessProfile>>({})

  useEffect(() => {
    fetchProfile()
  }, [])

  const fetchProfile = async () => {
    setIsLoading(true)
    try {
      const res = await fetch('/api/whatsapp/business-profile')
      const data = await res.json()
      if (data.success) {
        setProfile(data.data)
        setFormData(data.data)
      } else {
        toast.error('فشل في تحميل البروفايل: ' + data.error)
      }
    } catch (error: any) {
      console.error('Error fetching profile:', error)
      toast.error('خطأ في تحميل البروفايل')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const res = await fetch('/api/whatsapp/business-profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })
      const data = await res.json()
      if (data.success) {
        setProfile(data.data)
        toast.success('تم حفظ البروفايل بنجاح')
      } else {
        toast.error('فشل في حفظ البروفايل: ' + data.error)
      }
    } catch (error: any) {
      console.error('Error saving profile:', error)
      toast.error('خطأ في حفظ البروفايل')
    } finally {
      setIsSaving(false)
    }
  }

  const handleRefresh = async () => {
    setIsLoading(true)
    try {
      await fetchProfile()
      toast.success('تم تحديث البروفايل من Meta')
    } catch (error) {
      toast.error('فشل في تحديث البروفايل')
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">إدارة بروفايل الواتساب للأعمال</h1>
          <p className="text-gray-500 mt-1">إدارة معلومات المركز في الواتساب</p>
        </div>
        <button
          onClick={handleRefresh}
          className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
        >
          <RefreshCw size={18} />
          تحديث من Meta
        </button>
      </div>

      {/* Profile Picture Section */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
          <ImageIcon size={24} className="text-primary" />
          صورة البروفايل
        </h2>
        <div className="flex items-center gap-6">
          {formData.profile_picture_url ? (
            <img
              src={formData.profile_picture_url}
              alt="Profile"
              className="w-24 h-24 rounded-full object-cover border-4 border-gray-200"
            />
          ) : (
            <div className="w-24 h-24 rounded-full bg-gray-100 flex items-center justify-center border-4 border-gray-200">
              <ImageIcon size={32} className="text-gray-400" />
            </div>
          )}
          <div className="flex-1">
            <input
              type="url"
              placeholder="رابط صورة البروفايل"
              value={formData.profile_picture_url || ''}
              onChange={(e) => setFormData({ ...formData, profile_picture_url: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            />
            <p className="text-xs text-gray-500 mt-1">أدخل رابط الصورة من Meta Business Manager</p>
          </div>
        </div>
      </div>

      {/* Business Information */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Building2 size={24} className="text-primary" />
          معلومات المركز
        </h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">اسم المركز</label>
            <input
              type="text"
              value={formData.business_name || ''}
              onChange={(e) => setFormData({ ...formData, business_name: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">الوصف</label>
            <textarea
              rows={4}
              value={formData.business_description || ''}
              onChange={(e) => setFormData({ ...formData, business_description: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder="وصف مختصر عن المركز..."
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">التصنيف</label>
            <input
              type="text"
              value={formData.business_category || ''}
              onChange={(e) => setFormData({ ...formData, business_category: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder="مثال: مركز طبي، مركز تأهيل..."
            />
          </div>
        </div>
      </div>

      {/* Contact Information */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">معلومات التواصل</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
              <Mail size={16} />
              البريد الإلكتروني
            </label>
            <input
              type="email"
              value={formData.business_email || ''}
              onChange={(e) => setFormData({ ...formData, business_email: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
              <Globe size={16} />
              الموقع الإلكتروني
            </label>
            <input
              type="url"
              value={formData.business_website || ''}
              onChange={(e) => setFormData({ ...formData, business_website: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
              <MapPin size={16} />
              العنوان
            </label>
            <input
              type="text"
              value={formData.business_address || ''}
              onChange={(e) => setFormData({ ...formData, business_address: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-lg font-bold hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSaving ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              جاري الحفظ...
            </>
          ) : (
            <>
              <Save size={20} />
              حفظ التغييرات
            </>
          )}
        </button>
      </div>
    </div>
  )
}

>>>>>>> cursor/fix-code-errors-and-warnings-8041
