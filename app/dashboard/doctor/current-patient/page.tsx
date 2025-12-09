'use client'

import {
  User, Phone, Calendar, FileText, Heart, Pill, Activity, Image as ImageIcon,
  TrendingUp, ClipboardList, Shield, AlertCircle, CheckCircle, Clock, Download,
  Edit, Plus, Eye, Camera, Stethoscope, Bot
} from 'lucide-react'
import { useRouter } from 'next/navigation'
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
  date_of_birth?: string
  gender?: string
  blood_type?: string
  allergies?: string[]
  chronic_diseases?: string[]
  nationality?: string
  address?: string
  emergency_contact_name?: string
  emergency_contact_phone?: string
}

interface Visit {
  id: string
  status: string
  visit_type: string
  created_at: string
  confirmed_to_doctor_time?: string
  doctor_seen_time?: string
  notes?: string
  reception_notes?: string
}

interface MedicalRecord {
  id: string
  record_type: string
  title: string
  description?: string
  date: string
  attachments?: string[]
}

interface TreatmentPlan {
  id: string
  title: string
  status: string
  start_date: string
  progress_percentage: number
}

interface Appointment {
  id: string
  date: string
  status: string
  appointment_type: string
}

interface Insurance {
  insurance_provider?: string
  insurance_number?: string
  policy_number?: string
  member_id?: string
  coverage_percentage?: number
  effective_date?: string
  expiry_date?: string
  insurance_expiry?: string
}

