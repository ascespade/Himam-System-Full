'use client'

/**
 * Patient Appointments Page
 * View and manage patient appointments
 */

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'
import { Calendar, Clock, User, MapPin, CheckCircle, XCircle, AlertCircle } from 'lucide-react'

interface Appointment {
  id: string
  date: string
  doctor_name: string
  doctor_id?: string
  status: string
  service_type?: string
  notes?: string
  location?: string
}

export default function PatientAppointmentsPage() {
  const router = useRouter()
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'past' | 'cancelled'>('all')

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  useEffect(() => {
    loadAppointments()
  }, [])

  const loadAppointments = async () => {
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

        // Load appointments
        const appointmentsRes = await fetch(`/api/appointments?patient_id=${patientInfo.id}`)
        const appointmentsData = await appointmentsRes.json()
        if (appointmentsData.success) {
          setAppointments(appointmentsData.data || [])
        }
      }
    } catch (error) {
      console.error('Error loading appointments:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'confirmed':
        return <CheckCircle size={18} className="text-green-500" />
      case 'cancelled':
        return <XCircle size={18} className="text-red-500" />
      case 'completed':
        return <CheckCircle size={18} className="text-blue-500" />
      default:
        return <AlertCircle size={18} className="text-yellow-500" />
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'مؤكد'
      case 'cancelled':
        return 'ملغي'
      case 'completed':
        return 'مكتمل'
      case 'pending':
        return 'قيد الانتظار'
      default:
        return status
    }
  }

  const filteredAppointments = appointments.filter((apt) => {
    const aptDate = new Date(apt.date)
    const now = new Date()

    switch (filter) {
      case 'upcoming':
        return aptDate >= now && apt.status !== 'cancelled'
      case 'past':
        return aptDate < now || apt.status === 'completed'
      case 'cancelled':
        return apt.status === 'cancelled'
      default:
        return true
    }
  })

  if (loading) {
    return (
      <div className="p-8">
        <div className="text-center text-gray-500">جاري تحميل المواعيد...</div>
      </div>
    )
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-extrabold text-gray-900 mb-2">مواعيدي</h1>
        <p className="text-gray-500 text-lg">عرض وإدارة جميع المواعيد</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 mb-6">
        <div className="flex gap-2">
          {(['all', 'upcoming', 'past', 'cancelled'] as const).map((filterOption) => (
            <button
              key={filterOption}
              onClick={() => setFilter(filterOption)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === filterOption
                  ? 'bg-primary text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {filterOption === 'all' && 'الكل'}
              {filterOption === 'upcoming' && 'القادمة'}
              {filterOption === 'past' && 'السابقة'}
              {filterOption === 'cancelled' && 'الملغاة'}
            </button>
          ))}
        </div>
      </div>

      {/* Appointments List */}
      {filteredAppointments.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
          <Calendar size={48} className="mx-auto text-gray-400 mb-4" />
          <div className="text-gray-500 text-lg mb-2">لا توجد مواعيد</div>
          <div className="text-gray-400 text-sm">
            {filter === 'all' && 'لم يتم حجز أي مواعيد بعد'}
            {filter === 'upcoming' && 'لا توجد مواعيد قادمة'}
            {filter === 'past' && 'لا توجد مواعيد سابقة'}
            {filter === 'cancelled' && 'لا توجد مواعيد ملغاة'}
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredAppointments.map((appointment) => (
            <div
              key={appointment.id}
              className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    {getStatusIcon(appointment.status)}
                    <h3 className="text-xl font-bold text-gray-900">{appointment.doctor_name}</h3>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      appointment.status === 'confirmed'
                        ? 'bg-green-100 text-green-700'
                        : appointment.status === 'cancelled'
                        ? 'bg-red-100 text-red-700'
                        : appointment.status === 'completed'
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-yellow-100 text-yellow-700'
                    }`}>
                      {getStatusText(appointment.status)}
                    </span>
                  </div>

                  <div className="space-y-2 text-gray-600">
                    <div className="flex items-center gap-2">
                      <Calendar size={18} className="text-gray-400" />
                      <span>
                        {new Date(appointment.date).toLocaleDateString('ar-SA', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Clock size={18} className="text-gray-400" />
                      <span>
                        {new Date(appointment.date).toLocaleTimeString('ar-SA', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>

                    {appointment.service_type && (
                      <div className="flex items-center gap-2">
                        <span className="text-gray-400">📋</span>
                        <span>{appointment.service_type}</span>
                      </div>
                    )}

                    {appointment.location && (
                      <div className="flex items-center gap-2">
                        <MapPin size={18} className="text-gray-400" />
                        <span>{appointment.location}</span>
                      </div>
                    )}

                    {appointment.notes && (
                      <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                        <p className="text-sm text-gray-600">{appointment.notes}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
