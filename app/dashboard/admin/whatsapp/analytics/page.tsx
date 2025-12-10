'use client'

import { useEffect, useState } from 'react'
import { BarChart3, MessageSquare, Send, CheckCircle, Clock, TrendingUp, Users } from 'lucide-react'
import { format } from 'date-fns'
import { ar } from 'date-fns/locale'

interface AnalyticsData {
  total_messages: number
  inbound_messages: number
  outbound_messages: number
  delivered_messages: number
  read_messages: number
  failed_messages: number
  unique_conversations: number
  new_conversations: number
  avg_response_time_seconds: number
}

export default function WhatsAppAnalyticsPage() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [dateFrom, setDateFrom] = useState(new Date(new Date().setDate(1)).toISOString().split('T')[0])
  const [dateTo, setDateTo] = useState(new Date().toISOString().split('T')[0])

  useEffect(() => {
    fetchAnalytics()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateFrom, dateTo])

  const fetchAnalytics = async () => {
    setIsLoading(true)
    try {
      const res = await fetch(`/api/whatsapp/analytics?date_from=${dateFrom}&date_to=${dateTo}`)
      const data = await res.json()
      if (data.success) {
        setAnalytics(data.data)
      } else {
        console.error('Failed to fetch analytics:', data.error)
      }
    } catch (error) {
      console.error('Error fetching analytics:', error)
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!analytics) {
    return (
      <div className="p-8 text-center">
        <p className="text-gray-500">لا توجد بيانات تحليلية</p>
      </div>
    )
  }

  const deliveryRate = analytics.total_messages > 0
    ? ((analytics.delivered_messages / analytics.total_messages) * 100).toFixed(1)
    : 0

  const readRate = analytics.total_messages > 0
    ? ((analytics.read_messages / analytics.total_messages) * 100).toFixed(1)
    : 0

  const responseTimeMinutes = Math.floor(analytics.avg_response_time_seconds / 60)
  const responseTimeSeconds = Math.round(analytics.avg_response_time_seconds % 60)

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">تحليلات الواتساب</h1>
          <p className="text-gray-500 mt-1">إحصائيات ورسوم بيانية للرسائل</p>
        </div>
        <div className="flex gap-4">
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
          />
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
          />
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <MessageSquare size={24} className="text-primary" />
            <span className="text-2xl font-bold text-gray-900">{analytics.total_messages}</span>
          </div>
          <h3 className="text-sm font-bold text-gray-700">إجمالي الرسائل</h3>
          <div className="mt-2 text-xs text-gray-500">
            واردة: {analytics.inbound_messages} | صادرة: {analytics.outbound_messages}
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <CheckCircle size={24} className="text-green-500" />
            <span className="text-2xl font-bold text-gray-900">{deliveryRate}%</span>
          </div>
          <h3 className="text-sm font-bold text-gray-700">معدل التوصيل</h3>
          <div className="mt-2 text-xs text-gray-500">
            {analytics.delivered_messages} من {analytics.total_messages}
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <Users size={24} className="text-blue-500" />
            <span className="text-2xl font-bold text-gray-900">{analytics.unique_conversations}</span>
          </div>
          <h3 className="text-sm font-bold text-gray-700">المحادثات الفريدة</h3>
          <div className="mt-2 text-xs text-gray-500">
            جديدة: {analytics.new_conversations}
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <Clock size={24} className="text-orange-500" />
            <span className="text-2xl font-bold text-gray-900">
              {responseTimeMinutes > 0 ? `${responseTimeMinutes}د ` : ''}{responseTimeSeconds}ث
            </span>
          </div>
          <h3 className="text-sm font-bold text-gray-700">متوسط وقت الاستجابة</h3>
          <div className="mt-2 text-xs text-gray-500">
            {readRate}% معدل القراءة
          </div>
        </div>
      </div>

      {/* Detailed Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <BarChart3 size={24} className="text-primary" />
            حالة الرسائل
          </h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-gray-600">مرسلة</span>
              <span className="font-bold text-gray-900">{analytics.outbound_messages}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">مستلمة</span>
              <span className="font-bold text-gray-900">{analytics.inbound_messages}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-green-600">مُسلمة</span>
              <span className="font-bold text-green-700">{analytics.delivered_messages}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-blue-600">مقروءة</span>
              <span className="font-bold text-blue-700">{analytics.read_messages}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-red-600">فاشلة</span>
              <span className="font-bold text-red-700">{analytics.failed_messages}</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <TrendingUp size={24} className="text-primary" />
            معدلات الأداء
          </h2>
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-600">معدل التوصيل</span>
                <span className="font-bold text-gray-900">{deliveryRate}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-green-500 h-2 rounded-full"
                  style={{ width: `${deliveryRate}%` }}
                ></div>
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-600">معدل القراءة</span>
                <span className="font-bold text-gray-900">{readRate}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-500 h-2 rounded-full"
                  style={{ width: `${readRate}%` }}
                ></div>
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-600">متوسط وقت الاستجابة</span>
                <span className="font-bold text-gray-900">
                  {responseTimeMinutes > 0 ? `${responseTimeMinutes}د ` : ''}{responseTimeSeconds}ث
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