export default function CurrentPatientPage() {
  const router = useRouter()
  const [patient, setPatient] = useState<Patient | null>(null)
  const [visit, setVisit] = useState<Visit | null>(null)
  const [medicalRecords, setMedicalRecords] = useState<MedicalRecord[]>([])
  const [treatmentPlans, setTreatmentPlans] = useState<TreatmentPlan[]>([])
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [vitalSigns, setVitalSigns] = useState<any[]>([])
  const [insurance, setInsurance] = useState<Insurance | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'overview' | 'records' | 'treatment' | 'insurance'>('overview')

  useEffect(() => {
    fetchCurrentPatient()
  }, [])

  const fetchCurrentPatient = async () => {
    try {
      const res = await fetch('/api/doctor/current-patient')
      const data = await res.json()

      if (data.success && data.data) {
        if (data.data.patient) {
          setPatient(data.data.patient)
          setVisit(data.data.visit)
          setMedicalRecords(data.data.medicalRecords || [])
          setTreatmentPlans(data.data.treatmentPlans || [])
          setAppointments(data.data.appointments || [])
          setVitalSigns(data.data.vitalSigns || [])
          setInsurance(data.data.insurance)
        } else {
          toast.info('لا يوجد مريض حالياً في الانتظار')
          router.push('/dashboard/doctor/queue')
        }
      } else {
        toast.info('لا يوجد مريض حالياً في الانتظار')
        router.push('/dashboard/doctor/queue')
      }
    } catch (error) {
      console.error('Error fetching current patient:', error)
      toast.error('حدث خطأ في تحميل بيانات المريض')
    } finally {
      setLoading(false)
    }
  }

  const calculateAge = (dateOfBirth?: string) => {
    if (!dateOfBirth) return null
    const birth = new Date(dateOfBirth)
    const today = new Date()
    let age = today.getFullYear() - birth.getFullYear()
    const monthDiff = today.getMonth() - birth.getMonth()
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--
    }
    return age
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="bg-white rounded-xl p-12 shadow-sm border border-gray-100 text-center">
          <div className="text-gray-400">جاري تحميل بيانات المريض...</div>
        </div>
      </div>
    )
  }

  if (!patient) {
    return (
      <div className="p-6">
        <div className="bg-white rounded-xl p-12 shadow-sm border border-gray-100 text-center">
          <User className="mx-auto text-gray-300 mb-4" size={48} />
          <p className="text-gray-500">لا يوجد مريض حالياً</p>
          <button
            onClick={() => router.push('/dashboard/doctor/queue')}
            className="mt-4 px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark"
          >
            عرض الطابور
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header - Patient Info Card */}
      <div className="bg-gradient-to-r from-primary to-primary-dark rounded-2xl p-6 text-white">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center text-3xl font-bold backdrop-blur-sm">
              {patient.name?.charAt(0) || '?'}
            </div>
            <div>
              <h1 className="text-3xl font-bold mb-2">{patient.name}</h1>
              <div className="flex items-center gap-4 text-white/90">
                {patient.phone && (
                  <span className="flex items-center gap-2">
                    <Phone size={16} />
                    {patient.phone}
                  </span>
                )}
                {patient.date_of_birth && (
                  <span className="flex items-center gap-2">
                    <Calendar size={16} />
                    {calculateAge(patient.date_of_birth)} سنة
                  </span>
                )}
                {patient.gender && (
                  <span>{patient.gender === 'male' ? 'ذكر' : patient.gender === 'female' ? 'أنثى' : patient.gender}</span>
                )}
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => router.push(`/dashboard/doctor/patients/${patient.id}`)}
              className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg backdrop-blur-sm transition-colors"
            >
              <Eye size={18} />
            </button>
            <button
              onClick={() => router.push(`/dashboard/doctor/patients/${patient.id}?edit=true`)}
              className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg backdrop-blur-sm transition-colors"
            >
              <Edit size={18} />
            </button>
          </div>
        </div>
        {visit && (
          <div className="mt-4 pt-4 border-t border-white/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <span className="px-3 py-1 bg-white/20 rounded-full text-sm backdrop-blur-sm">
                  {visit.visit_type === 'emergency' ? 'طارئة' : visit.visit_type === 'follow_up' ? 'متابعة' : 'عادية'}
                </span>
                {visit.confirmed_to_doctor_time && (
                  <span className="text-sm text-white/80">
                    وصل: {new Date(visit.confirmed_to_doctor_time).toLocaleTimeString('ar-SA')}
                  </span>
                )}
              </div>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                visit.status === 'with_doctor' ? 'bg-green-500/30' : 'bg-yellow-500/30'
              }`}>
                {visit.status === 'with_doctor' ? 'مع الطبيب' : 'في الانتظار'}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <button
          onClick={() => router.push(`/dashboard/doctor/patients/${patient.id}/new-record`)}
          className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition-shadow text-right"
        >
          <div className="flex items-center justify-between mb-2">
            <Plus size={24} className="text-primary" />
            <FileText size={20} className="text-gray-400" />
          </div>
          <h3 className="font-medium text-gray-900">سجل جديد</h3>
          <p className="text-xs text-gray-500 mt-1">إضافة سجل طبي</p>
        </button>
        <button
          onClick={() => router.push(`/dashboard/doctor/sessions/new?patient_id=${patient.id}`)}
          className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition-shadow text-right"
        >
          <div className="flex items-center justify-between mb-2">
            <Plus size={24} className="text-primary" />
            <ClipboardList size={20} className="text-gray-400" />
          </div>
          <h3 className="font-medium text-gray-900">جلسة جديدة</h3>
          <p className="text-xs text-gray-500 mt-1">بدء جلسة علاجية</p>
        </button>
        <button
          onClick={() => router.push(`/dashboard/doctor/treatment-plans?patient_id=${patient.id}&new=true`)}
          className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition-shadow text-right"
        >
          <div className="flex items-center justify-between mb-2">
            <Plus size={24} className="text-primary" />
            <TrendingUp size={20} className="text-gray-400" />
          </div>
          <h3 className="font-medium text-gray-900">خطة علاج</h3>
          <p className="text-xs text-gray-500 mt-1">إنشاء خطة علاجية</p>
        </button>
        <button
          onClick={() => router.push(`/dashboard/doctor/insurance/claims?patient_id=${patient.id}&new=true`)}
          className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition-shadow text-right"
        >
          <div className="flex items-center justify-between mb-2">
            <Plus size={24} className="text-primary" />
            <Shield size={20} className="text-gray-400" />
          </div>
          <h3 className="font-medium text-gray-900">مطالبة تأمين</h3>
          <p className="text-xs text-gray-500 mt-1">إرسال مطالبة جديدة</p>
        </button>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="border-b border-gray-200">
          <div className="flex gap-4 px-6">
            {[
              { id: 'overview', label: 'نظرة عامة', icon: Eye },
              { id: 'records', label: 'السجلات الطبية', icon: FileText },
              { id: 'treatment', label: 'خطط العلاج', icon: TrendingUp },
              { id: 'insurance', label: 'التأمين', icon: Shield }
            ].map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-2 px-4 py-4 border-b-2 transition-colors ${
                    activeTab === tab.id
                      ? 'border-primary text-primary font-medium'
                      : 'border-transparent text-gray-500 hover:text-gray-900'
                  }`}
                >
                  <Icon size={18} />
                  {tab.label}
                </button>
              )
            })}
          </div>
        </div>

        <div className="p-6">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <User size={20} className="text-primary" />
                    المعلومات الأساسية
                  </h3>
                  <div className="space-y-3">
                    <div className="flex justify-between py-2 border-b border-gray-100">
                      <span className="text-gray-500">الاسم الكامل</span>
                      <span className="font-medium">{patient.name}</span>
                    </div>
                    {patient.date_of_birth && (
                      <div className="flex justify-between py-2 border-b border-gray-100">
                        <span className="text-gray-500">تاريخ الميلاد</span>
                        <span className="font-medium">{new Date(patient.date_of_birth).toLocaleDateString('ar-SA')}</span>
                      </div>
                    )}
                    {patient.gender && (
                      <div className="flex justify-between py-2 border-b border-gray-100">
                        <span className="text-gray-500">الجنس</span>
                        <span className="font-medium">
                          {patient.gender === 'male' ? 'ذكر' : patient.gender === 'female' ? 'أنثى' : patient.gender}
                        </span>
                      </div>
                    )}
                    {patient.blood_type && (
                      <div className="flex justify-between py-2 border-b border-gray-100">
                        <span className="text-gray-500">فصيلة الدم</span>
                        <span className="font-medium">{patient.blood_type}</span>
                      </div>
                    )}
                    {patient.nationality && (
                      <div className="flex justify-between py-2 border-b border-gray-100">
                        <span className="text-gray-500">الجنسية</span>
                        <span className="font-medium">{patient.nationality}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <AlertCircle size={20} className="text-red-500" />
                    التنبيهات الطبية
                  </h3>
                  <div className="space-y-3">
                    {patient.allergies && patient.allergies.length > 0 ? (
                      <div>
                        <span className="text-gray-500 text-sm">الحساسيات:</span>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {patient.allergies.map((allergy, idx) => (
                            <span key={idx} className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm">
                              {allergy}
                            </span>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <p className="text-gray-400 text-sm">لا توجد حساسيات مسجلة</p>
                    )}
                    {patient.chronic_diseases && patient.chronic_diseases.length > 0 ? (
                      <div className="mt-4">
                        <span className="text-gray-500 text-sm">الأمراض المزمنة:</span>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {patient.chronic_diseases.map((disease, idx) => (
                            <span key={idx} className="px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-sm">
                              {disease}
                            </span>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <p className="text-gray-400 text-sm">لا توجد أمراض مزمنة مسجلة</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Recent Appointments */}
              <div>
                <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Calendar size={20} className="text-primary" />
                  المواعيد الأخيرة
                </h3>
                {appointments.length > 0 ? (
                  <div className="space-y-2">
                    {appointments.slice(0, 5).map((apt) => (
                      <div key={apt.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <span className="font-medium">{new Date(apt.date).toLocaleDateString('ar-SA')}</span>
                          <span className="text-sm text-gray-500 mr-2">
                            {new Date(apt.date).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          apt.status === 'completed' ? 'bg-green-100 text-green-800' :
                          apt.status === 'confirmed' ? 'bg-blue-100 text-blue-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {apt.status === 'completed' ? 'مكتمل' : apt.status === 'confirmed' ? 'مؤكد' : 'قيد الانتظار'}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-400 text-sm">لا توجد مواعيد سابقة</p>
                )}
              </div>
            </div>
          )}

              {activeTab === 'records' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-gray-900">السجلات الطبية</h3>
                <button
                  onClick={() => router.push(`/dashboard/doctor/patients/${patient.id}/new-record`)}
                  className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark"
                >
                  <Plus size={18} />
                  إضافة سجل
                </button>
              </div>
              {medicalRecords.length > 0 ? (
                <div className="space-y-3">
                  {medicalRecords.map((record: any) => (
                    <div key={record.id} className="p-4 bg-gray-50 rounded-lg border border-gray-200 hover:shadow-md transition-shadow cursor-pointer"
                      onClick={() => router.push(`/dashboard/doctor/patients/${patient.id}?record=${record.id}`)}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-medium text-gray-900">{record.chief_complaint || record.record_type || 'سجل طبي'}</h4>
                        <span className="text-xs text-gray-500">{new Date(record.date || record.created_at).toLocaleDateString('ar-SA')}</span>
                      </div>
                      {record.notes && (
                        <p className="text-sm text-gray-600 mb-2 line-clamp-2">{record.notes}</p>
                      )}
                      {record.record_type && (
                        <span className="inline-block px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                          {record.record_type === 'visit' ? 'زيارة' :
                           record.record_type === 'diagnosis' ? 'تشخيص' :
                           record.record_type === 'prescription' ? 'وصفة' :
                           record.record_type === 'lab_result' ? 'مختبر' :
                           record.record_type === 'imaging' ? 'تصوير' : record.record_type}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <FileText className="mx-auto text-gray-300 mb-4" size={48} />
                  <p className="text-gray-500">لا توجد سجلات طبية</p>
                  <button
                    onClick={() => router.push(`/dashboard/doctor/patients/${patient.id}/new-record`)}
                    className="mt-4 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark"
                  >
                    إضافة أول سجل
                  </button>
                </div>
              )}
            </div>
          )}

              {activeTab === 'treatment' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-gray-900">خطط العلاج</h3>
                <button
                  onClick={() => router.push(`/dashboard/doctor/treatment-plans?patient_id=${patient.id}&new=true`)}
                  className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark"
                >
                  <Plus size={18} />
                  خطة جديدة
                </button>
              </div>
              {treatmentPlans.length > 0 ? (
                <div className="space-y-3">
                  {treatmentPlans.map((plan: any) => (
                    <div 
                      key={plan.id} 
                      className="p-4 bg-gray-50 rounded-lg border border-gray-200 hover:shadow-md transition-shadow cursor-pointer"
                      onClick={() => router.push(`/dashboard/doctor/treatment-plans/${plan.id}`)}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <h4 className="font-medium text-gray-900">{plan.title}</h4>
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          plan.status === 'active' ? 'bg-green-100 text-green-800' :
                          plan.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {plan.status === 'active' ? 'نشط' : plan.status === 'completed' ? 'مكتمل' : 'متوقف'}
                        </span>
                      </div>
                      {plan.description && (
                        <p className="text-sm text-gray-600 mb-3 line-clamp-2">{plan.description}</p>
                      )}
                      <div className="mb-2">
                        <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                          <span>التقدم</span>
                          <span>{plan.progress_percentage || 0}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-primary h-2 rounded-full transition-all"
                            style={{ width: `${plan.progress_percentage || 0}%` }}
                          ></div>
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-xs text-gray-400 mt-2">
                        <span>تاريخ البدء: {new Date(plan.start_date || plan.created_at).toLocaleDateString('ar-SA')}</span>
                        {plan.end_date && (
                          <span>تاريخ الانتهاء: {new Date(plan.end_date).toLocaleDateString('ar-SA')}</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <TrendingUp className="mx-auto text-gray-300 mb-4" size={48} />
                  <p className="text-gray-500">لا توجد خطط علاجية</p>
                  <button
                    onClick={() => router.push(`/dashboard/doctor/treatment-plans?patient_id=${patient.id}&new=true`)}
                    className="mt-4 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark"
                  >
                    إنشاء خطة جديدة
                  </button>
                </div>
              )}
            </div>
          )}

              {activeTab === 'insurance' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-gray-900">معلومات التأمين</h3>
                <button
                  onClick={() => router.push(`/dashboard/doctor/insurance/claims?patient_id=${patient.id}&new=true`)}
                  className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark"
                >
                  <Plus size={18} />
                  مطالبة جديدة
                </button>
              </div>
              {insurance ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <span className="text-sm text-gray-500">شركة التأمين</span>
                      <p className="font-medium mt-1">{insurance.insurance_provider || 'غير محدد'}</p>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <span className="text-sm text-gray-500">رقم البوليصة</span>
                      <p className="font-medium mt-1">{insurance.policy_number || insurance.insurance_number || 'غير محدد'}</p>
                    </div>
                    {insurance.member_id && (
                      <div className="p-4 bg-gray-50 rounded-lg">
                        <span className="text-sm text-gray-500">رقم العضوية</span>
                        <p className="font-medium mt-1">{insurance.member_id}</p>
                      </div>
                    )}
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <span className="text-sm text-gray-500">نسبة التغطية</span>
                      <p className="font-medium mt-1">{insurance.coverage_percentage || 80}%</p>
                    </div>
                    {insurance.effective_date && (
                      <div className="p-4 bg-gray-50 rounded-lg">
                        <span className="text-sm text-gray-500">تاريخ السريان</span>
                        <p className="font-medium mt-1">{new Date(insurance.effective_date).toLocaleDateString('ar-SA')}</p>
                      </div>
                    )}
                    {insurance.expiry_date && (
                      <div className="p-4 bg-gray-50 rounded-lg">
                        <span className="text-sm text-gray-500">تاريخ الانتهاء</span>
                        <p className="font-medium mt-1">{new Date(insurance.expiry_date).toLocaleDateString('ar-SA')}</p>
                      </div>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-4 mt-4">
                    <button
                      onClick={() => router.push(`/dashboard/doctor/insurance/claims?patient_id=${patient.id}`)}
                      className="px-4 py-3 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50"
                    >
                      عرض جميع المطالبات
                    </button>
                    <button
                      onClick={() => router.push(`/dashboard/doctor/insurance/ai-agent?patient_id=${patient.id}`)}
                      className="px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2"
                    >
                      <Bot size={18} />
                      المساعد الذكي
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Shield className="mx-auto text-gray-300 mb-4" size={48} />
                  <p className="text-gray-500">لا توجد معلومات تأمين مسجلة</p>
                  <button
                    onClick={() => router.push(`/dashboard/doctor/patients/${patient.id}?tab=insurance`)}
                    className="mt-4 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark"
                  >
                    إضافة معلومات التأمين
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

