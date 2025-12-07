'use client'

import {
    Activity,
    AlertCircle,
    Calendar,
    ChevronRight,
    FileText,
    Phone,
    Pill,
    Plus,
    User
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

export default function PatientDetailsPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [patientData, setPatientData] = useState<any>(null)
  const [activeTab, setActiveTab] = useState('overview')

  useEffect(() => {
    fetchPatientData()
  }, [])

  const fetchPatientData = async () => {
    try {
      const res = await fetch(`/api/patients/${params.id}/medical-file`)
      const data = await res.json()
      if (data.success) {
        setPatientData(data.data)
      }
    } catch (error) {
      console.error('Error fetching patient data:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="p-8 text-center">جاري تحميل ملف المريض...</div>
  }

  if (!patientData) {
    return <div className="p-8 text-center text-red-500">لم يتم العثور على المريض</div>
  }

  const { patient, medical_records, diagnoses, prescriptions, lab_results, vital_signs } = patientData

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header / Breadcrumb */}
      <div className="flex items-center gap-2 text-gray-500 mb-4">
        <span className="cursor-pointer hover:text-primary" onClick={() => router.push('/dashboard/doctor')}>شاشة الطبيب</span>
        <ChevronRight size={16} />
        <span>ملف المريض</span>
      </div>

      {/* Patient Header Card */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center text-primary text-2xl font-bold">
            {patient.name.charAt(0)}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{patient.name}</h1>
            <div className="flex items-center gap-4 text-gray-500 mt-1">
              <span className="flex items-center gap-1"><Phone size={14} /> {patient.phone}</span>
              <span className="flex items-center gap-1"><User size={14} /> {patient.gender || 'غير محدد'}</span>
              <span className="flex items-center gap-1"><Calendar size={14} /> {patient.date_of_birth ? new Date(patient.date_of_birth).toLocaleDateString('ar-SA') : 'غير محدد'}</span>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => router.push(`/dashboard/doctor/patients/${params.id}/new-record`)}
            className="px-4 py-2 bg-primary text-white rounded-lg font-bold hover:bg-primary-dark transition-colors flex items-center gap-2"
          >
            <Plus size={18} />
            زيارة جديدة
          </button>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">

        {/* Sidebar Info */}
        <div className="space-y-6">
          {/* Vitals Card */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Activity size={18} className="text-primary" />
              العلامات الحيوية (الأخيرة)
            </h3>
            {vital_signs && vital_signs.length > 0 ? (
              <div className="space-y-3 text-sm">
                <div className="flex justify-between border-b border-gray-50 pb-2">
                  <span className="text-gray-500">الضغط</span>
                  <span className="font-bold" dir="ltr">{vital_signs[0].blood_pressure_systolic}/{vital_signs[0].blood_pressure_diastolic}</span>
                </div>
                <div className="flex justify-between border-b border-gray-50 pb-2">
                  <span className="text-gray-500">النبض</span>
                  <span className="font-bold">{vital_signs[0].heart_rate} bpm</span>
                </div>
                <div className="flex justify-between border-b border-gray-50 pb-2">
                  <span className="text-gray-500">الحرارة</span>
                  <span className="font-bold">{vital_signs[0].temperature}°C</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">الوزن</span>
                  <span className="font-bold">{vital_signs[0].weight} kg</span>
                </div>
              </div>
            ) : (
              <p className="text-gray-400 text-sm text-center">لا توجد قراءات</p>
            )}
          </div>

          {/* Allergies & Chronic */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
              <AlertCircle size={18} className="text-red-500" />
              تنبيهات طبية
            </h3>

            <div className="mb-4">
              <p className="text-xs font-bold text-gray-500 mb-2">الحساسيات</p>
              <div className="flex flex-wrap gap-1">
                {patient.allergies && patient.allergies.length > 0 ? (
                  patient.allergies.map((a: string, i: number) => (
                    <span key={i} className="px-2 py-1 bg-red-50 text-red-700 rounded text-xs">{a}</span>
                  ))
                ) : (
                  <span className="text-gray-400 text-xs">لا يوجد</span>
                )}
              </div>
            </div>

            <div>
              <p className="text-xs font-bold text-gray-500 mb-2">الأمراض المزمنة</p>
              <div className="flex flex-wrap gap-1">
                {patient.chronic_diseases && patient.chronic_diseases.length > 0 ? (
                  patient.chronic_diseases.map((d: string, i: number) => (
                    <span key={i} className="px-2 py-1 bg-orange-50 text-orange-700 rounded text-xs">{d}</span>
                  ))
                ) : (
                  <span className="text-gray-400 text-xs">لا يوجد</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Main Tabs Area */}
        <div className="lg:col-span-3 space-y-6">
          {/* Tabs Navigation */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-1 flex overflow-x-auto">
            {['overview', 'records', 'diagnoses', 'prescriptions', 'lab'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 min-w-[100px] py-2.5 rounded-lg text-sm font-bold transition-all ${
                  activeTab === tab
                    ? 'bg-primary text-white shadow'
                    : 'text-gray-500 hover:bg-gray-50'
                }`}
              >
                {tab === 'overview' && 'نظرة عامة'}
                {tab === 'records' && 'السجلات'}
                {tab === 'diagnoses' && 'التشخيصات'}
                {tab === 'prescriptions' && 'الوصفات'}
                {tab === 'lab' && 'المختبر'}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 min-h-[400px] p-6">

            {activeTab === 'overview' && (
              <div className="space-y-6">
                <h3 className="font-bold text-lg mb-4">آخر الزيارات</h3>
                {medical_records && medical_records.length > 0 ? (
                  medical_records.slice(0, 3).map((record: any) => (
                    <div key={record.id} className="flex gap-4 p-4 border rounded-xl hover:bg-gray-50 transition-colors cursor-pointer">
                      <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center text-blue-600 shrink-0">
                        <FileText size={20} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-bold text-gray-900">{record.record_type}</span>
                          <span className="text-xs text-gray-500">{new Date(record.date).toLocaleDateString('ar-SA')}</span>
                        </div>
                        <p className="text-sm text-gray-600 line-clamp-2">{record.chief_complaint || record.notes || 'لا توجد تفاصيل'}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-gray-400 py-8">لا توجد زيارات سابقة</p>
                )}
              </div>
            )}

            {activeTab === 'records' && (
              <div className="space-y-4">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-bold text-lg">السجلات الطبية</h3>
                  <button
                    onClick={() => router.push(`/dashboard/doctor/patients/${params.id}/new-record`)}
                    className="text-sm text-primary font-bold hover:underline"
                  >
                    + إضافة سجل
                  </button>
                </div>
                {medical_records.map((record: any) => (
                  <div key={record.id} className="p-4 border border-gray-100 rounded-xl hover:shadow-sm transition-shadow">
                    <div className="flex justify-between mb-2">
                      <span className="font-bold text-primary">{record.record_type}</span>
                      <span className="text-sm text-gray-500">{new Date(record.date).toLocaleDateString('ar-SA')}</span>
                    </div>
                    <div className="space-y-2 text-sm">
                      {record.chief_complaint && (
                        <div><span className="font-bold">الشكوى الرئيسية:</span> {record.chief_complaint}</div>
                      )}
                      {record.assessment && (
                        <div><span className="font-bold">التقييم:</span> {record.assessment}</div>
                      )}
                      {record.plan && (
                        <div><span className="font-bold">الخطة العلاجية:</span> {record.plan}</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'diagnoses' && (
              <div className="space-y-4">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-bold text-lg">التشخيصات</h3>
                  <button className="text-sm text-primary font-bold hover:underline">+ إضافة تشخيص</button>
                </div>
                {diagnoses.map((diagnosis: any) => (
                  <div key={diagnosis.id} className="flex items-center justify-between p-4 border border-gray-100 rounded-xl">
                    <div>
                      <div className="font-bold text-gray-900">{diagnosis.diagnosis_name}</div>
                      <div className="text-sm text-gray-500">
                        {new Date(diagnosis.diagnosed_date).toLocaleDateString('ar-SA')} • {diagnosis.status}
                      </div>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                      diagnosis.severity === 'severe' ? 'bg-red-100 text-red-700' :
                      diagnosis.severity === 'moderate' ? 'bg-orange-100 text-orange-700' :
                      'bg-green-100 text-green-700'
                    }`}>
                      {diagnosis.severity || 'غير محدد'}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'prescriptions' && (
              <div className="space-y-4">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-bold text-lg">الوصفات الطبية</h3>
                  <button className="text-sm text-primary font-bold hover:underline">+ وصفة جديدة</button>
                </div>
                {prescriptions.map((script: any) => (
                  <div key={script.id} className="p-4 border border-gray-100 rounded-xl">
                    <div className="flex justify-between mb-2">
                      <div className="font-bold text-gray-900 flex items-center gap-2">
                        <Pill size={16} className="text-primary" />
                        وصفة طبية
                      </div>
                      <span className="text-sm text-gray-500">{new Date(script.prescribed_date).toLocaleDateString('ar-SA')}</span>
                    </div>
                    <div className="text-sm text-gray-600">
                      {script.notes || 'لا توجد ملاحظات'}
                    </div>
                    <div className="mt-3 pt-3 border-t border-gray-50 flex justify-end">
                      <button className="text-sm text-primary hover:underline">عرض التفاصيل</button>
                    </div>
                  </div>
                ))}
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  )
}
