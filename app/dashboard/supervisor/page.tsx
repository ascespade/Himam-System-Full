'use client'

/**
 * Supervisor Dashboard
 * Dashboard for medical supervisors to monitor quality and review sessions
 */

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Activity, AlertCircle, FileText, TrendingUp, Users, CheckCircle, XCircle } from 'lucide-react'

interface DashboardStats {
  totalSessions: number
  reviewedSessions: number
  pendingReviews: number
  criticalCases: number
  qualityScore: number
  complianceScore: number
}

export default function SupervisorDashboard() {
  const router = useRouter()
  const [stats, setStats] = useState<DashboardStats>({
    totalSessions: 0,
    reviewedSessions: 0,
    pendingReviews: 0,
    criticalCases: 0,
    qualityScore: 0,
    complianceScore: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/supervisor/dashboard')
      const data = await res.json()
      if (data.success && data.data) {
        const dashboardData = data.data
        setStats({
          totalSessions: dashboardData.totalSessions || 0,
          reviewedSessions: dashboardData.reviewedSessions || 0,
          pendingReviews: dashboardData.pendingReviews || 0,
          criticalCases: dashboardData.criticalCases || 0,
          qualityScore: dashboardData.qualityScore || 0,
          complianceScore: dashboardData.complianceScore || 0,
        })
      }
    } catch (error) {
      console.error('Error loading dashboard:', error)
      // Continue to show dashboard with default stats if API fails
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

  const reviewRate = stats.totalSessions > 0 ? (stats.reviewedSessions / stats.totalSessions) * 100 : 0

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-extrabold text-gray-900 mb-2">لوحة تحكم المشرف الطبي</h1>
        <p className="text-gray-500 text-lg">نظرة شاملة على الجودة والمراجعات</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-xl bg-blue-100 text-blue-600">
              <FileText size={24} />
            </div>
          </div>
          <div className="text-3xl font-bold text-gray-900 mb-1">{stats.pendingReviews}</div>
          <div className="text-sm text-gray-500">المراجعات المعلقة</div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-xl bg-red-100 text-red-600">
              <AlertCircle size={24} />
            </div>
          </div>
          <div className="text-3xl font-bold text-gray-900 mb-1">{stats.criticalCases}</div>
          <div className="text-sm text-gray-500">الحالات الحرجة</div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-xl bg-green-100 text-green-600">
              <TrendingUp size={24} />
            </div>
          </div>
          <div className="text-3xl font-bold text-gray-900 mb-1">{stats.qualityScore.toFixed(1)}%</div>
          <div className="text-sm text-gray-500">نقاط الجودة</div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-xl bg-purple-100 text-purple-600">
              <CheckCircle size={24} />
            </div>
          </div>
          <div className="text-3xl font-bold text-gray-900 mb-1">{stats.complianceScore.toFixed(1)}%</div>
          <div className="text-sm text-gray-500">نقاط الامتثال</div>
        </div>
      </div>

      {/* Review Rate */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-8">
        <h2 className="text-xl font-bold text-gray-900 mb-4">معدل المراجعة</h2>
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">الجلسات المراجعة</span>
              <span className="text-sm font-bold text-gray-900">
                {stats.reviewedSessions} / {stats.totalSessions}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className="bg-primary h-3 rounded-full transition-all"
                style={{ width: `${reviewRate}%` }}
              />
            </div>
          </div>
          <div className="text-2xl font-bold text-primary">{reviewRate.toFixed(1)}%</div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <button
          onClick={() => router.push('/dashboard/supervisor/critical-cases')}
          className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 text-right hover:shadow-md transition cursor-pointer"
        >
          <div className="flex items-center justify-between mb-4">
            <AlertCircle size={32} className="text-red-500" />
            <div className="text-2xl font-bold text-gray-900">{stats.criticalCases}</div>
          </div>
          <div className="text-lg font-medium text-gray-700 mb-2">الحالات الحرجة</div>
          <div className="text-sm text-gray-500">عرض وإدارة الحالات الحرجة</div>
        </button>

        <button
          onClick={() => router.push('/dashboard/supervisor/reviews')}
          className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 text-right hover:shadow-md transition cursor-pointer"
        >
          <div className="flex items-center justify-between mb-4">
            <FileText size={32} className="text-blue-500" />
            <div className="text-2xl font-bold text-gray-900">{stats.pendingReviews}</div>
          </div>
          <div className="text-lg font-medium text-gray-700 mb-2">مراجعات الجلسات</div>
          <div className="text-sm text-gray-500">مراجعة جلسات الأطباء</div>
        </button>

        <button
          onClick={() => router.push('/dashboard/supervisor/quality')}
          className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 text-right hover:shadow-md transition cursor-pointer"
        >
          <div className="flex items-center justify-between mb-4">
            <TrendingUp size={32} className="text-green-500" />
            <div className="text-2xl font-bold text-gray-900">{stats.qualityScore.toFixed(0)}%</div>
          </div>
          <div className="text-lg font-medium text-gray-700 mb-2">تحليلات الجودة</div>
          <div className="text-sm text-gray-500">مقاييس الجودة والأداء</div>
        </button>
      </div>
    </div>
  )
}

