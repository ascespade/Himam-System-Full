<<<<<<< HEAD
'use client'

import { Bell, Calendar, CheckCircle, Clock, Phone, Search, User } from 'lucide-react'
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
        <h1 className="text-4xl font-extrabold text-gray-900 mb-2">شاشة الاستقبال</h1>
        <p className="text-gray-500 text-lg">إدارة طابور المرضى والمواعيد</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="text-3xl font-bold text-gray-900">{stats.total}</div>
          <div className="text-sm text-gray-500 mt-1">إجمالي اليوم</div>
        </div>
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="text-3xl font-bold text-yellow-600">{stats.waiting}</div>
          <div className="text-sm text-gray-500 mt-1">في الانتظار</div>
        </div>
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="text-3xl font-bold text-primary">{stats.in_progress}</div>
          <div className="text-sm text-gray-500 mt-1">قيد المعالجة</div>
        </div>
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="text-3xl font-bold text-green-600">{stats.completed}</div>
          <div className="text-sm text-gray-500 mt-1">مكتمل</div>
        </div>
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
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

=======
'use client'

import {
  Activity,
  Calendar,
  Clock,
  Users,
  Search,
  Bell,
  TrendingUp,
  CheckCircle,
  AlertCircle,
  UserPlus,
  Phone,
  FileText,
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect, useState, useCallback } from 'react'
import { toast } from '@/shared/utils/toast'
import { createBrowserClient } from '@supabase/ssr'

interface DashboardStats {
  patients: {
    newToday: number
    total: number
  }
  appointments: {
    today: number
    confirmed: number
    pending: number
  }
  queue: {
    total: number
    waiting: number
    inProgress: number
    completed: number
  }
  upcomingAppointments: Array<{
    id: string
    date: string
    patient_name: string
    phone: string
  }>
}

