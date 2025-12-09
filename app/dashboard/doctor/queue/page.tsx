'use client'

import { Clock, Eye, MessageSquare, Phone, UserCheck, X } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

interface QueueItem {
  id: string
  patient_id: string
  appointment_id?: string
  status: string
  created_at: string
  patients?: {
    id: string
    name: string
    phone: string
  }
  appointments?: {
    id: string
    date: string
  }
}

export default function QueuePage() {
  const router = useRouter()
  const [queue, setQueue] = useState<QueueItem[]>([])
  const [loading, setLoading] = useState(true)
  const [clinicStatus, setClinicStatus] = useState({ isOpen: false, currentQueue: 0 })

  useEffect(() => {
    fetchQueue()
    fetchClinicStatus()
    // Refresh every 30 seconds
    const interval = setInterval(() => {
      fetchQueue()
      fetchClinicStatus()
    }, 30000)
    return () => clearInterval(interval)
  }, [])

  const fetchQueue = async () => {
    try {
      const res = await fetch('/api/doctor/queue')
      const json = await res.json()
      if (json.success) {
        setQueue(json.data || [])
      }
    } catch (error) {
      console.error('Error fetching queue:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchClinicStatus = async () => {
    try {
      const res = await fetch('/api/doctor/clinic/settings')
      const json = await res.json()
      if (json.success && json.data) {
        setClinicStatus({
          isOpen: json.data.is_open || false,
          currentQueue: json.data.current_queue_count || 0,
        })
      }
    } catch (error) {
      console.error('Error fetching clinic status:', error)
    }
  }

  const handleStartSession = async (item: QueueItem) => {
    try {
      // Update visit status to 'with_doctor'
      const res = await fetch(`/api/doctor/patient-visit`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: item.id,
          status: 'with_doctor',
        }),
      })

      if (res.ok) {
        toast.success('تم بدء الجلسة')
        // Navigate to current patient page instead of patient details
        router.push(`/dashboard/doctor/current-patient`)
      }
    } catch (error) {
      toast.error('حدث خطأ في بدء الجلسة')
    }
  }

  const handleViewPatient = (patientId: string) => {
    // Navigate to current patient page if this is the current patient, otherwise to patient details
    router.push(`/dashboard/doctor/current-patient`)
  }

  if (loading) {
    return (
      <div className="p-8">
        <div className="text-center py-12">جاري تحميل البيانات...</div>
      </div>
    )
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-extrabold text-gray-900 mb-2">طابور الاستقبال</h1>
        <p className="text-gray-500 text-lg">إدارة المرضى في الانتظار</p>
      </div>

      {/* Clinic Status */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className={`w-4 h-4 rounded-full ${clinicStatus.isOpen ? 'bg-green-500' : 'bg-red-500'}`} />
            <div>
              <h3 className="font-bold text-lg text-gray-900">
                {clinicStatus.isOpen ? 'العيادة مفتوحة' : 'العيادة مغلقة'}
              </h3>
              <p className="text-sm text-gray-500">
                {clinicStatus.currentQueue} مريض في الانتظار
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            {!clinicStatus.isOpen ? (
              <button
                onClick={async () => {
                  const res = await fetch('/api/doctor/clinic/open', { method: 'POST' })
                  if (res.ok) {
                    toast.success('تم فتح العيادة')
                    fetchClinicStatus()
                  }
                }}
                className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold transition-colors"
              >
                فتح العيادة
              </button>
            ) : (
              <button
                onClick={async () => {
                  const res = await fetch('/api/doctor/clinic/close', { method: 'POST' })
                  if (res.ok) {
                    toast.success('تم إغلاق العيادة')
                    fetchClinicStatus()
                  }
                }}
                className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold transition-colors"
              >
                إغلاق العيادة
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Queue List */}
      {queue.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
          <UserCheck className="mx-auto text-gray-300 mb-4" size={48} />
          <p className="text-gray-500 text-lg">لا يوجد مرضى في الانتظار</p>
        </div>
      ) : (
        <div className="space-y-4">
          {queue.map((item, index) => (
            <div
              key={item.id}
              className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-all"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4 flex-1">
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center text-primary font-bold text-xl">
                    #{index + 1}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-gray-900 mb-2">
                      {item.patients?.name || 'مريض غير معروف'}
                    </h3>
                    <div className="flex items-center gap-6 text-sm text-gray-600 mb-4">
                      {item.patients?.phone && (
                        <span className="flex items-center gap-2">
                          <Phone size={16} />
                          {item.patients.phone}
                        </span>
                      )}
                      {item.appointments?.date && (
                        <span className="flex items-center gap-2">
                          <Clock size={16} />
                          {new Date(item.appointments.date).toLocaleTimeString('ar-SA', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      )}
                      <span className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-bold">
                        {item.status === 'confirmed_to_doctor' ? 'مؤكد' : 'في الانتظار'}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400">
                      وقت الوصول: {new Date(item.created_at).toLocaleTimeString('ar-SA')}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleStartSession(item)}
                    className="px-6 py-3 bg-primary hover:bg-primary-dark text-white rounded-xl font-bold transition-colors"
                  >
                    <UserCheck size={18} className="inline ml-2" />
                    بدء الجلسة
                  </button>
                  <button
                    onClick={() => handleViewPatient(item.patient_id)}
                    className="px-4 py-3 border border-gray-200 text-gray-600 rounded-xl font-bold hover:bg-gray-50 transition-colors"
                  >
                    <Eye size={18} />
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

