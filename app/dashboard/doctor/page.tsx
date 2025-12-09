'use client'

import {
  Activity,
  Calendar,
  Clock,
  Droplet,
  Eye,
  FileText,
  MessageSquare,
  Search,
  TrendingUp,
  Users,
  Video,
  AlertCircle,
  CheckCircle,
  XCircle,
  Building2,
  DollarSign,
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect, useState, useCallback } from 'react'
// import { toast } from 'sonner' // TODO: Install sonner package
const toast = {
}
import { createBrowserClient } from '@supabase/ssr'

interface DashboardStats {
  quickStats: {
    todayAppointments: number
    confirmedToday: number
    pendingToday: number
    totalPatients: number
    activePatients: number
    totalSessions: number
    weekSessions: number
    monthSessions: number
    totalPlans: number
    activePlans: number
    queueCount: number
  }
  clinic: {
    isOpen: boolean
    dailyCapacity: number
    currentQueue: number
    availableSlots: number
  }
}

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
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [todayAppointments, setTodayAppointments] = useState<TodayAppointment[]>([])
  const [loading, setLoading] = useState(true)
  const [isUpdating, setIsUpdating] = useState(false) // Light indicator for real-time updates
  const [searchTerm, setSearchTerm] = useState('')
  const [activeTab, setActiveTab] = useState<'overview' | 'appointments' | 'queue'>('overview')

  // Create Supabase client for realtime
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  // Fetch dashboard data function
  const fetchDashboardData = useCallback(async (silent: boolean = false) => {
    try {
      const [statsRes, appointmentsRes] = await Promise.all([
        fetch('/api/doctor/dashboard/stats'),
        fetch('/api/doctor/appointments'),
      ])

      const statsJson = await statsRes.json()
      const appointmentsJson = await appointmentsRes.json()

      if (statsJson.success) {
        setStats(prevStats => {
          // Only update if data changed (smooth transition)
          if (JSON.stringify(prevStats) !== JSON.stringify(statsJson.data)) {
            return statsJson.data
          }
          return prevStats
        })
      }

      if (appointmentsJson.success) {
        const appointmentsRaw = appointmentsJson.data || []
        const transformed: TodayAppointment[] = appointmentsRaw.map((apt: any) => ({
          id: apt.id,
          patient_id: apt.patient_id,
          patient_name: apt.patients?.name || apt.patient_name || 'غير معروف',
          patient_phone: apt.patients?.phone || apt.patient_phone || '',
          date: apt.date,
          status: apt.status || 'pending',
          notes: apt.notes,
        }))
        
        setTodayAppointments(prevApts => {
          // Only update if data changed
          if (JSON.stringify(prevApts) !== JSON.stringify(transformed)) {
            return transformed
          }
          return prevApts
        })
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
      // Don't show toast on every error (too noisy)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    // Initial fetch
    fetchDashboardData()
    
    // Set up realtime subscriptions
    let appointmentsSubscription: any = null
    let queueSubscription: any = null
    let clinicSettingsSubscription: any = null

    const setupRealtime = async () => {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Subscribe to appointments changes (for today's appointments)
      appointmentsSubscription = supabase
        .channel('doctor-appointments')
        .on(
          'postgres_changes',
          {
            event: '*', // INSERT, UPDATE, DELETE
            schema: 'public',
            table: 'appointments',
            filter: `doctor_id=eq.${user.id}`,
          },
          (payload) => {
            // Real-time update when appointment changes (silent update, no full refresh)
            fetchDashboardData(true) // silent = true (no loading spinner)
          }
        )
        .subscribe()

      // Subscribe to reception queue changes
      queueSubscription = supabase
        .channel('doctor-queue')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'reception_queue',
          },
          (payload) => {
            // Real-time update when queue changes (silent update, no full refresh)
            fetchDashboardData(true) // silent = true
          }
        )
        .subscribe()

      // Subscribe to clinic settings changes
      clinicSettingsSubscription = supabase
        .channel('doctor-clinic-settings')
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'clinic_settings',
            filter: `doctor_id=eq.${user.id}`,
          },
          (payload) => {
            // Real-time update when clinic status changes (silent update, no full refresh)
            fetchDashboardData(true) // silent = true
          }
        )
        .subscribe()
    }

    setupRealtime()

    // Cleanup subscriptions on unmount
    return () => {
      if (appointmentsSubscription) {
        supabase.removeChannel(appointmentsSubscription)
      }
      if (queueSubscription) {
        supabase.removeChannel(queueSubscription)
      }
      if (clinicSettingsSubscription) {
        supabase.removeChannel(clinicSettingsSubscription)
      }
    }
  }, [fetchDashboardData, supabase])


  const handleToggleClinic = async () => {
    if (!stats) return
    try {
      const endpoint = stats.clinic.isOpen ? '/api/doctor/clinic/close' : '/api/doctor/clinic/open'
      const res = await fetch(endpoint, { method: 'POST' })
      const json = await res.json()
      if (json.success) {
        toast.success(json.message)
        // Realtime subscription will auto-update the UI
        fetchDashboardData()
      }
    } catch (error) {
      toast.error('حدث خطأ')
    }
  }

  const viewPatientFile = (patientId: string) => {
    router.push(`/dashboard/doctor/patients/${patientId}`)
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
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-extrabold text-gray-900 mb-2">لوحة التحكم</h1>
          <p className="text-gray-500 text-lg">نظرة شاملة على عملك اليوم</p>
        </div>
        {/* Real-time indicator */}
        {isUpdating && (
          <div className="flex items-center gap-2 text-sm text-primary">
            <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
            <span className="text-gray-500">جاري التحديث...</span>
          </div>
        )}
      </div>

      {/* Clinic Status Card */}
      {stats && (
        <div className="bg-gradient-to-r from-primary to-primary-dark rounded-2xl shadow-lg p-6 mb-6 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={`w-16 h-16 rounded-full flex items-center justify-center ${stats.clinic.isOpen ? 'bg-white/20' : 'bg-white/10'}`}>
                <Building2 size={32} />
              </div>
              <div>
                <h3 className="font-bold text-2xl mb-1">
                  {stats.clinic.isOpen ? 'العيادة مفتوحة' : 'العيادة مغلقة'}
                </h3>
                <p className="text-white/80">
                  {stats.clinic.currentQueue} مريض في الانتظار • {stats.clinic.availableSlots} موعد متاح
                </p>
              </div>
            </div>
            <button
              onClick={handleToggleClinic}
              className={`px-8 py-4 rounded-xl font-bold text-lg transition-colors flex items-center gap-2 ${
                stats.clinic.isOpen
                  ? 'bg-red-600 hover:bg-red-700 text-white'
                  : 'bg-green-600 hover:bg-green-700 text-white'
              }`}
            >
              {stats.clinic.isOpen ? (
                <>
                  <XCircle size={20} />
                  إغلاق العيادة
                </>
              ) : (
                <>
                  <CheckCircle size={20} />
                  فتح العيادة
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Quick Stats */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <Calendar className="text-blue-600" size={24} />
              </div>
              <span className="text-xs font-bold text-gray-500">اليوم</span>
            </div>
            <div className="text-3xl font-bold text-gray-900 mb-1">{stats.quickStats.todayAppointments}</div>
            <div className="text-sm text-gray-500">مواعيد اليوم</div>
            <div className="mt-3 flex items-center gap-2 text-xs">
              <CheckCircle className="text-green-500" size={14} />
              <span className="text-gray-600">{stats.quickStats.confirmedToday} مؤكد</span>
              <XCircle className="text-yellow-500 mr-2" size={14} />
              <span className="text-gray-600">{stats.quickStats.pendingToday} معلق</span>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                <Users className="text-green-600" size={24} />
              </div>
              <span className="text-xs font-bold text-gray-500">إجمالي</span>
            </div>
            <div className="text-3xl font-bold text-gray-900 mb-1">{stats.quickStats.totalPatients}</div>
            <div className="text-sm text-gray-500">مرضاي</div>
            <div className="mt-3 text-xs text-green-600 font-bold">
              {stats.quickStats.activePatients} نشط
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                <Activity className="text-purple-600" size={24} />
              </div>
              <span className="text-xs font-bold text-gray-500">هذا الأسبوع</span>
            </div>
            <div className="text-3xl font-bold text-gray-900 mb-1">{stats.quickStats.weekSessions}</div>
            <div className="text-sm text-gray-500">جلسات مكتملة</div>
            <div className="mt-3 flex items-center gap-1 text-xs text-purple-600">
              <TrendingUp size={14} />
              <span>{stats.quickStats.monthSessions} هذا الشهر</span>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                <AlertCircle className="text-orange-600" size={24} />
              </div>
              <span className="text-xs font-bold text-gray-500">في الانتظار</span>
            </div>
            <div className="text-3xl font-bold text-gray-900 mb-1">{stats.quickStats.queueCount}</div>
            <div className="text-sm text-gray-500">مريض في الطابور</div>
            <button
              onClick={() => router.push('/dashboard/doctor/queue')}
              className="mt-3 text-xs text-primary font-bold hover:underline"
            >
              عرض الطابور →
            </button>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-2 mb-6 flex gap-2">
        <button
          onClick={() => setActiveTab('overview')}
          className={`flex-1 px-4 py-3 rounded-xl font-bold transition-all ${
            activeTab === 'overview'
              ? 'bg-primary text-white shadow-md'
              : 'text-gray-500 hover:bg-gray-50'
          }`}
        >
          <Activity size={20} className="inline ml-2" />
          النظرة العامة
        </button>
        <button
          onClick={() => setActiveTab('appointments')}
          className={`flex-1 px-4 py-3 rounded-xl font-bold transition-all ${
            activeTab === 'appointments'
              ? 'bg-primary text-white shadow-md'
              : 'text-gray-500 hover:bg-gray-50'
          }`}
        >
          <Calendar size={20} className="inline ml-2" />
          مواعيد اليوم ({todayAppointments.length})
        </button>
        <button
          onClick={() => setActiveTab('queue')}
          className={`flex-1 px-4 py-3 rounded-xl font-bold transition-all ${
            activeTab === 'queue'
              ? 'bg-primary text-white shadow-md'
              : 'text-gray-500 hover:bg-gray-50'
          }`}
        >
          <Users size={20} className="inline ml-2" />
          الطابور ({stats?.quickStats.queueCount || 0})
        </button>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Treatment Plans */}
          {stats && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">خطط العلاج</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                  <div>
                    <div className="font-bold text-gray-900">الخطط النشطة</div>
                    <div className="text-sm text-gray-500">خطط قيد التنفيذ</div>
                  </div>
                  <div className="text-3xl font-bold text-primary">{stats.quickStats.activePlans}</div>
                </div>
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                  <div>
                    <div className="font-bold text-gray-900">إجمالي الخطط</div>
                    <div className="text-sm text-gray-500">جميع الخطط</div>
                  </div>
                  <div className="text-3xl font-bold text-gray-600">{stats.quickStats.totalPlans}</div>
                </div>
              </div>
              <button
                onClick={() => router.push('/dashboard/doctor/treatment-plans')}
                className="mt-4 w-full px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-xl font-bold transition-colors"
              >
                عرض جميع الخطط
              </button>
            </div>
          )}

          {/* Quick Actions */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">إجراءات سريعة</h3>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => router.push('/dashboard/doctor/sessions/new')}
                className="p-4 bg-primary/10 hover:bg-primary/20 rounded-xl transition-colors text-right"
              >
                <FileText className="text-primary mb-2" size={24} />
                <div className="font-bold text-gray-900 text-sm">جلسة جديدة</div>
              </button>
              <button
                onClick={() => router.push('/dashboard/doctor/patients')}
                className="p-4 bg-blue-100 hover:bg-blue-200 rounded-xl transition-colors text-right"
              >
                <Users className="text-blue-600 mb-2" size={24} />
                <div className="font-bold text-gray-900 text-sm">مرضاي</div>
              </button>
              <button
                onClick={() => router.push('/dashboard/doctor/schedule')}
                className="p-4 bg-green-100 hover:bg-green-200 rounded-xl transition-colors text-right"
              >
                <Calendar className="text-green-600 mb-2" size={24} />
                <div className="font-bold text-gray-900 text-sm">الجدول</div>
              </button>
              <button
                onClick={() => router.push('/dashboard/doctor/video-sessions')}
                className="p-4 bg-purple-100 hover:bg-purple-200 rounded-xl transition-colors text-right"
              >
                <Video className="text-purple-600 mb-2" size={24} />
                <div className="font-bold text-gray-900 text-sm">جلسات مرئية</div>
              </button>
            </div>
          </div>
        </div>
      )}

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
              <div key={apt.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-all">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-bold text-gray-900">{apt.patient_name}</h3>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-bold ${
                          apt.status === 'confirmed'
                            ? 'bg-green-100 text-green-700'
                            : apt.status === 'cancelled'
                            ? 'bg-red-100 text-red-700'
                            : 'bg-yellow-100 text-yellow-700'
                        }`}
                      >
                        {apt.status === 'confirmed' ? 'مؤكد' : apt.status === 'cancelled' ? 'ملغي' : 'معلق'}
                      </span>
                    </div>
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
                    {apt.notes && <p className="text-gray-600 mb-4">{apt.notes}</p>}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => viewPatientFile(apt.patient_id)}
                      className="px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-lg font-bold text-sm transition-colors"
                    >
                      <Eye size={16} className="inline ml-1" />
                      ملف المريض
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Queue Tab */}
      {activeTab === 'queue' && (
        <div>
          <button
            onClick={() => router.push('/dashboard/doctor/queue')}
            className="mb-4 px-6 py-3 bg-primary hover:bg-primary-dark text-white rounded-xl font-bold transition-colors"
          >
            عرض الطابور الكامل →
          </button>
          {stats && stats.quickStats.queueCount === 0 ? (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
              <Users className="mx-auto text-gray-300 mb-4" size={48} />
              <p className="text-gray-500">لا يوجد مرضى في الانتظار</p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <p className="text-gray-600">
                يوجد {stats?.quickStats.queueCount || 0} مريض في الانتظار. اضغط على الزر أعلاه لعرض التفاصيل.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
