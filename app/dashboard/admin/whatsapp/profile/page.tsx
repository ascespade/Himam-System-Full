'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { Save, RefreshCw, Image as ImageIcon, Building2, Mail, Globe, MapPin, Shield, Star, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'

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
  verification_status?: string
  quality_rating?: string
  quality_rating_updated_at?: string
  business_hours?: Record<string, any>
  two_step_verification_enabled?: boolean
  display_phone_number?: string
  account_type?: string
}

export default function WhatsAppBusinessProfilePage() {
  const [profile, setProfile] = useState<BusinessProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [formData, setFormData] = useState<Partial<BusinessProfile>>({})
  const [phoneNumberDetails, setPhoneNumberDetails] = useState<any>(null)
  const [verificationStatus, setVerificationStatus] = useState<any>(null)

  useEffect(() => {
    fetchProfile()
    fetchPhoneNumberDetails()
    fetchVerificationStatus()
    
    // Set up Realtime subscription
    const channel = supabase
      .channel('whatsapp_business_profiles_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'whatsapp_business_profiles',
        },
        () => {
          fetchProfile()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
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
    } catch (error: unknown) {
      const { logError } = await import('@/shared/utils/logger')
      logError('Error fetching WhatsApp profile', error, { endpoint: '/dashboard/admin/whatsapp/profile' })
      const errorMessage = error instanceof Error ? error.message : 'خطأ في تحميل البروفايل'
      toast.error(errorMessage)
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
    } catch (error: unknown) {
      const { logError } = await import('@/shared/utils/logger')
      logError('Error saving WhatsApp profile', error, { endpoint: '/dashboard/admin/whatsapp/profile' })
      const errorMessage = error instanceof Error ? error.message : 'خطأ في حفظ البروفايل'
      toast.error(errorMessage)
    } finally {
      setIsSaving(false)
    }
  }

  const fetchPhoneNumberDetails = async () => {
    try {
      const res = await fetch('/api/whatsapp/phone-number')
      const data = await res.json()
      if (data.success) {
        setPhoneNumberDetails(data.data)
      }
    } catch (error) {
      const { logError } = await import('@/shared/utils/logger')
      logError('Error fetching phone number details', error, { endpoint: '/dashboard/admin/whatsapp/profile' })
    }
  }

  const fetchVerificationStatus = async () => {
    try {
      const res = await fetch('/api/whatsapp/business-verification')
      const data = await res.json()
      if (data.success) {
        setVerificationStatus(data.data)
      }
    } catch (error) {
      const { logError } = await import('@/shared/utils/logger')
      logError('Error fetching verification status', error, { endpoint: '/dashboard/admin/whatsapp/profile' })
    }
  }

  const handleRefresh = async () => {
    setIsRefreshing(true)
    try {
      await Promise.all([
        fetchProfile(),
        fetchPhoneNumberDetails(),
        fetchVerificationStatus(),
      ])
      toast.success('تم تحديث جميع البيانات من Meta')
    } catch (error) {
      toast.error('فشل في تحديث البيانات')
    } finally {
      setIsRefreshing(false)
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
          disabled={isRefreshing}
          className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
        >
          <RefreshCw size={18} className={isRefreshing ? 'animate-spin' : ''} />
          {isRefreshing ? 'جارٍ التحديث...' : 'تحديث من Meta'}
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
            <Image
              src={formData.profile_picture_url}
              alt="Profile"
              width={96}
              height={96}
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

      {/* Account Status & Verification */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Shield size={24} className="text-primary" />
          حالة الحساب والتحقق
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Verification Status */}
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Shield size={18} className="text-gray-600" />
              <span className="text-sm font-medium text-gray-700">حالة التحقق</span>
            </div>
            <div className="flex items-center gap-2">
              {verificationStatus?.verification_status === 'verified' ? (
                <>
                  <CheckCircle size={20} className="text-green-500" />
                  <span className="text-green-700 font-bold">متحقق</span>
                </>
              ) : verificationStatus?.verification_status === 'pending' ? (
                <>
                  <AlertCircle size={20} className="text-yellow-500" />
                  <span className="text-yellow-700 font-bold">قيد المراجعة</span>
                </>
              ) : (
                <>
                  <XCircle size={20} className="text-red-500" />
                  <span className="text-red-700 font-bold">غير متحقق</span>
                </>
              )}
            </div>
            {verificationStatus?.account_review_status && (
              <p className="text-xs text-gray-500 mt-1">
                الحالة: {verificationStatus.account_review_status}
              </p>
            )}
          </div>

          {/* Quality Rating */}
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Star size={18} className="text-gray-600" />
              <span className="text-sm font-medium text-gray-700">تقييم الجودة</span>
            </div>
            {phoneNumberDetails?.quality_rating?.code ? (
              <div>
                <span className="text-lg font-bold text-gray-900">
                  {phoneNumberDetails.quality_rating.code === 'GREEN' ? '🟢' : 
                   phoneNumberDetails.quality_rating.code === 'YELLOW' ? '🟡' : '🔴'}
                  {' '}
                  {phoneNumberDetails.quality_rating.code}
                </span>
                {phoneNumberDetails.quality_rating.timestamp && (
                  <p className="text-xs text-gray-500 mt-1">
                    آخر تحديث: {new Date(phoneNumberDetails.quality_rating.timestamp * 1000).toLocaleDateString('ar-SA')}
                  </p>
                )}
              </div>
            ) : (
              <span className="text-gray-500">غير متوفر</span>
            )}
          </div>

          {/* Phone Number */}
          {phoneNumberDetails?.display_phone_number && (
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Mail size={18} className="text-gray-600" />
                <span className="text-sm font-medium text-gray-700">رقم الهاتف</span>
              </div>
              <span className="text-lg font-bold text-gray-900" dir="ltr">
                {phoneNumberDetails.display_phone_number}
              </span>
            </div>
          )}

          {/* Account Type */}
          {phoneNumberDetails?.account_type && (
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Building2 size={18} className="text-gray-600" />
                <span className="text-sm font-medium text-gray-700">نوع الحساب</span>
              </div>
              <span className="text-lg font-bold text-gray-900">
                {phoneNumberDetails.account_type}
              </span>
            </div>
          )}
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

