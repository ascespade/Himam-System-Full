'use client'

import { Activity, BarChart3, Calendar, DollarSign, TrendingUp, Users } from 'lucide-react'
import { useEffect, useState } from 'react'

interface AnalyticsData {
  performance: {
    totalSessions: number
    completedSessions: number
    cancelledSessions: number
    averageSessionDuration: number
    patientSatisfaction: number
  }
  patients: {
    total: number
    active: number
    new: number
    retentionRate: number
  }
  revenue: {
    total: number
    thisMonth: number
    lastMonth: number
    growth: number
  }
  sessions: {
    weekly: { day: string; count: number }[]
    monthly: { month: string; count: number }[]
  }
}

export default function AnalyticsPage() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'year'>('month')

  useEffect(() => {
    fetchAnalytics()
  }, [timeRange])

  const fetchAnalytics = async () => {
    try {
      const [performanceRes, patientsRes, revenueRes, sessionsRes] = await Promise.all([
        fetch('/api/doctor/analytics/performance'),
        fetch('/api/doctor/analytics/patients'),
        fetch('/api/doctor/analytics/revenue'),
        fetch('/api/doctor/analytics/sessions'),
      ])

      const performance = await performanceRes.json()
      const patients = await patientsRes.json()
      const revenue = await revenueRes.json()
      const sessions = await sessionsRes.json()

      setAnalytics({
        performance: performance.success ? performance.data : {},
        patients: patients.success ? patients.data : {},
        revenue: revenue.success ? revenue.data : {},
        sessions: sessions.success ? sessions.data : {},
      })
    } catch (error) {
      console.error('Error fetching analytics:', error)
    } finally {
      setLoading(false)
    }
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
        <h1 className="text-4xl font-extrabold text-gray-900 mb-2">التقارير والتحليلات</h1>
        <p className="text-gray-500 text-lg">نظرة شاملة على أدائك وإحصائياتك</p>
      </div>

      {/* Time Range Selector */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-2 mb-6 flex gap-2">
        <button
          onClick={() => setTimeRange('week')}
          className={`flex-1 px-4 py-3 rounded-xl font-bold transition-all ${
            timeRange === 'week'
              ? 'bg-primary text-white shadow-md'
              : 'text-gray-500 hover:bg-gray-50'
          }`}
        >
          أسبوع
        </button>
        <button
          onClick={() => setTimeRange('month')}
          className={`flex-1 px-4 py-3 rounded-xl font-bold transition-all ${
            timeRange === 'month'
              ? 'bg-primary text-white shadow-md'
              : 'text-gray-500 hover:bg-gray-50'
          }`}
        >
          شهر
        </button>
        <button
          onClick={() => setTimeRange('year')}
          className={`flex-1 px-4 py-3 rounded-xl font-bold transition-all ${
            timeRange === 'year'
              ? 'bg-primary text-white shadow-md'
              : 'text-gray-500 hover:bg-gray-50'
          }`}
        >
          سنة
        </button>
      </div>

      {/* Performance Cards */}
      {analytics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <Activity className="text-blue-600" size={24} />
              </div>
            </div>
            <div className="text-3xl font-bold text-gray-900 mb-1">
              {analytics.performance.completedSessions || 0}
            </div>
            <div className="text-sm text-gray-500">جلسات مكتملة</div>
            <div className="mt-3 text-xs text-gray-400">
              من أصل {analytics.performance.totalSessions || 0} جلسة
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                <Users className="text-green-600" size={24} />
              </div>
            </div>
            <div className="text-3xl font-bold text-gray-900 mb-1">
              {analytics.patients.active || 0}
            </div>
            <div className="text-sm text-gray-500">مرضى نشطون</div>
            <div className="mt-3 text-xs text-gray-400">
              من أصل {analytics.patients.total || 0} مريض
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                <DollarSign className="text-purple-600" size={24} />
              </div>
            </div>
            <div className="text-3xl font-bold text-gray-900 mb-1">
              {analytics.revenue.thisMonth?.toLocaleString() || 0} ر.س
            </div>
            <div className="text-sm text-gray-500">إيرادات هذا الشهر</div>
            {analytics.revenue.growth && (
              <div className="mt-3 flex items-center gap-1 text-xs text-green-600">
                <TrendingUp size={14} />
                <span>{analytics.revenue.growth}% نمو</span>
              </div>
            )}
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                <BarChart3 className="text-orange-600" size={24} />
              </div>
            </div>
            <div className="text-3xl font-bold text-gray-900 mb-1">
              {analytics.performance.patientSatisfaction || 0}%
            </div>
            <div className="text-sm text-gray-500">رضا المرضى</div>
            <div className="mt-3 text-xs text-gray-400">
              معدل الاستبقاء: {analytics.patients.retentionRate || 0}%
            </div>
          </div>
        </div>
      )}

      {/* Charts Placeholder */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4">الجلسات الأسبوعية</h3>
          <div className="h-64 flex items-center justify-center text-gray-400">
            <BarChart3 size={48} />
            <p className="mr-4">رسم بياني للجلسات</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4">الإيرادات الشهرية</h3>
          <div className="h-64 flex items-center justify-center text-gray-400">
            <TrendingUp size={48} />
            <p className="mr-4">رسم بياني للإيرادات</p>
          </div>
        </div>
      </div>
    </div>
  )
}

