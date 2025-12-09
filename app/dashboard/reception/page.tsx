'use client'

import { Bell, Calendar, CheckCircle, Clock, Phone, Search, User, XCircle } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

interface QueueItem {
  id: string
  patient_id: string
  patient_name: string
  patient_phone: string
  queue_number: number
  status: 'waiting' | 'checked_in' | 'in_progress' | 'completed' | 'cancelled' | 'no_show'
  checked_in_at: string
  called_at?: string
  seen_at?: string
  appointment_id?: string
  appointment_time?: string
  doctor_name?: string
  notes?: string
}

interface TodayStats {
  total: number
  waiting: number
  in_progress: number
  completed: number
  cancelled: number
}

export default function ReceptionPage() {
  const router = useRouter()
  const [queue, setQueue] = useState<QueueItem[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [stats, setStats] = useState<TodayStats>({ total: 0, waiting: 0, in_progress: 0, completed: 0, cancelled: 0 })
  const [selectedStatus, setSelectedStatus] = useState<string>('all')

  const calculateStats = (items: QueueItem[]) => {
    const safeItems = Array.isArray(items) ? items : []
    setStats({
      total: safeItems.length,
      waiting: safeItems.filter(i => i.status === 'waiting' || i.status === 'checked_in').length,
      in_progress: safeItems.filter(i => i.status === 'in_progress').length,
      completed: safeItems.filter(i => i.status === 'completed').length,
      cancelled: safeItems.filter(i => i.status === 'cancelled' || i.status === 'no_show').length
    })
  }

  const fetchQueue = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/reception/queue')
      const data = await res.json()
      if (data.success) {
        setQueue(data.data || [])
        calculateStats(data.data || [])
      }
    } catch (error) {
      console.error('Error fetching queue:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchQueue()
    const interval = setInterval(fetchQueue, 30000) // Refresh every 30 seconds
    return () => clearInterval(interval)
  }, [])

  const updateQueueStatus = async (id: string, status: QueueItem['status']) => {
    try {
      const res = await fetch(`/api/reception/queue/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      })
      const data = await res.json()
      if (data.success) {
        fetchQueue()
      }
    } catch (error) {
      console.error('Error updating queue:', error)
    }
  }

  const callNext = () => {
    const next = queue.find(q => q.status === 'waiting' || q.status === 'checked_in')
    if (next) {
      updateQueueStatus(next.id, 'in_progress')
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

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-extrabold text-gray-900 mb-2">لوحة تحكم الاستقبال</h1>
        <p className="text-gray-500 text-lg">نظرة شاملة على طابور المرضى والمواعيد</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        <div
          onClick={() => router.push('/dashboard/reception/queue')}
          className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition cursor-pointer"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-xl bg-blue-100 text-blue-600">
              <User size={24} />
            </div>
          </div>
          <div className="text-3xl font-bold text-gray-900">{stats.total}</div>
          <div className="text-sm text-gray-500 mt-1">إجمالي اليوم</div>
        </div>
        <div
          onClick={() => router.push('/dashboard/reception/queue')}
          className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition cursor-pointer"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-xl bg-yellow-100 text-yellow-600">
              <Clock size={24} />
            </div>
          </div>
          <div className="text-3xl font-bold text-yellow-600">{stats.waiting}</div>
          <div className="text-sm text-gray-500 mt-1">في الانتظار</div>
        </div>
        <div
          onClick={() => router.push('/dashboard/reception/queue')}
          className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition cursor-pointer"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-xl bg-primary/10 text-primary">
              <CheckCircle size={24} />
            </div>
          </div>
          <div className="text-3xl font-bold text-primary">{stats.in_progress}</div>
          <div className="text-sm text-gray-500 mt-1">قيد المعالجة</div>
        </div>
        <div
          onClick={() => router.push('/dashboard/reception/queue')}
          className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition cursor-pointer"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-xl bg-green-100 text-green-600">
              <CheckCircle size={24} />
            </div>
          </div>
          <div className="text-3xl font-bold text-green-600">{stats.completed}</div>
          <div className="text-sm text-gray-500 mt-1">مكتمل</div>
        </div>
        <div
          onClick={() => router.push('/dashboard/reception/queue')}
          className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition cursor-pointer"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-xl bg-red-100 text-red-600">
              <XCircle size={24} />
            </div>
          </div>
          <div className="text-3xl font-bold text-red-600">{stats.cancelled}</div>
          <div className="text-sm text-gray-500 mt-1">ملغي/لم يحضر</div>
        </div>
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
            onClick={() => router.push('/dashboard/reception/book-appointment')}
            className="bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-all"
          >
            <Calendar size={20} />
            حجز موعد
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredQueue.length === 0 ? (
          <div className="col-span-full text-center py-12 text-gray-500 bg-white rounded-2xl">
            {loading ? 'جاري التحميل...' : 'لا توجد حالات في الطابور'}
          </div>
        ) : (
          filteredQueue.map((item) => (
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
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${getStatusColor(item.status)}`}>
                    {getStatusLabel(item.status)}
                  </span>
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
                <div className="flex gap-2 pt-4 border-t border-gray-100">
                  {item.status === 'waiting' || item.status === 'checked_in' ? (
                    <>
                      <button
                        onClick={() => updateQueueStatus(item.id, 'in_progress')}
                        className="flex-1 bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-lg font-bold text-sm transition-colors"
                      >
                        بدء المعاينة
                      </button>
                      <button
                        onClick={() => updateQueueStatus(item.id, 'cancelled')}
                        className="px-4 py-2 border border-red-200 text-red-600 rounded-lg font-bold text-sm hover:bg-red-50 transition-colors"
                      >
                        إلغاء
                      </button>
                    </>
                  ) : item.status === 'in_progress' ? (
                    <>
                      <button
                        onClick={() => updateQueueStatus(item.id, 'completed')}
                        className="flex-1 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-bold text-sm transition-colors"
                      >
                        إكمال
                      </button>
                      <button
                        onClick={() => updateQueueStatus(item.id, 'no_show')}
                        className="px-4 py-2 border border-gray-200 text-gray-600 rounded-lg font-bold text-sm hover:bg-gray-50 transition-colors"
                      >
                        لم يحضر
                      </button>
                    </>
                  ) : null}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

