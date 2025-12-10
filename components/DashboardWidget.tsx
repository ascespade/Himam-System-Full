'use client'

/**
 * Dashboard Widget Component
 * مكون ديناميكي لعرض أنواع مختلفة من Widgets
 */

import { useEffect, useState, useCallback } from 'react'
import { BarChart3, LineChart, PieChart, TrendingUp, Table, List } from 'lucide-react'

interface Widget {
  id: string
  widget_type: string
  widget_config: any
  position: number
  is_visible: boolean
}

interface DashboardWidgetProps {
  widget: Widget
  stats: Record<string, any>
}

export default function DashboardWidget({ widget, stats }: DashboardWidgetProps) {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  const loadWidgetData = useCallback(async () => {
    try {
      setLoading(true)
      const res = await fetch(`/api/dashboard/widget-data?widget_id=${widget.id}`)
      const widgetData = await res.json()
      if (widgetData.success) {
        setData(widgetData.data)
      }
    } catch (error) {
      console.error('Error loading widget data:', error)
    } finally {
      setLoading(false)
    }
  }, [widget.id])

  useEffect(() => {
    loadWidgetData()
  }, [loadWidgetData])

  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  const config = widget.widget_config

  switch (widget.widget_type) {
    case 'stats':
      return <StatsWidget config={config} stats={stats} />
    case 'chart':
      return <ChartWidget config={config} data={data} />
    case 'table':
      return <TableWidget config={config} data={data} />
    case 'list':
      return <ListWidget config={config} data={data} />
    default:
      return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <p className="text-gray-400">نوع Widget غير معروف: {widget.widget_type}</p>
        </div>
      )
  }
}

function StatsWidget({ config, stats }: { config: any; stats: Record<string, any> }) {
  const statKeys = config.stats || []
  
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
      <h3 className="text-xl font-bold text-gray-900 mb-4">{config.title || 'الإحصائيات'}</h3>
      <div className="grid grid-cols-2 gap-4">
        {statKeys.map((key: string, idx: number) => (
          <div key={idx} className="p-4 bg-gray-50 rounded-xl">
            <div className="text-2xl font-bold text-gray-900">{stats[key] || 0}</div>
            <div className="text-sm text-gray-500 mt-1">{formatStatLabel(key)}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

function ChartWidget({ config, data }: { config: any; data: any }) {
  const chartType = config.type || 'line'
  
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
      <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
        {chartType === 'line' && <LineChart size={20} />}
        {chartType === 'bar' && <BarChart3 size={20} />}
        {chartType === 'pie' && <PieChart size={20} />}
        {config.title || 'رسم بياني'}
      </h3>
      <div className="h-64 flex items-center justify-center bg-gray-50 rounded-xl">
        {data ? (
          <p className="text-gray-400">سيتم عرض الرسم البياني هنا</p>
        ) : (
          <p className="text-gray-400">لا توجد بيانات</p>
        )}
      </div>
    </div>
  )
}

function TableWidget({ config, data }: { config: any; data: any }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
      <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
        <Table size={20} />
        {config.title || 'جدول'}
      </h3>
      <div className="overflow-x-auto">
        {data && data.length > 0 ? (
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                {Object.keys(data[0]).map((key) => (
                  <th key={key} className="text-right py-2 px-4 text-sm font-bold text-gray-700">
                    {key}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.slice(0, config.limit || 10).map((row: any, idx: number) => (
                <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50">
                  {Object.values(row).map((value: any, cellIdx: number) => (
                    <td key={cellIdx} className="py-2 px-4 text-sm text-gray-600">
                      {String(value)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="text-center text-gray-400 py-8">لا توجد بيانات</p>
        )}
      </div>
    </div>
  )
}

function ListWidget({ config, data }: { config: any; data: any }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
      <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
        <List size={20} />
        {config.title || 'قائمة'}
      </h3>
      <div className="space-y-2">
        {data && data.length > 0 ? (
          data.slice(0, config.limit || 10).map((item: any, idx: number) => (
            <div key={idx} className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
              {item.title || item.name || JSON.stringify(item)}
            </div>
          ))
        ) : (
          <p className="text-center text-gray-400 py-4">لا توجد عناصر</p>
        )}
      </div>
    </div>
  )
}

function formatStatLabel(key: string): string {
  const labels: Record<string, string> = {
    total_patients: 'إجمالي المرضى',
    total_doctors: 'إجمالي الأطباء',
    today_appointments: 'مواعيد اليوم',
    pending_claims: 'مطالبات معلقة',
    revenue_today: 'إيرادات اليوم',
    revenue_month: 'إيرادات الشهر',
    my_patients: 'مرضاي',
    today_sessions: 'جلسات اليوم',
    pending_treatment_plans: 'خطط معلقة',
    unread_messages: 'رسائل غير مقروءة',
    queue_today: 'الطابور اليوم',
    appointments_today: 'المواعيد اليوم',
    new_patients_today: 'مرضى جدد',
    approved_today: 'موافق عليها',
    rejected_today: 'مرفوضة',
    total_amount_pending: 'المبلغ المعلق'
  }
  return labels[key] || key
}

