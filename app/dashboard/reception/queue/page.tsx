'use client'

import { Bell, Calendar, CheckCircle, Clock, Phone, Search, User, UserPlus, AlertCircle, Send } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
// // import { toast } from 'sonner' // TODO: Install sonner package
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
import { createBrowserClient } from '@supabase/ssr'

interface QueueItem {
  id: string
  patient_id: string
  patient_name: string
  patient_phone: string
  queue_number: number
  status: 'waiting' | 'checked_in' | 'in_progress' | 'completed' | 'cancelled' | 'no_show'
  priority: 'normal' | 'urgent' | 'vip'
  checked_in_at: string
  called_at?: string
  seen_at?: string
  appointment_id?: string
  appointment_time?: string
  doctor_id?: string
  doctor_name?: string
  notes?: string
  service_type?: string
  appointments?: {
    service_type?: string
  }
}

interface Doctor {
  id: string
  name: string
  role: string
}

export default function QueuePage() {
  const router = useRouter()
  const [queue, setQueue] = useState<QueueItem[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedStatus, setSelectedStatus] = useState<string>('all')
  const [doctors, setDoctors] = useState<Doctor[]>([])
  const [confirmingToDoctor, setConfirmingToDoctor] = useState<string | null>(null)
  const [paymentCheck, setPaymentCheck] = useState<any>(null)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [selectedQueueItem, setSelectedQueueItem] = useState<QueueItem | null>(null)

  // Create Supabase client for realtime
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  useEffect(() => {
    fetchDoctors()
  }, [])

  const fetchDoctors = async () => {
    try {
      const res = await fetch('/api/users?role=doctor')
      const data = await res.json()
      if (data.success) {
        setDoctors(data.data || [])
      }
    } catch (error) {
      console.error('Error fetching doctors:', error)
    }
  }

  const fetchQueue = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/reception/queue')
      const data = await res.json()
      if (data.success) {
        setQueue(data.data || [])
      }
    } catch (error) {
      console.error('Error fetching queue:', error)
      toast.error('فشل تحميل الطابور')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchQueue()
    const interval = setInterval(fetchQueue, 30000) // Refresh every 30 seconds
    return () => clearInterval(interval)
  }, [])

  // Real-time subscription for queue updates
  useEffect(() => {
    const channel = supabase
      .channel('reception-queue-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'reception_queue',
        },
        () => {
          fetchQueue()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [supabase])

  const updateQueueStatus = async (id: string, status: QueueItem['status']) => {
    try {
      const res = await fetch(`/api/reception/queue/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      })
      const data = await res.json()
      if (data.success) {
        toast.success('تم تحديث الحالة بنجاح')
        fetchQueue()
      } else {
        toast.error(data.error || 'فشل تحديث الحالة')
      }
    } catch (error) {
      console.error('Error updating queue:', error)
      toast.error('حدث خطأ أثناء التحديث')
    }
  }

  const checkPaymentBeforeConfirm = async (queueItem: QueueItem, doctorId: string) => {
    try {
      // Check payment status
      const res = await fetch('/api/reception/payment/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patient_id: queueItem.patient_id,
          session_type: queueItem.service_type || queueItem.appointments?.service_type || 'consultation',
          service_type: queueItem.service_type || queueItem.appointments?.service_type
        })
      })
      const data = await res.json()
      
      if (data.success) {
        const verification = data.data
        
        if (!verification.canProceed) {
          // Show payment modal
          setPaymentCheck(verification)
          setSelectedQueueItem(queueItem)
          setShowPaymentModal(true)
          return
        }
        
        // Proceed with confirmation
        await confirmToDoctor(queueItem.id, doctorId)
      }
    } catch (error) {
      console.error('Error checking payment:', error)
      // Continue anyway (graceful degradation)
      await confirmToDoctor(queueItem.id, doctorId)
    }
  }

  const confirmToDoctor = async (queueId: string, doctorId: string) => {
    try {
      setConfirmingToDoctor(queueId)
      const res = await fetch(`/api/reception/queue/${queueId}/confirm-to-doctor`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ doctor_id: doctorId })
      })
      const data = await res.json()
      if (data.success) {
        toast.success('تم تأكيد المريض للطبيب بنجاح')
        fetchQueue()
        setShowPaymentModal(false)
        setPaymentCheck(null)
        setSelectedQueueItem(null)
      } else {
        if (data.requiredActions && data.requiredActions.length > 0) {
          // Show payment modal with required actions
          setPaymentCheck(data)
          setSelectedQueueItem(queue.find(q => q.id === queueId) || null)
          setShowPaymentModal(true)
        } else {
          toast.error(data.error || 'فشل التأكيد')
        }
      }
    } catch (error) {
      console.error('Error confirming to doctor:', error)
      toast.error('حدث خطأ أثناء التأكيد')
    } finally {
      setConfirmingToDoctor(null)
    }
  }

  const callNext = () => {
    const next = queue.find(q => q.status === 'waiting' || q.status === 'checked_in')
    if (next) {
      updateQueueStatus(next.id, 'in_progress')
    } else {
      toast.info('لا يوجد مرضى في الانتظار')
    }
  }

  const filteredQueue = queue.filter(item => {
    const matchesSearch =
      item.patient_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.patient_phone.includes(searchTerm) ||
      item.queue_number.toString().includes(searchTerm)

    const matchesStatus = selectedStatus === 'all' || item.status === selectedStatus

    return matchesSearch && matchesStatus
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'waiting': return 'bg-yellow-100 text-yellow-700'
      case 'checked_in': return 'bg-blue-100 text-blue-700'
      case 'in_progress': return 'bg-primary/10 text-primary'
      case 'completed': return 'bg-green-100 text-green-700'
      case 'cancelled': return 'bg-red-100 text-red-700'
      case 'no_show': return 'bg-gray-100 text-gray-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'waiting': return 'في الانتظار'
      case 'checked_in': return 'تم التسجيل'
      case 'in_progress': return 'قيد المعالجة'
      case 'completed': return 'مكتمل'
      case 'cancelled': return 'ملغي'
      case 'no_show': return 'لم يحضر'
      default: return status
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-700'
      case 'vip': return 'bg-purple-100 text-purple-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-extrabold text-gray-900 mb-2">شاشة الطابور</h1>
        <p className="text-gray-500 text-lg">إدارة طابور المرضى والمواعيد</p>
      </div>

      {/* Actions Bar */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="flex-1 w-full md:w-auto">
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

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent"
          >
            <option value="all">جميع الحالات</option>
            <option value="waiting">في الانتظار</option>
            <option value="checked_in">تم التسجيل</option>
            <option value="in_progress">قيد المعالجة</option>
            <option value="completed">مكتمل</option>
            <option value="cancelled">ملغي</option>
          </select>

          <button
            onClick={() => router.push('/dashboard/reception/patients/new')}
            className="bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-all"
          >
            <UserPlus size={20} />
            تسجيل مريض
          </button>

          <button
            onClick={callNext}
            className="bg-primary hover:bg-primary-dark text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-all shadow-lg shadow-primary/20"
          >
            <Bell size={20} />
            استدعاء التالي
          </button>
        </div>
      </div>

      {/* Queue List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-gray-500">جاري التحميل...</p>
          </div>
        </div>
      ) : filteredQueue.length === 0 ? (
        <div className="text-center py-12 text-gray-500 bg-white rounded-2xl">
          لا توجد حالات في الطابور
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredQueue.map((item) => (
            <div
              key={item.id}
              className={`bg-white rounded-2xl shadow-sm border-2 transition-all hover:shadow-lg ${
                item.status === 'in_progress' ? 'border-primary' : 'border-gray-100'
              }`}
            >
              <div className="p-6">
                {/* Queue Number Badge */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-16 h-16 bg-primary/10 rounded-xl flex items-center justify-center">
                      <span className="text-2xl font-bold text-primary">#{item.queue_number}</span>
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">{item.patient_name}</h3>
                      <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
                        <Phone size={14} />
                        {item.patient_phone}
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2 items-end">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${getStatusColor(item.status)}`}>
                      {getStatusLabel(item.status)}
                    </span>
                    {item.priority !== 'normal' && (
                      <span className={`px-2 py-1 rounded-full text-xs font-bold ${getPriorityColor(item.priority)}`}>
                        {item.priority === 'urgent' ? 'عاجل' : 'VIP'}
                      </span>
                    )}
                  </div>
                </div>

                {/* Appointment Info */}
                {item.appointment_time && (
                  <div className="flex items-center gap-2 text-sm text-gray-600 mb-3 p-3 bg-gray-50 rounded-lg">
                    <Calendar size={16} />
                    <span>موعد: {new Date(item.appointment_time).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                )}

                {item.doctor_name && (
                  <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
                    <User size={16} />
                    <span>الدكتور: {item.doctor_name}</span>
                  </div>
                )}

                {/* Timestamps */}
                <div className="space-y-2 text-xs text-gray-400 mb-4">
                  {item.checked_in_at && (
                    <div className="flex items-center gap-2">
                      <Clock size={12} />
                      تسجيل: {new Date(item.checked_in_at).toLocaleTimeString('ar-SA')}
                    </div>
                  )}
                  {item.called_at && (
                    <div className="flex items-center gap-2">
                      <Bell size={12} />
                      استدعاء: {new Date(item.called_at).toLocaleTimeString('ar-SA')}
                    </div>
                  )}
                  {item.seen_at && (
                    <div className="flex items-center gap-2">
                      <CheckCircle size={12} />
                      معاينة: {new Date(item.seen_at).toLocaleTimeString('ar-SA')}
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-2 pt-4 border-t border-gray-100">
                  {item.status === 'waiting' || item.status === 'checked_in' ? (
                    <>
                      <button
                        onClick={() => updateQueueStatus(item.id, 'in_progress')}
                        className="w-full bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-lg font-bold text-sm transition-colors"
                      >
                        بدء المعاينة
                      </button>
                      {doctors.length > 0 && (
                        <select
                          data-queue-id={item.id}
                          onChange={(e) => {
                            if (e.target.value) {
                              checkPaymentBeforeConfirm(item, e.target.value)
                            }
                          }}
                          disabled={confirmingToDoctor === item.id}
                          className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-transparent"
                        >
                          <option value="">إرسال للطبيب...</option>
                          {doctors.map(doctor => (
                            <option key={doctor.id} value={doctor.id}>
                              {doctor.name}
                            </option>
                          ))}
                        </select>
                      )}
                      <button
                        onClick={() => updateQueueStatus(item.id, 'cancelled')}
                        className="w-full px-4 py-2 border border-red-200 text-red-600 rounded-lg font-bold text-sm hover:bg-red-50 transition-colors"
                      >
                        إلغاء
                      </button>
                    </>
                  ) : item.status === 'in_progress' ? (
                    <>
                      <button
                        onClick={() => updateQueueStatus(item.id, 'completed')}
                        className="w-full bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-bold text-sm transition-colors"
                      >
                        إكمال
                      </button>
                      <button
                        onClick={() => updateQueueStatus(item.id, 'no_show')}
                        className="w-full px-4 py-2 border border-gray-200 text-gray-600 rounded-lg font-bold text-sm hover:bg-gray-50 transition-colors"
                      >
                        لم يحضر
                      </button>
                    </>
                  ) : null}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Payment Verification Modal */}
      {showPaymentModal && selectedQueueItem && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900">التحقق من الدفع</h2>
            </div>
            <div className="p-6">
              <div className="mb-4">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                    <User size={24} className="text-primary" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900">{selectedQueueItem.patient_name}</h3>
                    <p className="text-sm text-gray-500">{selectedQueueItem.patient_phone}</p>
                  </div>
                </div>
              </div>

              {paymentCheck && (
                <div className="space-y-4">
                  <div className={`p-4 rounded-xl ${
                    paymentCheck.canProceed 
                      ? 'bg-green-50 border border-green-200' 
                      : 'bg-yellow-50 border border-yellow-200'
                  }`}>
                    <div className="flex items-start gap-3">
                      {paymentCheck.canProceed ? (
                        <CheckCircle className="text-green-600 mt-1" size={20} />
                      ) : (
                        <AlertCircle className="text-yellow-600 mt-1" size={20} />
                      )}
                      <div>
                        <p className="font-bold text-gray-900 mb-1">
                          {paymentCheck.canProceed ? 'يمكن المتابعة' : 'لا يمكن المتابعة'}
                        </p>
                        <p className="text-sm text-gray-700">{paymentCheck.reason}</p>
                      </div>
                    </div>
                  </div>

                  {!paymentCheck.canProceed && paymentCheck.requiredActions && (
                    <div className="space-y-2">
                      <p className="font-bold text-gray-900">الإجراءات المطلوبة:</p>
                      {paymentCheck.requiredActions.includes('payment') && (
                        <button
                          onClick={() => {
                            router.push(`/dashboard/reception/billing?patient_id=${selectedQueueItem.patient_id}`)
                          }}
                          className="w-full bg-primary hover:bg-primary-dark text-white px-4 py-3 rounded-lg font-bold transition-colors"
                        >
                          دفع الرسوم
                        </button>
                      )}
                      {paymentCheck.requiredActions.includes('insurance_approval') && (
                        <button
                          onClick={() => {
                            router.push(`/dashboard/reception/insurance/request?patient_id=${selectedQueueItem.patient_id}`)
                          }}
                          className="w-full bg-blue-500 hover:bg-blue-600 text-white px-4 py-3 rounded-lg font-bold transition-colors"
                        >
                          طلب موافقة التأمين
                        </button>
                      )}
                    </div>
                  )}

                  {paymentCheck.paymentStatus && (
                    <div className="p-4 bg-gray-50 rounded-xl">
                      <p className="text-sm font-bold text-gray-700 mb-2">حالة الدفع:</p>
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">تم الدفع:</span>
                          <span className={paymentCheck.paymentStatus.paid ? 'text-green-600 font-bold' : 'text-red-600 font-bold'}>
                            {paymentCheck.paymentStatus.paid ? 'نعم' : 'لا'}
                          </span>
                        </div>
                        {paymentCheck.paymentStatus.amount > 0 && (
                          <div className="flex justify-between">
                            <span className="text-gray-600">المبلغ:</span>
                            <span className="font-bold">{paymentCheck.paymentStatus.amount} ريال</span>
                          </div>
                        )}
                        {paymentCheck.paymentStatus.insuranceApproved !== undefined && (
                          <div className="flex justify-between">
                            <span className="text-gray-600">موافقة التأمين:</span>
                            <span className={paymentCheck.paymentStatus.insuranceApproved ? 'text-green-600 font-bold' : 'text-red-600 font-bold'}>
                              {paymentCheck.paymentStatus.insuranceApproved ? 'موجودة' : 'غير موجودة'}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="flex gap-4 mt-6 pt-6 border-t border-gray-200">
                <button
                  onClick={() => {
                    setShowPaymentModal(false)
                    setPaymentCheck(null)
                    setSelectedQueueItem(null)
                  }}
                  className="flex-1 px-4 py-3 border border-gray-200 text-gray-600 font-bold rounded-lg hover:bg-gray-50 transition-colors"
                >
                  إلغاء
                </button>
                {paymentCheck?.canProceed && (
                  <button
                    onClick={() => {
                      if (selectedQueueItem && doctors.length > 0) {
                        const doctorSelect = document.querySelector(`select[data-queue-id="${selectedQueueItem.id}"]`) as HTMLSelectElement
                        if (doctorSelect && doctorSelect.value) {
                          confirmToDoctor(selectedQueueItem.id, doctorSelect.value)
                        }
                      }
                    }}
                    className="flex-1 bg-primary hover:bg-primary-dark text-white px-4 py-3 rounded-lg font-bold transition-colors"
                  >
                    المتابعة
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
