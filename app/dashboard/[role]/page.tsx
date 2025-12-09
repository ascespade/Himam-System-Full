'use client'

/**
 * Role-Based Dashboard
 * Dashboard ديناميكي حسب نوع المستخدم
 * يعرض الإحصائيات والرسوم البيانية والمكونات المخصصة
 */

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'
import DashboardWidget from '@/components/DashboardWidget'
import { Activity, TrendingUp, Users, Calendar, DollarSign, AlertCircle } from 'lucide-react'

interface DashboardStats {
  [key: string]: number | string
}

interface DashboardWidget {
  id: string
  widget_type: string
  widget_config: any
  position: number
  is_visible: boolean
}

export default function RoleDashboard() {
  const router = useRouter()
  const [userRole, setUserRole] = useState<string | null>(null)
  const [widgets, setWidgets] = useState<DashboardWidget[]>([])
  const [stats, setStats] = useState<DashboardStats>({})
  const [loading, setLoading] = useState(true)
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  useEffect(() => {
    loadUserRole()
  }, [])

  useEffect(() => {
    if (userRole) {
      loadDashboard()
    }
  }, [userRole])

  const loadUserRole = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }

      const { data: userData } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single()

      if (userData) {
        setUserRole(userData.role)
      }
    } catch (error) {
      console.error('Error loading user role:', error)
      router.push('/login')
    }
  }

  const loadDashboard = async () => {
    try {
      setLoading(true)
      const [widgetsRes, statsRes] = await Promise.all([
        fetch(`/api/dashboard/widgets?role=${userRole}`),
        fetch(`/api/dashboard/stats?role=${userRole}`)
      ])

      const widgetsData = await widgetsRes.json()
      const statsData = await statsRes.json()

      if (widgetsData.success) {
        setWidgets(widgetsData.data || [])
      }

      if (statsData.success) {
        setStats(statsData.data || {})
      }
    } catch (error) {
      console.error('Error loading dashboard:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="p-8">
        <div className="text-center text-gray-500">جاري تحميل لوحة التحكم...</div>
      </div>
    )
  }

  if (!userRole) {
    return null
  }

  // Sort widgets by position
  const sortedWidgets = [...widgets].sort((a, b) => a.position - b.position)

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-extrabold text-gray-900 mb-2">
          {getDashboardTitle(userRole)}
        </h1>
        <p className="text-gray-500 text-lg">نظرة شاملة على عملك وأنشطتك</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {getQuickStats(userRole, stats).map((stat, idx) => (
          <div key={idx} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <div className={`p-3 rounded-xl ${stat.iconBg}`}>
                {stat.icon}
              </div>
              <span className={`text-xs font-bold px-2 py-1 rounded ${stat.trendBg}`}>
                {stat.trend}
              </span>
            </div>
            <div className="text-3xl font-bold text-gray-900 mb-1">{stat.value}</div>
            <div className="text-sm text-gray-500">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Dashboard Widgets */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {sortedWidgets.filter(w => w.is_visible).map((widget) => (
          <DashboardWidget
            key={widget.id}
            widget={widget}
            stats={stats}
          />
        ))}
      </div>

      {/* Real-time Activity Feed */}
      <div className="mt-8 bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Activity size={24} />
          النشاطات الأخيرة
        </h2>
        <ActivityFeed userRole={userRole} />
      </div>
    </div>
  )
}

function getDashboardTitle(role: string): string {
  const titles: Record<string, string> = {
    admin: 'لوحة تحكم المدير',
    doctor: 'لوحة تحكم الطبيب',
    reception: 'لوحة تحكم الاستقبال',
    insurance: 'لوحة تحكم التأمين',
    patient: 'لوحة تحكم المريض',
    staff: 'لوحة تحكم الموظف'
  }
  return titles[role] || 'لوحة التحكم'
}

function getQuickStats(role: string, stats: DashboardStats) {
  const roleStats: Record<string, any[]> = {
    admin: [
      { label: 'إجمالي المرضى', value: stats.total_patients || 0, icon: <Users size={24} />, iconBg: 'bg-blue-100 text-blue-600', trend: '+12%', trendBg: 'bg-green-100 text-green-700' },
      { label: 'المواعيد اليوم', value: stats.today_appointments || 0, icon: <Calendar size={24} />, iconBg: 'bg-green-100 text-green-600', trend: '+5%', trendBg: 'bg-green-100 text-green-700' },
      { label: 'المطالبات المعلقة', value: stats.pending_claims || 0, icon: <AlertCircle size={24} />, iconBg: 'bg-orange-100 text-orange-600', trend: '-3%', trendBg: 'bg-red-100 text-red-700' },
      { label: 'الإيرادات اليوم', value: `₺${stats.revenue_today || 0}`, icon: <DollarSign size={24} />, iconBg: 'bg-purple-100 text-purple-600', trend: '+8%', trendBg: 'bg-green-100 text-green-700' }
    ],
    doctor: [
      { label: 'مرضاي', value: stats.my_patients || 0, icon: <Users size={24} />, iconBg: 'bg-blue-100 text-blue-600', trend: '+2', trendBg: 'bg-green-100 text-green-700' },
      { label: 'جلسات اليوم', value: stats.today_sessions || 0, icon: <Calendar size={24} />, iconBg: 'bg-green-100 text-green-600', trend: '0', trendBg: 'bg-gray-100 text-gray-700' },
      { label: 'خطط معلقة', value: stats.pending_treatment_plans || 0, icon: <TrendingUp size={24} />, iconBg: 'bg-yellow-100 text-yellow-600', trend: '+1', trendBg: 'bg-orange-100 text-orange-700' },
      { label: 'رسائل غير مقروءة', value: stats.unread_messages || 0, icon: <Activity size={24} />, iconBg: 'bg-purple-100 text-purple-600', trend: '+3', trendBg: 'bg-red-100 text-red-700' }
    ],
    reception: [
      { label: 'الطابور اليوم', value: stats.queue_today || 0, icon: <Users size={24} />, iconBg: 'bg-blue-100 text-blue-600', trend: 'جاري', trendBg: 'bg-blue-100 text-blue-700' },
      { label: 'المواعيد اليوم', value: stats.appointments_today || 0, icon: <Calendar size={24} />, iconBg: 'bg-green-100 text-green-600', trend: 'مكتمل', trendBg: 'bg-green-100 text-green-700' },
      { label: 'مرضى جدد', value: stats.new_patients_today || 0, icon: <Users size={24} />, iconBg: 'bg-purple-100 text-purple-600', trend: '+5', trendBg: 'bg-green-100 text-green-700' }
    ],
    insurance: [
      { label: 'مطالبات معلقة', value: stats.pending_claims || 0, icon: <AlertCircle size={24} />, iconBg: 'bg-orange-100 text-orange-600', trend: '+12', trendBg: 'bg-red-100 text-red-700' },
      { label: 'موافق عليها اليوم', value: stats.approved_today || 0, icon: <TrendingUp size={24} />, iconBg: 'bg-green-100 text-green-600', trend: '+8', trendBg: 'bg-green-100 text-green-700' },
      { label: 'مرفوضة اليوم', value: stats.rejected_today || 0, icon: <AlertCircle size={24} />, iconBg: 'bg-red-100 text-red-600', trend: '-2', trendBg: 'bg-green-100 text-green-700' },
      { label: 'المبلغ المعلق', value: `₺${stats.total_amount_pending || 0}`, icon: <DollarSign size={24} />, iconBg: 'bg-purple-100 text-purple-600', trend: '+5%', trendBg: 'bg-orange-100 text-orange-700' }
    ]
  }

  return roleStats[role] || []
}

function ActivityFeed({ userRole }: { userRole: string }) {
  const [activities, setActivities] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadActivities()
    // Refresh every 30 seconds
    const interval = setInterval(loadActivities, 30000)
    return () => clearInterval(interval)
  }, [userRole])

  const loadActivities = async () => {
    try {
      const res = await fetch(`/api/activity-logs?limit=10&role=${userRole}`)
      const data = await res.json()
      if (data.success) {
        setActivities(data.data || [])
      }
    } catch (error) {
      console.error('Error loading activities:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="text-center text-gray-400 py-4">جاري التحميل...</div>
  }

  if (activities.length === 0) {
    return <div className="text-center text-gray-400 py-4">لا توجد نشاطات حديثة</div>
  }

  return (
    <div className="space-y-3">
      {activities.map((activity) => (
        <div key={activity.id} className="flex items-start gap-3 p-3 hover:bg-gray-50 rounded-lg">
          <div className="w-2 h-2 bg-primary rounded-full mt-2 shrink-0" />
          <div className="flex-1">
            <p className="text-sm text-gray-900">{activity.description}</p>
            <p className="text-xs text-gray-400 mt-1">
              {new Date(activity.created_at).toLocaleString('ar-SA')}
            </p>
          </div>
        </div>
      ))}
    </div>
  )
}

