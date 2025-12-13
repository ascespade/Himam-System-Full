'use client'

import {
    Activity,
    AlertCircle,
    Calendar,
    ChevronRight,
    FileText,
    Phone,
    Plus,
    Shield,
    Target,
    TrendingUp,
    User
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect, useState, useCallback } from 'react'

// Insurance Info Component
function InsuranceInfoCard({ patientId }: { patientId: string }) {
  const [insurance, setInsurance] = useState<Array<Record<string, unknown>>>([])
  const [loading, setLoading] = useState(true)

  const fetchInsurance = useCallback(async () => {
    try {
      const res = await fetch(`/api/patients/${patientId}/insurance`)
      const data = await res.json()
      if (data.success) {
        setInsurance(data.data || [])
      }
    } catch (error) {
      console.error('Error fetching insurance:', error)
    } finally {
      setLoading(false)
    }
  }, [patientId])

  useEffect(() => {
    fetchInsurance()
  }, [fetchInsurance])

  if (loading) {
    return (
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
        <div className="text-center text-gray-400 text-xs">جاري التحميل...</div>
      </div>
    )
  }

  if (insurance.length === 0) {
    return (
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
        <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Shield size={18} className="text-blue-500" />
          معلومات التأمين
        </h3>
        <p className="text-gray-400 text-xs text-center">لا توجد معلومات تأمين</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
      <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
        <Shield size={18} className="text-blue-500" />
        معلومات التأمين
      </h3>
      {insurance.map((ins: { id?: string; insurance_company?: string; policy_number?: string; member_id?: string; coverage_percentage?: number; copay_amount?: number; effective_date?: string | number | Date; [key: string]: unknown }) => (
        <div key={String(ins.id || '')} className="mb-3 p-3 bg-blue-50 rounded-lg">
          <div className="text-sm font-bold text-gray-900 mb-1">{String(ins.insurance_company || '')}</div>
          <div className="text-xs text-gray-600 space-y-1">
            <div>رقم البوليصة: {String(ins.policy_number || '')}</div>
            {ins.member_id && <div>رقم العضوية: {String(ins.member_id)}</div>}
            <div>التغطية: {String(ins.coverage_percentage || 0)}%</div>
            {ins.copay_amount && Number(ins.copay_amount) > 0 && <div>الدفع المشترك: {String(ins.copay_amount)} ريال</div>}
            {ins.effective_date && (() => {
              const date = ins.effective_date as string | number | Date
              return (
                <div>تاريخ السريان: {new Date(String(date)).toLocaleDateString('ar-SA')}</div>
              )
            })()}
          </div>
        </div>
      ))}
    </div>
  )
}

export default function PatientDetailsPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [patientData, setPatientData] = useState<any>(null)
  const [activeTab, setActiveTab] = useState('overview')

  const fetchPatientData = useCallback(async () => {
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
  }, [params.id])

  useEffect(() => {
    fetchPatientData()
  }, [fetchPatientData])

  if (loading) {
    return <div className="p-8 text-center">جاري تحميل ملف المريض...</div>
  }

  if (!patientData) {
    return <div className="p-8 text-center text-red-500">لم يتم العثور على المريض</div>
  }

  const { patient, medical_records, diagnoses, vital_signs } = patientData

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
                  <span className="font-bold" dir="ltr">{String(vital_signs[0].blood_pressure_systolic || '')}/{String(vital_signs[0].blood_pressure_diastolic || '')}</span>
                </div>
                <div className="flex justify-between border-b border-gray-50 pb-2">
                  <span className="text-gray-500">النبض</span>
                  <span className="font-bold">{String(vital_signs[0].heart_rate || '')} bpm</span>
                </div>
                <div className="flex justify-between border-b border-gray-50 pb-2">
                  <span className="text-gray-500">الحرارة</span>
                  <span className="font-bold">{String(vital_signs[0].temperature || '')}°C</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">الوزن</span>
                  <span className="font-bold">{String(vital_signs[0].weight || '')} kg</span>
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

          {/* Insurance Info */}
          <InsuranceInfoCard patientId={params.id} />
        </div>

        {/* Main Tabs Area */}
        <div className="lg:col-span-3 space-y-6">
          {/* Tabs Navigation */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-1 flex overflow-x-auto">
            {['overview', 'records', 'diagnoses', 'sessions', 'progress'].map((tab) => (
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
                {tab === 'sessions' && 'الجلسات'}
                {tab === 'progress' && 'التقدم'}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 min-h-[400px] p-6">

            {activeTab === 'overview' && (
              <div className="space-y-6">
                <h3 className="font-bold text-lg mb-4">آخر الزيارات</h3>
                {medical_records && medical_records.length > 0 ? (
                  medical_records.slice(0, 3).map((record: { id: string; record_type?: string; date?: string; title?: string; description?: string; chief_complaint?: string; notes?: string; [key: string]: unknown }) => (
                    <div key={record.id} className="flex gap-4 p-4 border rounded-xl hover:bg-gray-50 transition-colors cursor-pointer">
                      <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center text-blue-600 shrink-0">
                        <FileText size={20} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-bold text-gray-900">{record.record_type}</span>
                          <span className="text-xs text-gray-500">{record.date ? new Date(String(record.date)).toLocaleDateString('ar-SA') : 'غير محدد'}</span>
                        </div>
                        <p className="text-sm text-gray-600 line-clamp-2">{String(record.chief_complaint || record.notes || 'لا توجد تفاصيل')}</p>
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
                {medical_records.map((record: { id: string; record_type?: string; date?: string; title?: string; description?: string; chief_complaint?: string; notes?: string; assessment?: string; plan?: string | number | boolean; [key: string]: unknown }) => (
                  <div key={record.id} className="p-4 border border-gray-100 rounded-xl hover:shadow-sm transition-shadow">
                    <div className="flex justify-between mb-2">
                      <span className="font-bold text-primary">{record.record_type}</span>
                      <span className="text-sm text-gray-500">{record.date ? new Date(String(record.date)).toLocaleDateString('ar-SA') : 'غير محدد'}</span>
                    </div>
                    <div className="space-y-2 text-sm">
                      {record.chief_complaint && (
                        <div><span className="font-bold">الشكوى الرئيسية:</span> {record.chief_complaint}</div>
                      )}
                      {record.assessment && (
                        <div><span className="font-bold">التقييم:</span> {String(record.assessment)}</div>
                      )}
                      {record.plan && (
                        <div><span className="font-bold">الخطة العلاجية:</span> {String(record.plan)}</div>
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
                {diagnoses.map((diagnosis: { id: string; diagnosis_name?: string; diagnosed_date?: string; status?: string; severity?: string; [key: string]: unknown }) => (
                  <div key={diagnosis.id} className="flex items-center justify-between p-4 border border-gray-100 rounded-xl">
                    <div>
                      <div className="font-bold text-gray-900">{String(diagnosis.diagnosis_name || '')}</div>
                      <div className="text-sm text-gray-500">
                        {diagnosis.diagnosed_date ? new Date(String(diagnosis.diagnosed_date)).toLocaleDateString('ar-SA') : 'غير محدد'} • {String(diagnosis.status || '')}
                      </div>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                      diagnosis.severity === 'severe' ? 'bg-red-100 text-red-700' :
                      diagnosis.severity === 'moderate' ? 'bg-orange-100 text-orange-700' :
                      'bg-green-100 text-green-700'
                    }`}>
                      {String(diagnosis.severity || 'غير محدد')}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'sessions' && (
              <div className="space-y-4">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-bold text-lg">الجلسات العلاجية</h3>
                  <button 
                    onClick={() => router.push(`/dashboard/doctor/patients/${params.id}/new-record`)}
                    className="text-sm text-primary font-bold hover:underline"
                  >
                    + جلسة جديدة
                  </button>
                </div>
                {medical_records && medical_records.length > 0 ? (
                  medical_records
                    .filter((record: { record_type?: string }) => ['visit', 'session', 'therapy'].includes(record.record_type?.toLowerCase() || ''))
                    .map((session: { id: string; record_type?: string; date?: string; title?: string; chief_complaint?: string; assessment?: string; plan?: string | number | boolean; [key: string]: unknown }) => (
                      <div key={session.id} className="p-4 border border-gray-100 rounded-xl hover:shadow-sm transition-shadow">
                        <div className="flex justify-between mb-2">
                          <div className="font-bold text-gray-900 flex items-center gap-2">
                            <Calendar size={16} className="text-primary" />
                            {session.record_type || 'جلسة علاجية'}
                          </div>
                          <span className="text-sm text-gray-500">{session.date ? new Date(String(session.date)).toLocaleDateString('ar-SA') : 'غير محدد'}</span>
                        </div>
                        <div className="text-sm text-gray-600 space-y-1">
                          {session.chief_complaint && (
                            <div><span className="font-bold">الهدف من الجلسة:</span> {session.chief_complaint}</div>
                          )}
                          {session.assessment && (
                            <div><span className="font-bold">ملاحظات الجلسة:</span> {session.assessment}</div>
                          )}
                          {session.plan && (
                            <div><span className="font-bold">الخطة:</span> {String(session.plan)}</div>
                          )}
                        </div>
                      </div>
                    ))
                ) : (
                  <p className="text-center text-gray-400 py-8">لا توجد جلسات مسجلة</p>
                )}
              </div>
            )}

            {activeTab === 'progress' && (
              <div className="space-y-4">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-bold text-lg">تتبع التقدم</h3>
                  <button className="text-sm text-primary font-bold hover:underline">+ تحديث التقدم</button>
                </div>
                {medical_records && medical_records.length > 0 ? (
                  <div className="space-y-4">
                    {medical_records
                      .filter((record: { plan?: unknown }) => record.plan)
                      .map((record: { id: string; plan?: Record<string, unknown>; assessment?: string | number | boolean; date?: string; [key: string]: unknown }) => (
                        <div key={record.id} className="p-4 border border-gray-100 rounded-xl">
                          <div className="flex justify-between mb-2">
                            <div className="font-bold text-gray-900 flex items-center gap-2">
                              <Target size={16} className="text-primary" />
                              خطة علاجية
                            </div>
                            <span className="text-sm text-gray-500">{record.date ? new Date(String(record.date)).toLocaleDateString('ar-SA') : 'غير محدد'}</span>
                          </div>
                          <div className="text-sm text-gray-600">
                            <div className="mb-2"><span className="font-bold">الخطة:</span> {String(record.plan || '')}</div>
                            {record.assessment && (
                              <div className="text-green-600"><span className="font-bold">التقدم:</span> {String(record.assessment as string | number | boolean)}</div>
                            )}
                          </div>
                        </div>
                      ))}
                    {medical_records.filter((record: { plan?: unknown }) => record.plan).length === 0 && (
                        <p className="text-center text-gray-400 py-8">لا توجد خطط علاجية مسجلة</p>
                      )}
                  </div>
                ) : (
                  <p className="text-center text-gray-400 py-8">لا توجد بيانات تقدم</p>
                )}
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  )
}
