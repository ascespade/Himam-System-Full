'use client'

/**
 * Patient Portal Dashboard
 * Dashboard for patients to view their medical information
 */

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'
import { Calendar, FileText, User, Phone, Clock, Activity, TrendingUp } from 'lucide-react'

interface PatientInfo {
  id: string
  name: string
  phone: string
  email?: string
  date_of_birth?: string
  gender?: string
  blood_type?: string
}

interface UpcomingAppointment {
  id: string
  date: string
  doctor_name: string
  status: string
}

interface RecentRecord {
  id: string
  record_type: string
  date: string
  doctor_name?: string
}

export default function PatientDashboard() {
  const router = useRouter()
  const [patient, setPatient] = useState<PatientInfo | null>(null)
  const [appointments, setAppointments] = useState<UpcomingAppointment[]>([])
  const [recentRecords, setRecentRecords] = useState<RecentRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    upcomingAppointments: 0,
    totalRecords: 0,
    completedSessions: 0,
  })

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      setLoading(true)

      // Get current user
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }

      // Load patient info
      const patientRes = await fetch(`/api/patients?user_id=${user.id}`)
      const patientData = await patientRes.json()
      if (patientData.success && patientData.data?.length > 0) {
        const patientInfo = patientData.data[0]
        setPatient(patientInfo)

        // Load medical file
        const fileRes = await fetch(`/api/patients/${patientInfo.id}/medical-file`)
        const fileData = await fileRes.json()
        if (fileData.success) {
          const file = fileData.data
          setRecentRecords(file.medical_records?.slice(0, 5) || [])
          setStats((prev) => ({
            ...prev,
            totalRecords: file.medical_records?.length || 0,
          }))
        }

        // Load upcoming appointments
        const appointmentsRes = await fetch(`/api/appointments?patient_id=${patientInfo.id}&status=confirmed`)
        const appointmentsData = await appointmentsRes.json()
        if (appointmentsData.success) {
          const upcoming = (appointmentsData.data || [])
            .filter((apt: UpcomingAppointment) => new Date(apt.date) >= new Date())
            .slice(0, 5)
          setAppointments(upcoming)
          setStats((prev) => ({
            ...prev,
            upcomingAppointments: upcoming.length,
          }))
        }
      }
    } catch (error) {
      console.error('Error loading dashboard:', error)
      // Show user-friendly error message
      if (!patient) {
        setLoading(false)
        return
      }
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="p-8">
        <div className="text-center text-gray-500">جاري تحميل لوحة التحكم...</div>
      </div>
    )
  }

  if (!patient) {
    return (
      <div className="p-8">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
          <div className="text-gray-500 mb-4">لا توجد معلومات مريض متاحة</div>
          <div className="text-sm text-gray-400">يرجى التأكد من تسجيل الدخول بحساب مريض صحيح</div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-extrabold text-gray-900 mb-2">لوحة تحكم المريض</h1>
        <p className="text-gray-500 text-lg">مرحباً {patient.name}</p>
      </div>

      {/* Patient Info Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">معلوماتي الشخصية</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center gap-2">
            <Phone size={18} className="text-gray-400" />
            <span className="text-gray-600">{patient.phone}</span>
          </div>
          {patient.email && (
            <div className="flex items-center gap-2">
              <span className="text-gray-400">📧</span>
              <span className="text-gray-600">{patient.email}</span>
            </div>
          )}
          {patient.date_of_birth && (
            <div className="flex items-center gap-2">
              <Calendar size={18} className="text-gray-400" />
              <span className="text-gray-600">
                {new Date(patient.date_of_birth).toLocaleDateString('ar-SA')}
              </span>
            </div>
          )}
          {patient.blood_type && (
            <div className="flex items-center gap-2">
              <Activity size={18} className="text-gray-400" />
              <span className="text-gray-600">فصيلة الدم: {patient.blood_type}</span>
            </div>
          )}
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-xl bg-blue-100 text-blue-600">
              <Calendar size={24} />
            </div>
          </div>
          <div className="text-3xl font-bold text-gray-900 mb-1">{stats.upcomingAppointments}</div>
          <div className="text-sm text-gray-500">المواعيد القادمة</div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-xl bg-green-100 text-green-600">
              <FileText size={24} />
            </div>
          </div>
          <div className="text-3xl font-bold text-gray-900 mb-1">{stats.totalRecords}</div>
          <div className="text-sm text-gray-500">السجلات الطبية</div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-xl bg-purple-100 text-purple-600">
              <TrendingUp size={24} />
            </div>
          </div>
          <div className="text-3xl font-bold text-gray-900 mb-1">{stats.completedSessions}</div>
          <div className="text-sm text-gray-500">الجلسات المكتملة</div>
        </div>
      </div>

      {/* Upcoming Appointments */}
      {appointments.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Calendar size={24} />
              المواعيد القادمة
            </h2>
            <button
              onClick={() => router.push('/dashboard/patient/appointments')}
              className="text-sm text-primary hover:underline"
            >
              عرض الكل
            </button>
          </div>
          <div className="space-y-3">
            {appointments.map((appointment) => (
              <div
                key={appointment.id}
                className="p-4 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="font-bold text-gray-900 mb-1">{appointment.doctor_name}</div>
                    <div className="text-sm text-gray-600 mb-2">
                      {new Date(appointment.date).toLocaleDateString('ar-SA', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </div>
                    <div className="text-xs text-gray-500">
                      الحالة: {appointment.status === 'confirmed' ? 'مؤكد' : appointment.status}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Medical Records */}
      {recentRecords.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <FileText size={24} />
              السجلات الطبية الأخيرة
            </h2>
            <button
              onClick={() => router.push('/dashboard/patient/records')}
              className="text-sm text-primary hover:underline"
            >
              عرض الكل
            </button>
          </div>
          <div className="space-y-3">
            {recentRecords.map((record) => (
              <div
                key={record.id}
                className="p-4 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="font-bold text-gray-900 mb-1">{record.record_type}</div>
                    {record.doctor_name && (
                      <div className="text-sm text-gray-600 mb-2">الطبيب: {record.doctor_name}</div>
                    )}
                    <div className="text-xs text-gray-400">
                      {new Date(record.date).toLocaleDateString('ar-SA')}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

