'use client'

/**
 * Admin Monitor Dashboard
 * لوحة تحكم شاملة للمدير - مراقبة كل شيء في النظام
 */

import { useEffect, useState } from 'react'
import { Activity, AlertTriangle, CheckCircle, Clock, Database, Server, TrendingUp, Users, Zap } from 'lucide-react'

interface SystemHealth {
  id?: string
  component: string
  status: string
  metrics: any
  last_check_at: string
}

interface AlertInstance {
  id: string
  message: string
  severity: string
  status: string
  created_at: string
}

interface ActivityLog {
  id: string
  action_type: string
  description: string
  user_role: string
  created_at: string
}

export default function AdminMonitorPage() {
  const [health, setHealth] = useState<SystemHealth[]>([])
  const [alerts, setAlerts] = useState<AlertInstance[]>([])
  const [activities, setActivities] = useState<ActivityLog[]>([])
  const [stats, setStats] = useState<any>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadMonitorData()
    const interval = setInterval(loadMonitorData, 30000) // Refresh every 30 seconds
    return () => clearInterval(interval)
  }, [])

  const loadMonitorData = async () => {
    try {
      setLoading(true)
      const [healthRes, alertsRes, activitiesRes, statsRes] = await Promise.all([
        fetch('/api/system/health'),
        fetch('/api/alerts?status=active&limit=10'),
        fetch('/api/activity-logs?limit=20'),
        fetch('/api/dashboard/stats?role=admin')
      ])

      const healthData = await healthRes.json()
      const alertsData = await alertsRes.json()
      const activitiesData = await activitiesRes.json()
      const statsData = await statsRes.json()

      if (healthData.success) setHealth(healthData.data || [])
      if (alertsData.success) setAlerts(alertsData.data || [])
      if (activitiesData.success) setActivities(activitiesData.data || [])
      if (statsData.success) setStats(statsData.data || {})
    } catch (error) {
      console.error('Error loading monitor data:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'bg-green-100 text-green-700'
      case 'degraded': return 'bg-yellow-100 text-yellow-700'
      case 'down': return 'bg-red-100 text-red-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 text-red-700 border-red-300'
      case 'error': return 'bg-orange-100 text-orange-700 border-orange-300'
      case 'warning': return 'bg-yellow-100 text-yellow-700 border-yellow-300'
      default: return 'bg-blue-100 text-blue-700 border-blue-300'
    }
  }

  if (loading) {
    return (
      <div className="p-8">
        <div className="text-center text-gray-500">جاري تحميل بيانات المراقبة...</div>
      </div>
    )
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-extrabold text-gray-900 mb-2">مراقبة النظام</h1>
        <p className="text-gray-500 text-lg">نظرة شاملة على صحة النظام والأنشطة</p>
      </div>

      {/* System Health */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {health.map((component, idx) => (
          <div key={component.id || `health-${idx}`} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                {component.component === 'database' && <Database size={24} className="text-blue-600" />}
                {component.component === 'api' && <Server size={24} className="text-green-600" />}
                {component.component === 'whatsapp' && <Zap size={24} className="text-yellow-600" />}
                {component.component === 'ai' && <TrendingUp size={24} className="text-purple-600" />}
                <span className="font-bold text-gray-900">{component.component}</span>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-bold ${getStatusColor(component.status)}`}>
                {component.status === 'healthy' ? 'سليم' : component.status === 'degraded' ? 'متدني' : 'معطل'}
              </span>
            </div>
            <div className="text-xs text-gray-500">
              آخر فحص: {new Date(component.last_check_at).toLocaleTimeString('ar-SA')}
            </div>
          </div>
        ))}
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center gap-3 mb-2">
            <Users size={24} className="text-blue-600" />
            <span className="text-sm text-gray-500">المستخدمون النشطون</span>
          </div>
          <div className="text-3xl font-bold text-gray-900">{stats.active_users || 0}</div>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center gap-3 mb-2">
            <Activity size={24} className="text-green-600" />
            <span className="text-sm text-gray-500">الأنشطة اليوم</span>
          </div>
          <div className="text-3xl font-bold text-gray-900">{activities.length}</div>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center gap-3 mb-2">
            <AlertTriangle size={24} className="text-red-600" />
            <span className="text-sm text-gray-500">التنبيهات النشطة</span>
          </div>
          <div className="text-3xl font-bold text-gray-900">{alerts.length}</div>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center gap-3 mb-2">
            <CheckCircle size={24} className="text-purple-600" />
            <span className="text-sm text-gray-500">مكونات سليمة</span>
          </div>
          <div className="text-3xl font-bold text-gray-900">
            {health.filter(h => h.status === 'healthy').length}/{health.length}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Active Alerts */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <AlertTriangle size={24} className="text-red-600" />
            التنبيهات النشطة
          </h2>
          <div className="space-y-3">
            {alerts.length === 0 ? (
              <div className="text-center text-gray-400 py-8">
                <CheckCircle size={48} className="mx-auto mb-2 opacity-50" />
                <p>لا توجد تنبيهات نشطة</p>
              </div>
            ) : (
              alerts.map((alert) => (
                <div
                  key={alert.id}
                  className={`p-4 rounded-xl border-2 ${getSeverityColor(alert.severity)}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="font-bold mb-1">{alert.message}</p>
                      <p className="text-xs opacity-70">
                        {new Date(alert.created_at).toLocaleString('ar-SA')}
                      </p>
                    </div>
                    <span className="text-xs font-bold px-2 py-1 rounded">
                      {alert.severity === 'critical' ? 'حرج' :
                       alert.severity === 'error' ? 'خطأ' :
                       alert.severity === 'warning' ? 'تحذير' : 'معلومات'}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Activities */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Activity size={24} className="text-blue-600" />
            الأنشطة الأخيرة
          </h2>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {activities.length === 0 ? (
              <div className="text-center text-gray-400 py-8">
                <Clock size={48} className="mx-auto mb-2 opacity-50" />
                <p>لا توجد أنشطة حديثة</p>
              </div>
            ) : (
              activities.map((activity) => (
                <div key={activity.id} className="flex items-start gap-3 p-3 hover:bg-gray-50 rounded-lg">
                  <div className="w-2 h-2 bg-primary rounded-full mt-2 shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm text-gray-900">{activity.description}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-gray-400">{activity.user_role}</span>
                      <span className="text-xs text-gray-400">•</span>
                      <span className="text-xs text-gray-400">
                        {new Date(activity.created_at).toLocaleTimeString('ar-SA')}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

