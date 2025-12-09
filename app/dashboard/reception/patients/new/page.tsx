'use client'

import { Save, Search, User, Phone, Calendar, Mail, MapPin, FileText, AlertCircle, CheckCircle, ArrowRight } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
// import { toast } from 'sonner' // TODO: Install sonner package
const toast = {
  success: (message: string) => console.log('Success:', message),
  error: (message: string) => console.error('Error:', message),
  info: (message: string) => console.info('Info:', message),
}

interface PatientFormData {
  name: string
  phone: string
  email?: string
  date_of_birth?: string
  gender?: 'male' | 'female'
  nationality?: string
  address?: string
  blood_type?: string
  allergies?: string
  chronic_diseases?: string
  emergency_contact_name?: string
  emergency_contact_phone?: string
  insurance_provider?: string
  insurance_number?: string
  notes?: string
}

export default function NewPatientPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [checkingDuplicate, setCheckingDuplicate] = useState(false)
  const [duplicateMatches, setDuplicateMatches] = useState<any[]>([])
  const [showDuplicateWarning, setShowDuplicateWarning] = useState(false)
  const [formData, setFormData] = useState<PatientFormData>({
    name: '',
    phone: '',
    email: '',
    date_of_birth: '',
    gender: undefined,
    nationality: '',
    address: '',
    blood_type: '',
    allergies: '',
    chronic_diseases: '',
    emergency_contact_name: '',
    emergency_contact_phone: '',
    insurance_provider: '',
    insurance_number: '',
    notes: ''
  })

  // Check for duplicate when phone is entered
  useEffect(() => {
    const checkDuplicate = async () => {
      if (formData.phone && formData.phone.length >= 10) {
        setCheckingDuplicate(true)
        try {
          const res = await fetch('/api/reception/patients/check-duplicate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ phone: formData.phone })
          })
          const data = await res.json()
          if (data.success) {
            if (data.data.isDuplicate) {
              setDuplicateMatches(data.data.matches)
              setShowDuplicateWarning(true)
            } else {
              setDuplicateMatches([])
              setShowDuplicateWarning(false)
            }
          }
        } catch (error) {
          console.error('Error checking duplicate:', error)
        } finally {
          setCheckingDuplicate(false)
        }
      } else {
        setDuplicateMatches([])
        setShowDuplicateWarning(false)
      }
    }

    const timeoutId = setTimeout(checkDuplicate, 500) // Debounce
    return () => clearTimeout(timeoutId)
  }, [formData.phone])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Validate required fields
      if (!formData.name || !formData.phone) {
        toast.error('الاسم ورقم الهاتف مطلوبان')
        setLoading(false)
        return
      }

      // If duplicate warning is shown, require confirmation
      if (showDuplicateWarning && duplicateMatches.length > 0) {
        const confirmed = window.confirm(
          `يوجد مريض بنفس رقم الهاتف. هل تريد المتابعة؟\n\n${duplicateMatches.map((m: any) => `${m.name} - ${m.phone}`).join('\n')}`
        )
        if (!confirmed) {
          setLoading(false)
          return
        }
      }

      const res = await fetch('/api/reception/patients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          phone: formData.phone,
          email: formData.email || null,
          date_of_birth: formData.date_of_birth || null,
          gender: formData.gender || null,
          nationality: formData.nationality || null,
          address: formData.address || null,
          blood_type: formData.blood_type || null,
          allergies: formData.allergies ? formData.allergies.split(',').map(a => a.trim()) : null,
          chronic_diseases: formData.chronic_diseases ? formData.chronic_diseases.split(',').map(d => d.trim()) : null,
          emergency_contact_name: formData.emergency_contact_name || null,
          emergency_contact_phone: formData.emergency_contact_phone || null,
          insurance_provider: formData.insurance_provider || null,
          insurance_number: formData.insurance_number || null,
          notes: formData.notes || null
        })
      })

      const data = await res.json()

      if (data.success) {
        toast.success('تم تسجيل المريض بنجاح')
        router.push(`/dashboard/reception/patients/${data.data.id}`)
      } else {
        toast.error(data.error || 'فشل تسجيل المريض')
      }
    } catch (error: any) {
      toast.error(error.message || 'حدث خطأ أثناء التسجيل')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8 flex items-center gap-2 text-sm text-gray-500">
        <span className="cursor-pointer hover:text-primary" onClick={() => router.push('/dashboard/reception')}>الاستقبال</span>
        <ArrowRight size={14} />
        <span className="cursor-pointer hover:text-primary" onClick={() => router.push('/dashboard/reception/patients')}>المرضى</span>
        <ArrowRight size={14} />
        <span className="font-bold text-gray-900">تسجيل مريض جديد</span>
      </div>

      <div className="mb-8">
        <h1 className="text-4xl font-extrabold text-gray-900 mb-2">تسجيل مريض جديد</h1>
        <p className="text-gray-500 text-lg">إضافة مريض جديد للنظام</p>
      </div>

      {/* Duplicate Warning */}
      {showDuplicateWarning && duplicateMatches.length > 0 && (
        <div className="bg-yellow-50 border-2 border-yellow-200 rounded-2xl p-4 mb-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="text-yellow-600 mt-1" size={20} />
            <div className="flex-1">
              <div className="font-bold text-yellow-900 mb-2">تنبيه: مريض موجود</div>
              <div className="text-sm text-yellow-700 mb-3">
                تم العثور على {duplicateMatches.length} مريض بنفس رقم الهاتف:
              </div>
              <div className="space-y-2">
                {duplicateMatches.map((match: any) => (
                  <div
                    key={match.id}
                    className="bg-white rounded-lg p-3 flex items-center justify-between cursor-pointer hover:bg-gray-50"
                    onClick={() => router.push(`/dashboard/reception/patients/${match.id}`)}
                  >
                    <div>
                      <div className="font-bold text-gray-900">{match.name}</div>
                      <div className="text-sm text-gray-500">{match.phone}</div>
                    </div>
                    <div className="text-xs text-gray-400">
                      {new Date(match.created_at).toLocaleDateString('ar-SA')}
                    </div>
                  </div>
                ))}
              </div>
              <div className="text-xs text-yellow-700 mt-3">
                يمكنك المتابعة لتسجيل مريض جديد أو النقر على المريض الموجود للعرض
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 space-y-6">
        {/* Basic Information */}
        <div className="border-b border-gray-200 pb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <User size={20} />
            المعلومات الأساسية
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">الاسم الكامل *</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="أدخل الاسم الكامل"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">رقم الهاتف *</label>
              <div className="relative">
                <Phone className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="tel"
                  required
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full pr-12 pl-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="05xxxxxxxx"
                />
                {checkingDuplicate && (
                  <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                  </div>
                )}
              </div>
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">البريد الإلكتروني</label>
              <div className="relative">
                <Mail className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full pr-12 pl-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="example@email.com"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">تاريخ الميلاد</label>
              <div className="relative">
                <Calendar className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="date"
                  value={formData.date_of_birth}
                  onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
                  className="w-full pr-12 pl-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">الجنس</label>
              <select
                value={formData.gender || ''}
                onChange={(e) => setFormData({ ...formData, gender: e.target.value as 'male' | 'female' || undefined })}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                <option value="">اختر الجنس</option>
                <option value="male">ذكر</option>
                <option value="female">أنثى</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">الجنسية</label>
              <input
                type="text"
                value={formData.nationality}
                onChange={(e) => setFormData({ ...formData, nationality: e.target.value })}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="الجنسية"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-bold text-gray-700 mb-2">العنوان</label>
              <div className="relative">
                <MapPin className="absolute right-4 top-4 text-gray-400" size={20} />
                <textarea
                  rows={2}
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full pr-12 pl-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="العنوان الكامل"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Medical Information */}
        <div className="border-b border-gray-200 pb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <FileText size={20} />
            المعلومات الطبية
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">فصيلة الدم</label>
              <select
                value={formData.blood_type}
                onChange={(e) => setFormData({ ...formData, blood_type: e.target.value })}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                <option value="">اختر فصيلة الدم</option>
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
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">الحساسيات (مفصولة بفواصل)</label>
              <input
                type="text"
                value={formData.allergies}
                onChange={(e) => setFormData({ ...formData, allergies: e.target.value })}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="مثال: دواء X، طعام Y"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-bold text-gray-700 mb-2">الأمراض المزمنة (مفصولة بفواصل)</label>
              <input
                type="text"
                value={formData.chronic_diseases}
                onChange={(e) => setFormData({ ...formData, chronic_diseases: e.target.value })}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="مثال: سكري، ضغط"
              />
            </div>
          </div>
        </div>

        {/* Emergency Contact */}
        <div className="border-b border-gray-200 pb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">جهة الاتصال في الطوارئ</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">الاسم</label>
              <input
                type="text"
                value={formData.emergency_contact_name}
                onChange={(e) => setFormData({ ...formData, emergency_contact_name: e.target.value })}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="اسم جهة الاتصال"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">رقم الهاتف</label>
              <input
                type="tel"
                value={formData.emergency_contact_phone}
                onChange={(e) => setFormData({ ...formData, emergency_contact_phone: e.target.value })}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="05xxxxxxxx"
              />
            </div>
          </div>
        </div>

        {/* Insurance */}
        <div className="border-b border-gray-200 pb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">معلومات التأمين</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">شركة التأمين</label>
              <input
                type="text"
                value={formData.insurance_provider}
                onChange={(e) => setFormData({ ...formData, insurance_provider: e.target.value })}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="اسم شركة التأمين"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">رقم التأمين</label>
              <input
                type="text"
                value={formData.insurance_number}
                onChange={(e) => setFormData({ ...formData, insurance_number: e.target.value })}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="رقم بطاقة التأمين"
              />
            </div>
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">ملاحظات</label>
          <textarea
            rows={4}
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent"
            placeholder="أي ملاحظات إضافية..."
          />
        </div>

        {/* Actions */}
        <div className="flex gap-4 pt-6 border-t border-gray-200">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 bg-primary hover:bg-primary-dark text-white font-bold py-3 px-6 rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                جاري الحفظ...
              </>
            ) : (
              <>
                <Save size={20} />
                حفظ المريض
              </>
            )}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="px-6 py-3 border border-gray-200 text-gray-600 font-bold rounded-xl hover:bg-gray-50 transition-colors"
          >
            إلغاء
          </button>
        </div>
      </form>
    </div>
  )
}
