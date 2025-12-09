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
// import { toast } } from 'sonner' // TODO: Install sonner package
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