export default function ReceptionDashboard() {
  const router = useRouter()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [activeTab, setActiveTab] = useState<'overview' | 'queue' | 'appointments'>('overview')

  // Create Supabase client for realtime
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  // Fetch dashboard data
  const fetchDashboardData = useCallback(async () => {
    try {
      const res = await fetch('/api/reception/dashboard/stats')
      const data = await res.json()
      if (data.success) {
        setStats(data.data)
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
      toast.error('فشل تحميل البيانات')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchDashboardData()
    const interval = setInterval(fetchDashboardData, 30000) // Refresh every 30 seconds
    return () => clearInterval(interval)
  }, [fetchDashboardData])

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
          fetchDashboardData()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [supabase, fetchDashboardData])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-500">جاري التحميل...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-extrabold text-gray-900 mb-2">لوحة تحكم الاستقبال</h1>
        <p className="text-gray-500 text-lg">إدارة المرضى والمواعيد والطابور</p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <button
          onClick={() => router.push('/dashboard/reception/patients/new')}
          className="bg-white border-2 border-primary text-primary hover:bg-primary hover:text-white rounded-2xl p-6 shadow-sm transition-all flex items-center gap-4"
        >
          <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
            <UserPlus className="text-primary" size={24} />
          </div>
          <div className="text-right">
            <div className="font-bold text-lg">تسجيل مريض جديد</div>
            <div className="text-sm text-gray-500">إضافة مريض جديد للنظام</div>
          </div>
        </button>

        <button
          onClick={() => router.push('/dashboard/reception/appointments/new')}
          className="bg-white border-2 border-blue-500 text-blue-600 hover:bg-blue-500 hover:text-white rounded-2xl p-6 shadow-sm transition-all flex items-center gap-4"
        >
          <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center">
            <Calendar className="text-blue-600" size={24} />
          </div>
          <div className="text-right">
            <div className="font-bold text-lg">حجز موعد</div>
            <div className="text-sm text-gray-500">حجز موعد جديد</div>
          </div>
        </button>

        <button
          onClick={() => router.push('/dashboard/reception/queue')}
          className="bg-white border-2 border-yellow-500 text-yellow-600 hover:bg-yellow-500 hover:text-white rounded-2xl p-6 shadow-sm transition-all flex items-center gap-4"
        >
          <div className="w-12 h-12 bg-yellow-500/10 rounded-xl flex items-center justify-center">
            <Users className="text-yellow-600" size={24} />
          </div>
          <div className="text-right">
            <div className="font-bold text-lg">الطابور</div>
            <div className="text-sm text-gray-500">إدارة طابور المرضى</div>
          </div>
        </button>

        <button
          onClick={() => router.push('/dashboard/reception/patients')}
          className="bg-white border-2 border-green-500 text-green-600 hover:bg-green-500 hover:text-white rounded-2xl p-6 shadow-sm transition-all flex items-center gap-4"
        >
          <div className="w-12 h-12 bg-green-500/10 rounded-xl flex items-center justify-center">
            <FileText className="text-green-600" size={24} />
          </div>
          <div className="text-right">
            <div className="font-bold text-lg">قائمة المرضى</div>
            <div className="text-sm text-gray-500">عرض جميع المرضى</div>
          </div>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* New Patients Today */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center">
              <UserPlus className="text-blue-600" size={24} />
            </div>
            <TrendingUp className="text-green-500" size={20} />
          </div>
          <div className="text-3xl font-bold text-gray-900 mb-1">
            {stats?.patients.newToday || 0}
          </div>
          <div className="text-sm text-gray-500">مرضى جدد اليوم</div>
        </div>

        {/* Total Patients */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
              <Users className="text-primary" size={24} />
            </div>
          </div>
          <div className="text-3xl font-bold text-gray-900 mb-1">
            {stats?.patients.total || 0}
          </div>
          <div className="text-sm text-gray-500">إجمالي المرضى</div>
        </div>

        {/* Appointments Today */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-purple-500/10 rounded-xl flex items-center justify-center">
              <Calendar className="text-purple-600" size={24} />
            </div>
          </div>
          <div className="text-3xl font-bold text-gray-900 mb-1">
            {stats?.appointments.today || 0}
          </div>
          <div className="text-sm text-gray-500">مواعيد اليوم</div>
          <div className="flex gap-2 mt-2 text-xs">
            <span className="text-green-600">✓ {stats?.appointments.confirmed || 0} مؤكد</span>
            <span className="text-yellow-600">⏳ {stats?.appointments.pending || 0} معلق</span>
          </div>
        </div>

        {/* Queue Stats */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-yellow-500/10 rounded-xl flex items-center justify-center">
              <Clock className="text-yellow-600" size={24} />
            </div>
          </div>
          <div className="text-3xl font-bold text-gray-900 mb-1">
            {stats?.queue.total || 0}
          </div>
          <div className="text-sm text-gray-500">إجمالي الطابور</div>
          <div className="flex gap-2 mt-2 text-xs">
            <span className="text-yellow-600">⏳ {stats?.queue.waiting || 0} في الانتظار</span>
            <span className="text-primary">🔄 {stats?.queue.inProgress || 0} قيد المعالجة</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 mb-6">
        <div className="flex border-b border-gray-100">
          <button
            onClick={() => setActiveTab('overview')}
            className={`flex-1 px-6 py-4 font-bold transition-colors ${
              activeTab === 'overview'
                ? 'text-primary border-b-2 border-primary'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            النظرة العامة
          </button>
          <button
            onClick={() => setActiveTab('queue')}
            className={`flex-1 px-6 py-4 font-bold transition-colors ${
              activeTab === 'queue'
                ? 'text-primary border-b-2 border-primary'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            الطابور
          </button>
          <button
            onClick={() => setActiveTab('appointments')}
            className={`flex-1 px-6 py-4 font-bold transition-colors ${
              activeTab === 'appointments'
                ? 'text-primary border-b-2 border-primary'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            المواعيد القادمة
          </button>
        </div>

        <div className="p-6">
          {activeTab === 'overview' && (
            <div className="space-y-4">
              <h3 className="text-xl font-bold text-gray-900 mb-4">المواعيد القادمة (خلال ساعتين)</h3>
              {stats?.upcomingAppointments && stats.upcomingAppointments.length > 0 ? (
                <div className="space-y-3">
                  {stats.upcomingAppointments.map((apt) => (
                    <div
                      key={apt.id}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors cursor-pointer"
                      onClick={() => router.push(`/dashboard/reception/appointments/${apt.id}`)}
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                          <Calendar className="text-primary" size={20} />
                        </div>
                        <div>
                          <div className="font-bold text-gray-900">{apt.patient_name}</div>
                          <div className="text-sm text-gray-500 flex items-center gap-2">
                            <Phone size={14} />
                            {apt.phone}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-bold text-gray-900">
                          {new Date(apt.date).toLocaleTimeString('ar-SA', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </div>
                        <div className="text-xs text-gray-500">
                          {new Date(apt.date).toLocaleDateString('ar-SA')}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  لا توجد مواعيد قادمة
                </div>
              )}
            </div>
          )}

          {activeTab === 'queue' && (
            <div className="text-center">
              <button
                onClick={() => router.push('/dashboard/reception/queue')}
                className="bg-primary hover:bg-primary-dark text-white px-6 py-3 rounded-xl font-bold transition-colors"
              >
                عرض الطابور الكامل
              </button>
            </div>
          )}

          {activeTab === 'appointments' && (
            <div className="text-center">
              <button
                onClick={() => router.push('/dashboard/reception/appointments')}
                className="bg-primary hover:bg-primary-dark text-white px-6 py-3 rounded-xl font-bold transition-colors"
              >
                عرض جميع المواعيد
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
>>>>>>> cursor/fix-code-errors-and-warnings-8041
