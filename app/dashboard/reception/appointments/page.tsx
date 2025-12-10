'use client'

/**
 * Reception Appointments Management Page
 * Manage all appointments from reception perspective
 */

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Calendar, Clock, User, Search, Filter, Plus, CheckCircle, XCircle, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'

interface Appointment {
  id: string
  patient_id: string
  patient_name: string
  patient_phone: string
  doctor_id?: string
  doctor_name?: string
  date: string
  time: string
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'no_show'
  appointment_type?: string
  notes?: string
  created_at: string
}

export default function ReceptionAppointmentsPage() {
  const router = useRouter()
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [filterDate, setFilterDate] = useState<string>('today')

  const loadAppointments = useCallback(async () => {
    try {
      setLoading(true)
      let url = '/api/appointments'
      
      if (filterDate === 'today') {
        const today = new Date().toISOString().split('T')[0]
        url += `?date=${today}`
      } else if (filterDate === 'week') {
        const startDate = new Date()
        startDate.setDate(startDate.getDate() - 7)
        url += `?start_date=${startDate.toISOString().split('T')[0]}`
      }

      const res = await fetch(url)
      const data = await res.json()
      if (data.success) {
        setAppointments(data.data || [])
      }
    } catch (error) {
      console.error('Error loading appointments:', error)
    } finally {
      setLoading(false)
    }
  }, [filterDate])

  useEffect(() => {
    loadAppointments()
  }, [loadAppointments])

  const updateAppointmentStatus = async (id: string, status: string) => {
    try {
      const res = await fetch(`/api/appointments/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      const data = await res.json()
      if (data.success) {
        toast.success('تم تحديث حالة الموعد')
        loadAppointments()
      } else {
        toast.error('فشل تحديث الموعد')
      }
    } catch (error) {
      console.error('Error updating appointment:', error)
      toast.error('فشل تحديث الموعد')
    }
  }

  const filteredAppointments = appointments.filter((apt) => {
    const matchesSearch =
      !searchTerm ||
      apt.patient_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      apt.patient_phone?.includes(searchTerm) ||
      apt.doctor_name?.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStatus = filterStatus === 'all' || apt.status === filterStatus

    return matchesSearch && matchesStatus
  })

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'confirmed':
        return <CheckCircle size={18} className="text-green-500" />
      case 'cancelled':
        return <XCircle size={18} className="text-red-500" />
      case 'completed':
        return <CheckCircle size={18} className="text-blue-500" />
      case 'no_show':
        return <AlertCircle size={18} className="text-orange-500" />
      default:
        return <Clock size={18} className="text-yellow-500" />
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending':
        return 'قيد الانتظار'
      case 'confirmed':
        return 'مؤكد'
      case 'cancelled':
        return 'ملغي'
      case 'completed':
        return 'مكتمل'
      case 'no_show':
        return 'لم يحضر'
      default:
        return status
    }
  }

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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-extrabold text-gray-900 mb-2">إدارة المواعيد</h1>
            <p className="text-gray-500 text-lg">عرض وإدارة جميع المواعيد</p>
          </div>
          <button
            onClick={() => router.push('/dashboard/reception/book-appointment')}
            className="flex items-center gap-2 bg-primary text-white px-6 py-3 rounded-xl hover:bg-primary-dark transition-colors"
          >
            <Plus size={20} />
            حجز موعد جديد
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <Search size={20} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="ابحث في المواعيد..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pr-10 pl-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>

          {/* Date Filter */}
          <div>
            <select
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="today">اليوم</option>
              <option value="week">آخر 7 أيام</option>
              <option value="month">هذا الشهر</option>
              <option value="all">الكل</option>
            </select>
          </div>

          {/* Status Filter */}
          <div className="flex gap-2">
            {(['all', 'pending', 'confirmed', 'cancelled', 'completed', 'no_show'] as const).map((status) => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filterStatus === status
                    ? 'bg-primary text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {status === 'all' && 'الكل'}
                {status === 'pending' && 'قيد الانتظار'}
                {status === 'confirmed' && 'مؤكد'}
                {status === 'cancelled' && 'ملغي'}
                {status === 'completed' && 'مكتمل'}
                {status === 'no_show' && 'لم يحضر'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Appointments List */}
      {filteredAppointments.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
          <Calendar size={48} className="mx-auto text-gray-400 mb-4" />
          <div className="text-gray-500 text-lg mb-2">لا توجد مواعيد</div>
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
                    <h3 className="text-xl font-bold text-gray-900">{appointment.patient_name}</h3>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      appointment.status === 'confirmed'
                        ? 'bg-green-100 text-green-700'
                        : appointment.status === 'cancelled'
                        ? 'bg-red-100 text-red-700'
                        : appointment.status === 'completed'
                        ? 'bg-blue-100 text-blue-700'
                        : appointment.status === 'no_show'
                        ? 'bg-orange-100 text-orange-700'
                        : 'bg-yellow-100 text-yellow-700'
                    }`}>
                      {getStatusText(appointment.status)}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div className="space-y-2 text-sm text-gray-600">
                      <div className="flex items-center gap-2">
                        <Calendar size={16} className="text-gray-400" />
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
                        <Clock size={16} className="text-gray-400" />
                        <span>{appointment.time || new Date(appointment.date).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                      {appointment.doctor_name && (
                        <div className="flex items-center gap-2">
                          <User size={16} className="text-gray-400" />
                          <span>الطبيب: {appointment.doctor_name}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <span className="text-gray-400">📱</span>
                        <span>{appointment.patient_phone}</span>
                      </div>
                    </div>

                    {appointment.appointment_type && (
                      <div className="text-sm text-gray-600">
                        <strong>نوع الموعد:</strong> {appointment.appointment_type}
                      </div>
                    )}

                    {appointment.notes && (
                      <div className="col-span-full p-3 bg-gray-50 rounded-lg">
                        <p className="text-sm text-gray-600">{appointment.notes}</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex flex-col gap-2 ml-4">
                  {appointment.status === 'pending' && (
                    <button
                      onClick={() => updateAppointmentStatus(appointment.id, 'confirmed')}
                      className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-colors"
                    >
                      تأكيد
                    </button>
                  )}
                  {appointment.status !== 'cancelled' && appointment.status !== 'completed' && (
                    <button
                      onClick={() => updateAppointmentStatus(appointment.id, 'cancelled')}
                      className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors"
                    >
                      إلغاء
                    </button>
                  )}
                  <button
                    onClick={() => router.push(`/dashboard/reception/patients/${appointment.patient_id}`)}
                    className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition-colors"
                  >
                    عرض الملف
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
