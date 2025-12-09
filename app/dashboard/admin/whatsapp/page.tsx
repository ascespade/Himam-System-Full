'use client'

/**
 * WhatsApp Main Dashboard Page
 * Overview of WhatsApp integration and quick access to all features
 */

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Smartphone, MessageCircle, FileText, User, BarChart, Activity, CheckCircle, XCircle, Clock } from 'lucide-react'

interface WhatsAppStats {
  totalMessages: number
  activeConversations: number
  templatesCount: number
  deliveryRate: number
  responseTime: number
  status: 'connected' | 'disconnected' | 'pending'
}

export default function WhatsAppPage() {
  const router = useRouter()
  const [stats, setStats] = useState<WhatsAppStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadStats()
  }, [])

  const loadStats = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/whatsapp/stats')
      const data = await res.json()
      if (data.success) {
        setStats(data.data)
      }
    } catch (error) {
      console.error('Error loading WhatsApp stats:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="p-8">
        <div className="text-center text-gray-500">جاري تحميل معلومات واتساب...</div>
      </div>
    )
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-extrabold text-gray-900 mb-2">واتساب للأعمال</h1>
        <p className="text-gray-500 text-lg">إدارة تكامل واتساب والرسائل</p>
      </div>

      {/* Connection Status */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
              stats?.status === 'connected' 
                ? 'bg-green-100 text-green-600' 
                : stats?.status === 'disconnected'
                ? 'bg-red-100 text-red-600'
                : 'bg-yellow-100 text-yellow-600'
            }`}>
              <Smartphone size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">حالة الاتصال</h2>
              <p className="text-sm text-gray-500">
                {stats?.status === 'connected' ? 'متصل' : stats?.status === 'disconnected' ? 'غير متصل' : 'قيد الانتظار'}
              </p>
            </div>
          </div>
          {stats?.status === 'connected' ? (
            <CheckCircle size={24} className="text-green-500" />
          ) : stats?.status === 'disconnected' ? (
            <XCircle size={24} className="text-red-500" />
          ) : (
            <Clock size={24} className="text-yellow-500" />
          )}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <div
          onClick={() => router.push('/dashboard/admin/whatsapp/live')}
          className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition cursor-pointer"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-xl bg-blue-100 text-blue-600">
              <MessageCircle size={24} />
            </div>
          </div>
          <div className="text-3xl font-bold text-gray-900 mb-1">{stats?.activeConversations || 0}</div>
          <div className="text-sm text-gray-500">المحادثات النشطة</div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-xl bg-green-100 text-green-600">
              <Activity size={24} />
            </div>
          </div>
          <div className="text-3xl font-bold text-gray-900 mb-1">{stats?.totalMessages || 0}</div>
          <div className="text-sm text-gray-500">إجمالي الرسائل</div>
        </div>

        <div
          onClick={() => router.push('/dashboard/admin/whatsapp/templates')}
          className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition cursor-pointer"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-xl bg-purple-100 text-purple-600">
              <FileText size={24} />
            </div>
          </div>
          <div className="text-3xl font-bold text-gray-900 mb-1">{stats?.templatesCount || 0}</div>
          <div className="text-sm text-gray-500">القوالب</div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-xl bg-orange-100 text-orange-600">
              <BarChart size={24} />
            </div>
          </div>
          <div className="text-3xl font-bold text-gray-900 mb-1">{stats?.deliveryRate || 0}%</div>
          <div className="text-sm text-gray-500">معدل التسليم</div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <button
          onClick={() => router.push('/dashboard/admin/whatsapp/profile')}
          className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition text-right"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="p-3 rounded-xl bg-primary/10 text-primary">
              <User size={24} />
            </div>
            <h3 className="text-lg font-bold text-gray-900">الملف الشخصي</h3>
          </div>
          <p className="text-sm text-gray-500">إدارة ملف واتساب للأعمال</p>
        </button>

        <button
          onClick={() => router.push('/dashboard/admin/whatsapp/templates')}
          className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition text-right"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="p-3 rounded-xl bg-purple-100 text-purple-600">
              <FileText size={24} />
            </div>
            <h3 className="text-lg font-bold text-gray-900">القوالب</h3>
          </div>
          <p className="text-sm text-gray-500">إدارة قوالب الرسائل</p>
        </button>

        <button
          onClick={() => router.push('/dashboard/admin/whatsapp/live')}
          className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition text-right"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="p-3 rounded-xl bg-blue-100 text-blue-600">
              <MessageCircle size={24} />
            </div>
            <h3 className="text-lg font-bold text-gray-900">البث المباشر</h3>
          </div>
          <p className="text-sm text-gray-500">مراقبة المحادثات المباشرة</p>
        </button>

        <button
          onClick={() => router.push('/dashboard/admin/whatsapp/analytics')}
          className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition text-right"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="p-3 rounded-xl bg-green-100 text-green-600">
              <BarChart size={24} />
            </div>
            <h3 className="text-lg font-bold text-gray-900">التحليلات</h3>
          </div>
          <p className="text-sm text-gray-500">إحصائيات واتساب</p>
        </button>
      </div>
    </div>
  )
}
