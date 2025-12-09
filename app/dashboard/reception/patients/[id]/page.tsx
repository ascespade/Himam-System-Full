'use client'

import { ArrowRight, Edit, Phone, Mail, Calendar, MapPin, FileText, User, Heart, AlertCircle, Save, X } from 'lucide-react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'
// import { toast } } from 'sonner' // TODO: Install sonner package
const toast = {
  success: (message: string) => console.log('Success:', message),
  error: (message: string) => console.error('Error:', message),
  info: (message: string) => console.info('Info:', message),
} // TODO: Install sonner package
const toast = {
  success: (message: string) => console.log('Success:', message),
  error: (message: string) => console.error('Error:', message),
  info: (message: string) => console.info('Info:', message),
}

interface Patient {
  id: string
  name: string
  phone: string
  email?: string
  date_of_birth?: string
  gender?: 'male' | 'female'
  nationality?: string
  address?: string
  blood_type?: string
  allergies?: string[]
  chronic_diseases?: string[]
  emergency_contact_name?: string
  emergency_contact_phone?: string
  notes?: string
  status: string
  created_at: string
  insurance?: {
    provider: string
    policy_number: string
    is_active: boolean
  } | null
}

export default function PatientDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const isEdit = searchParams.get('edit') === 'true'
  const [patient, setPatient] = useState<Patient | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [editMode, setEditMode] = useState(isEdit)

  useEffect(() => {
    fetchPatient()
  }, [params.id])

  const fetchPatient = async () => {
    try {
      setLoading(true)
      const res = await fetch(`/api/reception/patients/${params.id}`)
      const data = await res.json()
      if (data.success) {
        setPatient(data.data)
      } else {
        toast.error('فشل تحميل بيانات المريض')
        router.push('/dashboard/reception/patients')
      }
    } catch (error) {
      console.error('Error fetching patient:', error)
      toast.error('حدث خطأ أثناء تحميل البيانات')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async (updatedData: Partial<Patient>) => {
    try {
      setSaving(true)
      const res = await fetch(`/api/reception/patients/${params.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedData)
      })
      const data = await res.json()
      if (data.success) {
        toast.success('تم تحديث المريض بنجاح')
        setEditMode(false)
        fetchPatient()
      } else {
        toast.error(data.error || 'فشل التحديث')
      }
    } catch (error) {
      toast.error('حدث خطأ أثناء الحفظ')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-500">جاري التحميل...</p>
        </div>
      </div>
    )
  }

  if (!patient) {
    return (
      <div className="p-8 text-center">
        <p className="text-gray-500">المريض غير موجود</p>
      </div>
    )
  }

  return (
    <div className="p-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
          <span className="cursor-pointer hover:text-primary" onClick={() => router.push('/dashboard/reception')}>الاستقبال</span>
          <ArrowRight size={14} />
          <span className="cursor-pointer hover:text-primary" onClick={() => router.push('/dashboard/reception/patients')}>المرضى</span>
          <ArrowRight size={14} />
          <span className="font-bold text-gray-900">{patient.name}</span>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-extrabold text-gray-900 mb-2">{patient.name}</h1>
            <p className="text-gray-500 text-lg">ملف المريض الكامل</p>
          </div>
          <div className="flex gap-2">
            {!editMode ? (
              <button
                onClick={() => setEditMode(true)}
                className="bg-primary hover:bg-primary-dark text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-colors"
              >
                <Edit size={20} />
                تعديل
              </button>
            ) : (
              <>
                <button
                  onClick={() => setEditMode(false)}
                  className="px-6 py-3 border border-gray-200 text-gray-600 font-bold rounded-xl hover:bg-gray-50 transition-colors flex items-center gap-2"
                >
                  <X size={20} />
                  إلغاء
                </button>
                <button
                  onClick={() => handleSave(patient)}
                  disabled={saving}
                  className="bg-primary hover:bg-primary-dark text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-colors disabled:opacity-50"
                >
                  <Save size={20} />
                  {saving ? 'جاري الحفظ...' : 'حفظ'}
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Patient Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Basic Information */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <User size={20} />
            المعلومات الأساسية
          </h2>
          <div className="space-y-4">
            <div>
              <label className="text-sm text-gray-500">الاسم الكامل</label>
              <div className="font-bold text-gray-900">{patient.name}</div>
            </div>
            <div>
              <label className="text-sm text-gray-500">رقم الهاتف</label>
              <div className="font-bold text-gray-900 flex items-center gap-2">
                <Phone size={16} />
                {patient.phone}
              </div>
            </div>
            {patient.email && (
              <div>
                <label className="text-sm text-gray-500">البريد الإلكتروني</label>
                <div className="font-bold text-gray-900 flex items-center gap-2">
                  <Mail size={16} />
                  {patient.email}
                </div>
              </div>
            )}
            {patient.date_of_birth && (
              <div>
                <label className="text-sm text-gray-500">تاريخ الميلاد</label>
                <div className="font-bold text-gray-900 flex items-center gap-2">
                  <Calendar size={16} />
                  {new Date(patient.date_of_birth).toLocaleDateString('ar-SA')}
                </div>
              </div>
            )}
            {patient.gender && (
              <div>
                <label className="text-sm text-gray-500">الجنس</label>
                <div className="font-bold text-gray-900">{patient.gender === 'male' ? 'ذكر' : 'أنثى'}</div>
              </div>
            )}
            {patient.nationality && (
              <div>
                <label className="text-sm text-gray-500">الجنسية</label>
                <div className="font-bold text-gray-900">{patient.nationality}</div>
              </div>
            )}
            {patient.address && (
              <div>
                <label className="text-sm text-gray-500">العنوان</label>
                <div className="font-bold text-gray-900 flex items-center gap-2">
                  <MapPin size={16} />
                  {patient.address}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Medical Information */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <FileText size={20} />
            المعلومات الطبية
          </h2>
          <div className="space-y-4">
            {patient.blood_type && (
              <div>
                <label className="text-sm text-gray-500">فصيلة الدم</label>
                <div className="font-bold text-gray-900 flex items-center gap-2">
                  <Heart size={16} />
                  {patient.blood_type}
                </div>
              </div>
            )}
            {patient.allergies && patient.allergies.length > 0 && (
              <div>
                <label className="text-sm text-gray-500">الحساسيات</label>
                <div className="font-bold text-gray-900">
                  {patient.allergies.join(', ')}
                </div>
              </div>
            )}
            {patient.chronic_diseases && patient.chronic_diseases.length > 0 && (
              <div>
                <label className="text-sm text-gray-500">الأمراض المزمنة</label>
                <div className="font-bold text-gray-900">
                  {patient.chronic_diseases.join(', ')}
                </div>
              </div>
            )}
            {patient.emergency_contact_name && (
              <div>
                <label className="text-sm text-gray-500">جهة الاتصال في الطوارئ</label>
                <div className="font-bold text-gray-900">{patient.emergency_contact_name}</div>
                {patient.emergency_contact_phone && (
                  <div className="text-sm text-gray-600 flex items-center gap-2">
                    <Phone size={14} />
                    {patient.emergency_contact_phone}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Insurance & Notes */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Insurance */}
        {patient.insurance && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">معلومات التأمين</h2>
            <div className="space-y-2">
              <div>
                <label className="text-sm text-gray-500">شركة التأمين</label>
                <div className="font-bold text-gray-900">{patient.insurance.provider}</div>
              </div>
              <div>
                <label className="text-sm text-gray-500">رقم البوليصة</label>
                <div className="font-bold text-gray-900">{patient.insurance.policy_number}</div>
              </div>
              <div>
                <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                  patient.insurance.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                }`}>
                  {patient.insurance.is_active ? 'نشط' : 'غير نشط'}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Notes */}
        {patient.notes && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">ملاحظات</h2>
            <p className="text-gray-700">{patient.notes}</p>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">إجراءات سريعة</h2>
        <div className="flex flex-wrap gap-4">
          <button
            onClick={() => router.push(`/dashboard/reception/appointments/new?patient_id=${patient.id}`)}
            className="bg-primary hover:bg-primary-dark text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-colors"
          >
            <Calendar size={20} />
            حجز موعد
          </button>
          <button
            onClick={() => router.push(`/dashboard/reception/queue?patient_id=${patient.id}`)}
            className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-colors"
          >
            <User size={20} />
            إضافة للطابور
          </button>
        </div>
      </div>
    </div>
  )
}
