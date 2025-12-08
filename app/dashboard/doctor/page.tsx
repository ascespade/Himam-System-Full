'use client'

import { Calendar, Clock, Droplet, Eye, FileText, MessageSquare, Search, Users } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

interface Patient {
  id: string
  name: string
  phone: string
  date_of_birth?: string
  gender?: string
  blood_type?: string
  allergies?: string[]
  chronic_diseases?: string[]
}

interface MedicalRecord {
  id: string
  patient_id: string
  record_type: string
  title: string
  description?: string
  date: string
  patient_name?: string
}

interface TodayAppointment {
  id: string
  patient_id: string
  patient_name: string
  patient_phone: string
  date: string
  status: string
  notes?: string
}

export default function DoctorPage() {
  const router = useRouter()
  const [myPatients, setMyPatients] = useState<Patient[]>([])
  const [todayAppointments, setTodayAppointments] = useState<TodayAppointment[]>([])
  const [medicalRecords, setMedicalRecords] = useState<MedicalRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [activeTab, setActiveTab] = useState<'appointments' | 'patients' | 'records'>('appointments')

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      const [appointmentsRes, patientsRes, recordsRes] = await Promise.all([
        fetch('/api/doctor/appointments'),
        fetch('/api/doctor/patients'),
        fetch('/api/doctor/medical-records')
      ])

      const appointmentsJson = await appointmentsRes.json()
      const patientsJson = await patientsRes.json()
      const recordsJson = await recordsRes.json()

      // Extract data from API responses (APIs return { success: true, data: [...] })
      const appointmentsRaw = appointmentsJson?.data || appointmentsJson || []
      const patientsRaw = patientsJson?.data || patientsJson || []
      const recordsRaw = recordsJson?.data || recordsJson || []

      // Transform appointments to match expected format
      const transformedAppointments: TodayAppointment[] = appointmentsRaw.map((apt: any) => ({
        id: apt.id,
        patient_id: apt.patient_id,
        patient_name: apt.patients?.name || apt.patient_name || 'غير معروف',
        patient_phone: apt.patients?.phone || apt.patient_phone || '',
        date: apt.date,
        status: apt.status || 'pending',
        notes: apt.notes
      }))

      setTodayAppointments(transformedAppointments)
      setMyPatients(Array.isArray(patientsRaw) ? patientsRaw : [])
      setMedicalRecords(Array.isArray(recordsRaw) ? recordsRaw : [])
    } catch (error) {
      console.error('Error fetching data:', error)
      // Set empty arrays on error to prevent filter errors
      setTodayAppointments([])
      setMyPatients([])
      setMedicalRecords([])
    } finally {
      setLoading(false)
    }
  }

  const viewPatientFile = (patientId: string) => {
    router.push(`/dashboard/doctor/patients/${patientId}`)
  }

  const filteredPatients = myPatients.filter(p =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.phone.includes(searchTerm)
  )

  if (loading) {
    return <div className="p-8 text-center">جاري تحميل البيانات...</div>
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-extrabold text-gray-900 mb-2">شاشة الطبيب</h1>
        <p className="text-gray-500 text-lg">إدارة المرضى والملفات الطبية والمواعيد</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="text-3xl font-bold text-primary">{todayAppointments.length}</div>
          <div className="text-sm text-gray-500 mt-1">مواعيد اليوم</div>
        </div>
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="text-3xl font-bold text-blue-600">{myPatients.length}</div>
          <div className="text-sm text-gray-500 mt-1">مرضاي</div>
        </div>
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="text-3xl font-bold text-green-600">{medicalRecords.length}</div>
          <div className="text-sm text-gray-500 mt-1">سجلات طبية</div>
        </div>
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="text-3xl font-bold text-purple-600">
            {todayAppointments.filter(a => a.status === 'confirmed').length}
          </div>
          <div className="text-sm text-gray-500 mt-1">مؤكد</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-2 mb-6 flex gap-2">
        <button
          onClick={() => setActiveTab('appointments')}
          className={`flex-1 px-4 py-3 rounded-xl font-bold transition-all ${
            activeTab === 'appointments'
              ? 'bg-primary text-white shadow-md'
              : 'text-gray-500 hover:bg-gray-50'
          }`}
        >
          <Calendar size={20} className="inline ml-2" />
          مواعيد اليوم
        </button>
        <button
          onClick={() => setActiveTab('patients')}
          className={`flex-1 px-4 py-3 rounded-xl font-bold transition-all ${
            activeTab === 'patients'
              ? 'bg-primary text-white shadow-md'
              : 'text-gray-500 hover:bg-gray-50'
          }`}
        >
          <Users size={20} className="inline ml-2" />
          مرضاي
        </button>
        <button
          onClick={() => setActiveTab('records')}
          className={`flex-1 px-4 py-3 rounded-xl font-bold transition-all ${
            activeTab === 'records'
              ? 'bg-primary text-white shadow-md'
              : 'text-gray-500 hover:bg-gray-50'
          }`}
        >
          <FileText size={20} className="inline ml-2" />
          السجلات الطبية
        </button>
      </div>

      {/* Appointments Tab */}
      {activeTab === 'appointments' && (
        <div className="space-y-4">
          {todayAppointments.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
              <Calendar className="mx-auto text-gray-300 mb-4" size={48} />
              <p className="text-gray-500">لا توجد مواعيد اليوم</p>
            </div>
          ) : (
            todayAppointments.map((apt) => (
              <div key={apt.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-gray-900 mb-2">{apt.patient_name}</h3>
                    <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
                      <span className="flex items-center gap-1">
                        <Clock size={16} />
                        {new Date(apt.date).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      <span className="flex items-center gap-1">
                        <MessageSquare size={16} />
                        {apt.patient_phone}
                      </span>
                    </div>
                    {apt.notes && (
                      <p className="text-gray-600 mb-4">{apt.notes}</p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => viewPatientFile(apt.patient_id)}
                      className="px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-lg font-bold text-sm transition-colors"
                    >
                      <Eye size={16} className="inline ml-1" />
                      ملف المريض
                    </button>
                    <button className="px-4 py-2 border border-gray-200 text-gray-600 rounded-lg font-bold text-sm hover:bg-gray-50 transition-colors">
                      <MessageSquare size={16} className="inline ml-1" />
                      Slack
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Patients Tab */}
      {activeTab === 'patients' && (
        <div>
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
            <div className="relative">
              <Search className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="ابحث عن مريض..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pr-12 pl-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredPatients.map((patient) => (
              <div key={patient.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-lg transition-all">
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center text-primary font-bold text-xl">
                    {patient.name.charAt(0)}
                  </div>
                  <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold">
                    نشط
                  </span>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">{patient.name}</h3>
                <div className="space-y-2 text-sm text-gray-600 mb-4">
                  {patient.phone && (
                    <div className="flex items-center gap-2">
                      <MessageSquare size={14} />
                      {patient.phone}
                    </div>
                  )}
                  {patient.date_of_birth && (
                    <div className="flex items-center gap-2">
                      <Calendar size={14} />
                      {new Date(patient.date_of_birth).toLocaleDateString('ar-SA')}
                    </div>
                  )}
                  {patient.blood_type && (
                    <div className="flex items-center gap-2">
                      <Droplet size={14} className="text-red-500" />
                      فصيلة الدم: {patient.blood_type}
                    </div>
                  )}
                </div>
                {patient.allergies && patient.allergies.length > 0 && (
                  <div className="mb-4">
                    <div className="text-xs text-red-600 font-bold mb-1">حساسيات:</div>
                    <div className="flex flex-wrap gap-1">
                      {patient.allergies.map((allergy, idx) => (
                        <span key={idx} className="px-2 py-1 bg-red-50 text-red-700 rounded text-xs">
                          {allergy}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                <div className="flex gap-2 pt-4 border-t border-gray-100">
                  <button
                    onClick={() => viewPatientFile(patient.id)}
                    className="flex-1 px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-lg font-bold text-sm transition-colors"
                  >
                    <Eye size={16} className="inline ml-1" />
                    الملف الطبي
                  </button>
                  <button className="px-4 py-2 border border-gray-200 text-gray-600 rounded-lg font-bold text-sm hover:bg-gray-50 transition-colors">
                    <MessageSquare size={16} className="inline ml-1" />
                    Slack
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Records Tab */}
      {activeTab === 'records' && (
        <div className="space-y-4">
          {medicalRecords.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
              <FileText className="mx-auto text-gray-300 mb-4" size={48} />
              <p className="text-gray-500">لا توجد سجلات طبية</p>
            </div>
          ) : (
            medicalRecords.map((record) => (
              <div key={record.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-bold text-gray-900">{record.title}</h3>
                      <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-bold">
                        {record.record_type}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 mb-2">المريض: {record.patient_name}</p>
                    <p className="text-sm text-gray-500 mb-4">
                      التاريخ: {new Date(record.date).toLocaleDateString('ar-SA')}
                    </p>
                    {record.description && (
                      <p className="text-gray-600">{record.description}</p>
                    )}
                  </div>
                  <button
                    onClick={() => viewPatientFile(record.patient_id)}
                    className="px-4 py-2 text-primary hover:bg-primary/10 rounded-lg transition-colors"
                  >
                    <Eye size={18} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}
