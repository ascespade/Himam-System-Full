'use client'

import { createBrowserClient } from '@supabase/ssr'
import {
  Calendar,
  Clock,
  FileText,
  LogOut,
  Plus,
  Search,
  Video,
  Users,
  Zap,
  Building2,
  Activity,
  AlertCircle,
  CheckCircle,
} from 'lucide-react'
import { useRouter, usePathname } from 'next/navigation'
import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'

interface UserInfo {
  id: string
  name: string
  email: string
  role: string
}

interface ActiveSession {
  id: string
  patient_id: string
  patient_name: string
  started_at: string
  duration_minutes: number
}

interface DoctorStats {
  todayAppointments: number
  pendingAppointments: number
  currentQueue: number
  clinicIsOpen: boolean
  activeSessions: number
}

/**
 * Doctor-specific header component with indicators and shortcuts
 * Displays active session timer, quick actions, and real-time stats
 */
export default function DoctorHeader() {
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null)
  const [stats, setStats] = useState<DoctorStats | null>(null)
  const [activeSession, setActiveSession] = useState<ActiveSession | null>(null)
  const [sessionDuration, setSessionDuration] = useState<number>(0) // in seconds
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const pathname = usePathname()
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  // Fetch doctor stats and active session
  const fetchDoctorData = useCallback(async () => {
    if (!userInfo || userInfo.role !== 'doctor') return

    try {
      // Fetch stats
      const statsRes = await fetch('/api/doctor/dashboard/stats')
      const statsData = await statsRes.json()

      if (statsData.success) {
        setStats({
          todayAppointments: statsData.data.quickStats.todayAppointments || 0,
          pendingAppointments: statsData.data.quickStats.pendingToday || 0,
          currentQueue: statsData.data.clinic.currentQueue || 0,
          clinicIsOpen: statsData.data.clinic.isOpen || false,
          activeSessions: 0, // Will be updated from active session
        })
      }

      // Fetch active session (session in progress)
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: sessionData } = await supabase
          .from('sessions')
          .select(`
            id,
            patient_id,
            date,
            status,
            patients (name)
          `)
          .eq('doctor_id', user.id)
          .eq('status', 'in_progress')
          .order('date', { ascending: false })
          .limit(1)
          .maybeSingle()

        if (sessionData) {
          const sessionStart = new Date(sessionData.date)
          const now = new Date()
          const durationSeconds = Math.floor((now.getTime() - sessionStart.getTime()) / 1000)

          setActiveSession({
            id: sessionData.id,
            patient_id: sessionData.patient_id,
            patient_name: (Array.isArray(sessionData.patients) ? sessionData.patients[0]?.name : sessionData.patients?.name) || 'مريض',
            started_at: sessionData.date,
            duration_minutes: Math.floor(durationSeconds / 60),
          })
          setSessionDuration(durationSeconds)
        } else {
          setActiveSession(null)
          setSessionDuration(0)
        }
      }
    } catch (error) {
      console.error('Error fetching doctor data:', error)
    }
  }, [userInfo, supabase])

  // Update session duration timer every second
  useEffect(() => {
    if (!activeSession) return

    const interval = setInterval(() => {
      setSessionDuration((prev) => prev + 1)
    }, 1000)

    return () => clearInterval(interval)
  }, [activeSession])

  useEffect(() => {
    fetchUserInfo()
  }, [])

  useEffect(() => {
    if (userInfo?.role === 'doctor') {
      fetchDoctorData()
      // Refresh every 30 seconds
      const interval = setInterval(() => {
        fetchDoctorData()
      }, 30000)
      return () => clearInterval(interval)
    }
  }, [userInfo?.role, fetchDoctorData])

  const fetchUserInfo = async () => {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser()

      if (authError || !user) {
        setUserInfo(null)
        setLoading(false)
        return
      }

      const { data: userData } = await supabase
        .from('users')
        .select('id, name, email, role')
        .eq('id', user.id)
        .single()

      if (userData) {
        setUserInfo({
          id: userData.id,
          name: userData.name || user.email?.split('@')[0] || 'طبيب',
          email: userData.email || user.email || '',
          role: userData.role || 'doctor',
        })
      }
    } catch (error) {
      console.error('Error fetching user info:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`
  }

  const getInitial = (name: string): string => {
    if (!name) return 'ط'
    const parts = name.trim().split(' ')
    if (parts.length > 1) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
    }
    return name[0].toUpperCase()
  }

  if (loading) {
    return (
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse" />
        <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
      </div>
    )
  }

  if (!userInfo || userInfo.role !== 'doctor') {
    return null
  }

  return (
    <div className="flex items-center gap-3 flex-1 justify-between">
      {/* Left Side: Indicators & Stats */}
      <div className="flex items-center gap-2 flex-1">
        {/* Active Session Timer */}
        {activeSession && (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-green-50 rounded-lg border border-green-200 animate-pulse">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <Clock size={14} className="text-green-600" />
            <span className="text-xs font-bold text-green-700">
              جلسة نشطة: {activeSession.patient_name}
            </span>
            <span className="text-xs font-mono text-green-600 font-bold">
              {formatTime(sessionDuration)}
            </span>
            <button
              onClick={() => router.push(`/dashboard/doctor/sessions/${activeSession.id}`)}
              className="text-xs text-green-600 hover:text-green-700 underline"
            >
              عرض
            </button>
          </div>
        )}

        {/* Clinic Status Indicator */}
        {stats && (
          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border ${
            stats.clinicIsOpen
              ? 'bg-green-50 border-green-200'
              : 'bg-red-50 border-red-200'
          }`}>
            <div className={`w-2 h-2 rounded-full ${stats.clinicIsOpen ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <Building2 size={14} className={stats.clinicIsOpen ? 'text-green-600' : 'text-red-600'} />
            <span className={`text-xs font-bold ${stats.clinicIsOpen ? 'text-green-700' : 'text-red-700'}`}>
              {stats.clinicIsOpen ? 'مفتوحة' : 'مغلقة'}
            </span>
          </div>
        )}

        {/* Queue Count */}
        {stats && stats.currentQueue > 0 && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-50 rounded-lg border border-orange-200">
            <Users size={14} className="text-orange-600" />
            <span className="text-xs font-bold text-orange-700">{stats.currentQueue}</span>
            <span className="text-xs text-orange-600">في الطابور</span>
          </div>
        )}

        {/* Today's Appointments */}
        {stats && stats.todayAppointments > 0 && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 rounded-lg border border-blue-200">
            <Calendar size={14} className="text-blue-600" />
            <span className="text-xs font-bold text-blue-700">{stats.todayAppointments}</span>
            <span className="text-xs text-blue-600">مواعيد اليوم</span>
          </div>
        )}

        {/* Pending Appointments */}
        {stats && stats.pendingAppointments > 0 && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-yellow-50 rounded-lg border border-yellow-200">
            <AlertCircle size={14} className="text-yellow-600" />
            <span className="text-xs font-bold text-yellow-700">{stats.pendingAppointments}</span>
            <span className="text-xs text-yellow-600">معلقة</span>
          </div>
        )}
      </div>

      {/* Center: Quick Actions */}
      <div className="flex items-center gap-1 px-2 py-1 bg-gray-50 rounded-lg border border-gray-200">
        {/* New Session */}
        <button
          onClick={() => router.push('/dashboard/doctor/sessions/new')}
          className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-bold text-gray-700 hover:bg-primary hover:text-white rounded-md transition-colors"
          title="جلسة جديدة"
        >
          <Plus size={14} />
          <span className="hidden sm:inline">جلسة</span>
        </button>

        {/* Search */}
        <button
          onClick={() => router.push('/dashboard/doctor/search')}
          className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-bold text-gray-700 hover:bg-primary hover:text-white rounded-md transition-colors"
          title="بحث متقدم"
        >
          <Search size={14} />
          <span className="hidden sm:inline">بحث</span>
        </button>

        {/* Video Sessions */}
        {!pathname?.includes('/video-sessions') && (
          <button
            onClick={() => router.push('/dashboard/doctor/video-sessions')}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-bold text-gray-700 hover:bg-primary hover:text-white rounded-md transition-colors"
            title="جلسات مرئية"
          >
            <Video size={14} />
            <span className="hidden sm:inline">مرئي</span>
          </button>
        )}

        {/* Patients List */}
        {!pathname?.includes('/patients') && (
          <button
            onClick={() => router.push('/dashboard/doctor/patients')}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-bold text-gray-700 hover:bg-primary hover:text-white rounded-md transition-colors"
            title="قائمة المرضى"
          >
            <Users size={14} />
            <span className="hidden sm:inline">مرضاي</span>
          </button>
        )}

        {/* Quick Record */}
        <button
          onClick={() => router.push('/dashboard/doctor/medical-records')}
          className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-bold text-gray-700 hover:bg-primary hover:text-white rounded-md transition-colors"
          title="سجل طبي سريع"
        >
          <FileText size={14} />
          <span className="hidden sm:inline">سجل</span>
        </button>
      </div>

      {/* Right Side: User Info & Logout */}
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center text-primary font-bold text-sm">
            {getInitial(userInfo.name)}
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-bold text-gray-900">{userInfo.name}</span>
            <span className="text-xs text-gray-500">طبيب</span>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="flex items-center gap-1.5 text-sm text-red-500 hover:text-red-700 font-medium transition-colors px-2.5 py-1.5 rounded-lg hover:bg-red-50"
          title="تسجيل خروج"
        >
          <LogOut size={16} />
          <span className="hidden md:inline">خروج</span>
        </button>
      </div>
    </div>
  )
}

