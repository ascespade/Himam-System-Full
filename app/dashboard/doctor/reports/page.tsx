'use client'

import { FileSearch, Download, Calendar, Filter, BarChart, TrendingUp } from 'lucide-react'
import { useEffect, useState } from 'react'
// import { toast } from 'sonner' // TODO: Install sonner package
const toast = {
  success: (message: string) => console.log('Success:', message),
  error: (message: string) => console.error('Error:', message),
  info: (message: string) => console.info('Info:', message),
}

interface Report {
  id: string
  name: string
  type: string
  date_range: string
  generated_at: string
  status: string
  download_url?: string
}

export default function ReportsPage() {
  const [reports, setReports] = useState<Report[]>([])
  const [loading, setLoading] = useState(true)
  const [dateFilter, setDateFilter] = useState<string>('all')

  useEffect(() => {
    fetchReports()
  }, [])

  const fetchReports = async () => {
    try {
      setLoading(true)
      // For now, reports are generated on-demand
      // We'll use analytics data to show available report types
      setReports([])
    } catch (error) {
      console.error('Error fetching reports:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleGenerateReport = async (reportType: string) => {
    try {
      // Generate report using analytics API
      const response = await fetch(`/api/doctor/analytics/${reportType}`)
      const data = await response.json()
      
      if (data.success) {
        // Create report object
        const newReport: Report = {
          id: Date.now().toString(),
          name: `تقرير ${reportType === 'performance' ? 'الأداء' : reportType === 'patients' ? 'المرضى' : reportType === 'sessions' ? 'الجلسات' : 'الإيرادات'}`,
          type: reportType,
          date_range: 'آخر 30 يوم',
          generated_at: new Date().toISOString(),
          status: 'completed',
          download_url: `#report-${reportType}`,
        }
        
        setReports([newReport, ...reports])
        toast.success('تم إنشاء التقرير بنجاح')
      }
    } catch (error) {
      console.error('Error generating report:', error)
      toast.error('فشل إنشاء التقرير')
    }
  }

  const reportTypes = [
    { id: 'patients', name: 'تقرير المرضى', icon: BarChart },
    { id: 'appointments', name: 'تقرير المواعيد', icon: Calendar },
    { id: 'sessions', name: 'تقرير الجلسات', icon: TrendingUp },
    { id: 'performance', name: 'تقرير الأداء', icon: BarChart },
  ]

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">التقارير</h1>
        <p className="text-sm text-gray-500 mt-1">إنشاء وعرض التقارير الطبية والإحصائية</p>
      </div>

      {/* Report Types */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {reportTypes.map((type) => {
          const Icon = type.icon
          return (
            <div
              key={type.id}
              className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow cursor-pointer"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                  <Icon className="text-primary" size={20} />
                </div>
                <h3 className="font-medium text-gray-900">{type.name}</h3>
              </div>
              <button 
                onClick={() => handleGenerateReport(type.id)}
                className="w-full mt-3 text-sm text-primary hover:text-primary-dark"
              >
                إنشاء تقرير
              </button>
            </div>
          )
        })}
      </div>

      {/* Filter */}
      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
        <div className="flex items-center gap-4">
          <Filter className="text-gray-400" size={20} />
          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="all">جميع التقارير</option>
            <option value="today">اليوم</option>
            <option value="week">هذا الأسبوع</option>
            <option value="month">هذا الشهر</option>
            <option value="year">هذه السنة</option>
          </select>
        </div>
      </div>

      {/* Reports List */}
      {loading ? (
        <div className="bg-white rounded-xl p-12 shadow-sm border border-gray-100 text-center">
          <div className="text-gray-400">جاري التحميل...</div>
        </div>
      ) : reports.length === 0 ? (
        <div className="bg-white rounded-xl p-12 shadow-sm border border-gray-100 text-center">
          <FileSearch className="mx-auto text-gray-300 mb-4" size={48} />
          <p className="text-gray-500">لا توجد تقارير</p>
          <p className="text-sm text-gray-400 mt-2">ابدأ بإنشاء تقرير جديد</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">اسم التقرير</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">النوع</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">الفترة</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">تاريخ الإنشاء</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">الحالة</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {reports.map((report) => (
                  <tr key={report.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{report.name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {report.type}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {report.date_range}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(report.generated_at).toLocaleDateString('ar-SA')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        report.status === 'completed' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {report.status === 'completed' ? 'مكتمل' : 'قيد المعالجة'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {report.download_url && (
                        <button className="flex items-center gap-1 text-primary hover:text-primary-dark">
                          <Download size={16} />
                          تحميل
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

