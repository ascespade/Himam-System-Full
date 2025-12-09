'use client'

import { Calendar, DollarSign, TrendingUp, Users } from 'lucide-react'
import { useEffect, useState } from 'react'

export default function ReportsPage() {
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/reports/stats')
      const data = await res.json()
      if (data.success) {
        setStats(data.data)
      }
    } catch (error) {
      console.error('Error fetching stats:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="p-8 text-center">جاري تحميل التقارير...</div>
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-4xl font-extrabold text-gray-900 mb-2">التقارير والإحصائيات</h1>
        <p className="text-gray-500 text-lg">نظرة شاملة على أداء المركز الطبي</p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center text-green-600">
              <DollarSign size={24} />
            </div>
            <div>
              <div className="text-sm text-gray-500">الإيرادات المحصلة</div>
              <div className="text-2xl font-bold text-gray-900">{stats?.financials.totalRevenue.toLocaleString()} ر.س</div>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center text-yellow-600">
              <TrendingUp size={24} />
            </div>
            <div>
              <div className="text-sm text-gray-500">مبالغ معلقة</div>
              <div className="text-2xl font-bold text-gray-900">{stats?.financials.pendingRevenue.toLocaleString()} ر.س</div>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600">
              <Users size={24} />
            </div>
            <div>
              <div className="text-sm text-gray-500">إجمالي المرضى</div>
              <div className="text-2xl font-bold text-gray-900">{stats?.patients.total}</div>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center text-purple-600">
              <Calendar size={24} />
            </div>
            <div>
              <div className="text-sm text-gray-500">إجمالي المواعيد</div>
              <div className="text-2xl font-bold text-gray-900">{stats?.appointments.total}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Detailed Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h3 className="text-xl font-bold text-gray-900 mb-4">ملخص الأداء المالي</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center p-4 bg-gray-50 rounded-xl">
              <span className="text-gray-600">عدد الفواتير</span>
              <span className="font-bold text-gray-900">{stats?.financials.invoiceCount}</span>
            </div>
            <div className="flex justify-between items-center p-4 bg-gray-50 rounded-xl">
              <span className="text-gray-600">متوسط قيمة الفاتورة</span>
              <span className="font-bold text-gray-900">
                {stats?.financials.invoiceCount ? Math.round((stats.financials.totalRevenue + stats.financials.pendingRevenue) / stats.financials.invoiceCount).toLocaleString() : 0} ر.س
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h3 className="text-xl font-bold text-gray-900 mb-4">ملخص العمليات</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center p-4 bg-gray-50 rounded-xl">
              <span className="text-gray-600">عدد الأطباء</span>
              <span className="font-bold text-gray-900">{stats?.doctorsCount}</span>
            </div>
            <div className="flex justify-between items-center p-4 bg-gray-50 rounded-xl">
              <span className="text-gray-600">مواعيد اليوم</span>
              <span className="font-bold text-gray-900">{stats?.appointments.today}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
