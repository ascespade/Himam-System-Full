'use client'

import { createBrowserClient } from '@supabase/ssr'
import { Bell, Calendar, DollarSign, LogOut, Users } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useState } from 'react'

interface UserInfo {
  id: string
  name: string
  email: string
  role: string
}

interface DashboardStats {
  appointments: {
    pending: number
    today: number
  }
  notifications: {
    unread: number
  }
  patients: {
    total: number
  }
  doctors: {
    total: number
  }
  invoices: {
    pending: number
  }
  revenue: {
    today: number
  }
}

export default function UserHeader() {
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null)
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadingStats, setLoadingStats] = useState(false)
  const router = useRouter()
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const fetchStats = useCallback(async () => {
    if (!userInfo || userInfo.role !== 'admin') return
    
    try {
      setLoadingStats(true)
      const res = await fetch('/api/dashboard/stats')
      const data = await res.json()
      if (data.success) {
        setStats(data.data)
      }
    } catch (error) {
      console.error('Error fetching stats:', error)
    } finally {
      setLoadingStats(false)
    }
  }, [userInfo])

  useEffect(() => {
    fetchUserInfo()
  }, [])

  useEffect(() => {
    if (userInfo?.role === 'admin') {
      fetchStats()
      // Refresh stats every 30 seconds
      const interval = setInterval(() => {
        fetchStats()
      }, 30000)
      return () => clearInterval(interval)
    }
  }, [userInfo?.role, fetchStats])

  const fetchUserInfo = async () => {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      
      if (authError || !user) {
        setUserInfo(null)
        setLoading(false)
        return
      }

      // Fetch user info from users table
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id, name, email, role')
        .eq('id', user.id)
        .single()

      if (userError) {
        console.error('Error fetching user info:', userError)
        // Fallback to auth user data
        setUserInfo({
          id: user.id,
          name: user.user_metadata?.name || user.email?.split('@')[0] || 'User',
          email: user.email || '',
          role: 'admin'
        })
      } else {
        setUserInfo({
          id: userData.id,
          name: userData.name || user.email?.split('@')[0] || 'User',
          email: userData.email || user.email || '',
          role: userData.role || 'admin'
        })
      }
    } catch (error) {
      console.error('Error fetching user info:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut()
      // Clear any local storage
      if (typeof window !== 'undefined') {
        localStorage.clear()
        sessionStorage.clear()
      }
      // Redirect to login
      router.push('/login')
      router.refresh()
    } catch (error) {
      console.error('Error during logout:', error)
      // Force redirect even if signOut fails
      router.push('/login')
      router.refresh()
    }
  }

  // Get user's initial for avatar
  const getInitial = (name: string): string => {
    if (!name) return 'U'
    const parts = name.trim().split(' ')
    if (parts.length > 1) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
    }
    return name[0].toUpperCase()
  }

  // Role labels in Arabic
  const roleLabels: Record<string, string> = {
    admin: 'مدير',
    doctor: 'طبيب',
    staff: 'موظف',
    patient: 'مريض',
    reception: 'استقبال',
    insurance: 'تأمين'
  }

  if (loading) {
    return (
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse" />
        <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
      </div>
    )
  }

  if (!userInfo) {
    return null
  }

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('ar-SA', {
      style: 'currency',
      currency: 'SAR',
      minimumFractionDigits: 0
    }).format(amount)
  }

  return (
    <div className="flex items-center gap-4">
      {/* Admin Stats Indicators */}
      {userInfo.role === 'admin' && stats && (
        <div className="flex items-center gap-3 mr-4 pr-4 border-r border-gray-200">
          {/* Pending Appointments */}
          {stats.appointments?.pending > 0 && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-50 rounded-lg border border-orange-200">
              <Calendar size={16} className="text-orange-600" />
              <span className="text-xs font-bold text-orange-700">{stats.appointments.pending}</span>
              <span className="text-xs text-orange-600">مواعيد معلقة</span>
            </div>
          )}

          {/* Today's Appointments */}
          {stats.appointments?.today > 0 && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 rounded-lg border border-blue-200">
              <Calendar size={16} className="text-blue-600" />
              <span className="text-xs font-bold text-blue-700">{stats.appointments.today}</span>
              <span className="text-xs text-blue-600">مواعيد اليوم</span>
            </div>
          )}

          {/* Unread Notifications */}
          {stats.notifications?.unread > 0 && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 rounded-lg border border-red-200 relative">
              <Bell size={16} className="text-red-600" />
              <span className="text-xs font-bold text-red-700">{stats.notifications.unread}</span>
              <span className="text-xs text-red-600">إشعارات</span>
            </div>
          )}

          {/* Pending Invoices */}
          {stats.invoices?.pending > 0 && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-yellow-50 rounded-lg border border-yellow-200">
              <DollarSign size={16} className="text-yellow-600" />
              <span className="text-xs font-bold text-yellow-700">{stats.invoices.pending}</span>
              <span className="text-xs text-yellow-600">فواتير معلقة</span>
            </div>
          )}

          {/* Today's Revenue */}
          {stats.revenue?.today > 0 && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-green-50 rounded-lg border border-green-200">
              <DollarSign size={16} className="text-green-600" />
              <span className="text-xs font-bold text-green-700">{formatCurrency(stats.revenue.today)}</span>
              <span className="text-xs text-green-600">إيرادات اليوم</span>
            </div>
          )}

          {/* Quick Stats Summary (Compact) */}
          {stats.patients && stats.doctors && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 rounded-lg border border-gray-200">
              <Users size={14} className="text-gray-500" />
              <span className="text-xs text-gray-600">
                {stats.patients.total || 0} مريض • {stats.doctors.total || 0} طبيب
              </span>
            </div>
          )}
        </div>
      )}

      {/* User Info */}
      <div className="flex items-center gap-2">
        <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center text-primary font-bold text-sm">
          {getInitial(userInfo.name)}
        </div>
        <div className="flex flex-col">
          <span className="text-sm font-bold text-gray-900">{userInfo.name}</span>
          <span className="text-xs text-gray-500">{roleLabels[userInfo.role] || userInfo.role}</span>
        </div>
      </div>

      {/* Logout Button */}
      <button
        onClick={handleLogout}
        className="flex items-center gap-2 text-sm text-red-500 hover:text-red-700 font-medium transition-colors px-3 py-1.5 rounded-lg hover:bg-red-50"
      >
        <LogOut size={16} />
        <span>تسجيل خروج</span>
      </button>
    </div>
  )
}

