'use client'

/**
 * Reception Reports Page
 * Generate and view reports
 */

import { useEffect, useState, useCallback } from 'react'
import { FileText, Calendar, Download, BarChart, TrendingUp, Users, DollarSign, Filter } from 'lucide-react'
import { toast } from 'sonner'

interface ReportData {
  period: string
  totalAppointments: number
  totalPatients: number
  totalRevenue: number
  completedAppointments: number
  cancelledAppointments: number
  newPatients: number
}

export default function ReceptionReportsPage() {
  const [reportData, setReportData] = useState<ReportData | null>(null)
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState<'today' | 'week' | 'month' | 'year'>('today')

  const loadReportData = useCallback(async () => {
    try {
      setLoading(true)
      const res = await fetch(`/api/reception/reports?period=${period}`)
      const data = await res.json()
      if (data.success) {
        setReportData(data.data)
      }
    } catch (error) {
      const { logError } = await import('@/shared/utils/logger')
      logError('Error loading report data', error, { period, endpoint: '/dashboard/reception/reports' })
    } finally {
      setLoading(false)
    }
  }, [period])

  useEffect(() => {
    loadReportData()
  }, [loadReportData])

  const handleExport = async (format: 'pdf' | 'excel') => {
    try {
      const { exportToPDF, exportToExcel, downloadFile } = await import('@/shared/utils/export')
      
      // Prepare data for export
      const columns = [
        { key: 'period', label: 'الفترة' },
        { key: 'totalAppointments', label: 'إجمالي المواعيد' },
        { key: 'totalPatients', label: 'إجمالي المرضى' },
        { key: 'totalRevenue', label: 'إجمالي الإيرادات' },
      ]
      
      // Convert reportData to array format
      const exportData: Record<string, unknown>[] = reportData ? [{
        period: reportData.period,
        totalAppointments: reportData.totalAppointments,
        totalPatients: reportData.totalPatients,
        totalRevenue: reportData.totalRevenue,
      }] : []
      
      let blob: Blob
      let filename: string
      
      if (format === 'pdf') {
        blob = await exportToPDF(exportData, columns, 'تقرير الاستقبال')
        filename = `reception-report-${new Date().toISOString().split('T')[0]}.pdf`
      } else {
        blob = await exportToExcel(exportData, columns, 'تقرير الاستقبال')
        filename = `reception-report-${new Date().toISOString().split('T')[0]}.xlsx`
      }
      
      downloadFile(blob, filename)
      toast.success(`تم تصدير التقرير بنجاح كـ ${format === 'pdf' ? 'PDF' : 'Excel'}`)
    } catch (error) {
      const { logError } = await import('@/shared/utils/logger')
      logError('Failed to export report', error, { format, endpoint: '/dashboard/reception/reports' })
      toast.error('فشل تصدير التقرير')
    }
  }

  if (loading) {
    return (
      <div className="p-8">
        <div className="text-center text-gray-500">جاري تحميل التقرير...</div>
      </div>
    )
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-extrabold text-gray-900 mb-2">التقارير</h1>
            <p className="text-gray-500 text-lg">عرض وتصدير التقارير الإحصائية</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => handleExport('pdf')}
              className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              <Download size={18} />
              تصدير PDF
            </button>
            <button
              onClick={() => handleExport('excel')}
              className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              <Download size={18} />
              تصدير Excel
            </button>
          </div>
        </div>
      </div>

      {/* Period Filter */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
        <div className="flex items-center gap-4">
          <Filter size={20} className="text-gray-400" />
          <span className="text-sm font-medium text-gray-700">الفترة:</span>
          <div className="flex gap-2">
            {(['today', 'week', 'month', 'year'] as const).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  period === p
                    ? 'bg-primary text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {p === 'today' && 'اليوم'}
                {p === 'week' && 'هذا الأسبوع'}
                {p === 'month' && 'هذا الشهر'}
                {p === 'year' && 'هذه السنة'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      {reportData && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-xl bg-blue-100 text-blue-600">
                <Calendar size={24} />
              </div>
            </div>
            <div className="text-3xl font-bold text-gray-900 mb-1">{reportData.totalAppointments}</div>
            <div className="text-sm text-gray-500">إجمالي المواعيد</div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-xl bg-green-100 text-green-600">
                <Users size={24} />
              </div>
            </div>
            <div className="text-3xl font-bold text-gray-900 mb-1">{reportData.totalPatients}</div>
            <div className="text-sm text-gray-500">إجمالي المرضى</div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-xl bg-purple-100 text-purple-600">
                <DollarSign size={24} />
              </div>
            </div>
            <div className="text-3xl font-bold text-gray-900 mb-1">{reportData.totalRevenue.toFixed(2)} ر.س</div>
            <div className="text-sm text-gray-500">إجمالي الإيرادات</div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-xl bg-orange-100 text-orange-600">
                <TrendingUp size={24} />
              </div>
            </div>
            <div className="text-3xl font-bold text-gray-900 mb-1">{reportData.newPatients}</div>
            <div className="text-sm text-gray-500">مرضى جدد</div>
          </div>
        </div>
      )}

      {/* Detailed Stats */}
      {reportData && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <BarChart size={24} />
              إحصائيات المواعيد
            </h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                <span className="text-gray-700">مكتملة</span>
                <span className="text-2xl font-bold text-green-600">{reportData.completedAppointments}</span>
              </div>
              <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg">
                <span className="text-gray-700">ملغاة</span>
                <span className="text-2xl font-bold text-red-600">{reportData.cancelledAppointments}</span>
              </div>
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <span className="text-gray-700">معدل الإتمام</span>
                <span className="text-2xl font-bold text-gray-900">
                  {reportData.totalAppointments > 0
                    ? ((reportData.completedAppointments / reportData.totalAppointments) * 100).toFixed(1)
                    : 0}%
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <FileText size={24} />
              ملخص الفترة
            </h2>
            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">الفترة المحددة:</span>
                <span className="font-medium text-gray-900">
                  {period === 'today' && 'اليوم'}
                  {period === 'week' && 'هذا الأسبوع'}
                  {period === 'month' && 'هذا الشهر'}
                  {period === 'year' && 'هذه السنة'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">متوسط الإيرادات اليومية:</span>
                <span className="font-medium text-gray-900">
                  {period === 'today'
                    ? reportData.totalRevenue.toFixed(2)
                    : (reportData.totalRevenue / (period === 'week' ? 7 : period === 'month' ? 30 : 365)).toFixed(2)}{' '}
                  ر.س
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">متوسط المواعيد اليومية:</span>
                <span className="font-medium text-gray-900">
                  {period === 'today'
                    ? reportData.totalAppointments
                    : Math.round(reportData.totalAppointments / (period === 'week' ? 7 : period === 'month' ? 30 : 365))}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
