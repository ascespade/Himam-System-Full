'use client'

/**
 * Supervisor Quality Analytics
 * Quality metrics and performance analytics
 */

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { TrendingUp, Users, CheckCircle, AlertCircle, BarChart } from 'lucide-react'

interface QualityMetric {
  doctor_id: string
  doctor_name: string
  total_sessions: number
  reviewed_sessions: number
  quality_score: number
  compliance_score: number
  critical_cases_count: number
  corrections_required: number
}

export default function SupervisorQualityPage() {
  const router = useRouter()
  const [metrics, setMetrics] = useState<QualityMetric[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadQualityMetrics()
  }, [])

  const loadQualityMetrics = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/supervisor/quality')
      const data = await res.json()
      if (data.success) {
        setMetrics(data.data || [])
      }
    } catch (error) {
      console.error('Error loading quality metrics:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="p-8">
        <div className="text-center text-gray-500">جاري التحميل...</div>
      </div>
    )
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={() => router.push('/dashboard/supervisor')}
          className="text-sm text-primary hover:underline mb-4 flex items-center gap-1"
        >
          ← العودة للوحة التحكم
        </button>
        <h1 className="text-4xl font-extrabold text-gray-900 mb-2">تحليلات الجودة</h1>
        <p className="text-gray-500 text-lg">مقاييس الجودة والأداء للأطباء</p>
      </div>

      {/* Quality Metrics Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">الطبيب</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">إجمالي الجلسات</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">الجلسات المراجعة</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">نقاط الجودة</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">نقاط الامتثال</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">الحالات الحرجة</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">التصحيحات المطلوبة</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {metrics.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-4 text-center text-gray-500">
                    لا توجد بيانات
                  </td>
                </tr>
              ) : (
                metrics.map((metric) => (
                  <tr key={metric.doctor_id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {metric.doctor_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{metric.total_sessions}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{metric.reviewed_sessions}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span
                        className={`font-bold ${
                          metric.quality_score >= 80
                            ? 'text-green-600'
                            : metric.quality_score >= 60
                            ? 'text-yellow-600'
                            : 'text-red-600'
                        }`}
                      >
                        {metric.quality_score.toFixed(1)}%
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span
                        className={`font-bold ${
                          metric.compliance_score >= 80
                            ? 'text-green-600'
                            : metric.compliance_score >= 60
                            ? 'text-yellow-600'
                            : 'text-red-600'
                        }`}
                      >
                        {metric.compliance_score.toFixed(1)}%
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {metric.critical_cases_count > 0 ? (
                        <span className="text-red-600 font-bold">{metric.critical_cases_count}</span>
                      ) : (
                        <span className="text-gray-400">0</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {metric.corrections_required > 0 ? (
                        <span className="text-orange-600 font-bold">{metric.corrections_required}</span>
                      ) : (
                        <span className="text-gray-400">0</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

