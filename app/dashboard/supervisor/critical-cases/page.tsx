'use client'

/**
 * Supervisor Critical Cases
 * View and manage critical cases
 */

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { AlertCircle, User, Calendar, FileText, ChevronRight } from 'lucide-react'

interface CriticalCase {
  id: string
  patient_id: string
  patient_name: string
  session_id?: string
  doctor_id: string
  doctor_name?: string
  case_type: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  description: string
  detected_by: string
  status: 'open' | 'in_review' | 'resolved' | 'escalated'
  created_at: string
}

export default function SupervisorCriticalCasesPage() {
  const router = useRouter()
  const [cases, setCases] = useState<CriticalCase[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'open' | 'in_review' | 'resolved'>('all')
  const [severityFilter, setSeverityFilter] = useState<'all' | 'low' | 'medium' | 'high' | 'critical'>('all')

  useEffect(() => {
    loadCases()
  }, [])

  const loadCases = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/supervisor/critical-cases')
      const data = await res.json()
      if (data.success) {
        setCases(data.data || [])
      }
    } catch (error) {
      console.error('Error loading critical cases:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredCases = cases.filter((case_) => {
    if (filter !== 'all' && case_.status !== filter) return false
    if (severityFilter !== 'all' && case_.severity !== severityFilter) return false
    return true
  })

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-100 text-red-700 border-red-200'
      case 'high':
        return 'bg-orange-100 text-orange-700 border-orange-200'
      case 'medium':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200'
      case 'low':
        return 'bg-blue-100 text-blue-700 border-blue-200'
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200'
    }
  }

  const getSeverityLabel = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'حرج'
      case 'high':
        return 'عالي'
      case 'medium':
        return 'متوسط'
      case 'low':
        return 'منخفض'
      default:
        return severity
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
        <h1 className="text-4xl font-extrabold text-gray-900 mb-2">الحالات الحرجة</h1>
        <p className="text-gray-500 text-lg">إدارة ومراقبة الحالات الحرجة</p>
      </div>

      {/* Filters */}
      <div className="flex gap-4 mb-6">
        <div className="flex gap-2">
          <span className="text-sm text-gray-600 self-center">الحالة:</span>
          {(['all', 'open', 'in_review', 'resolved'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                filter === f
                  ? 'bg-primary text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {f === 'all' && 'الكل'}
              {f === 'open' && 'مفتوحة'}
              {f === 'in_review' && 'قيد المراجعة'}
              {f === 'resolved' && 'محلولة'}
            </button>
          ))}
        </div>

        <div className="flex gap-2">
          <span className="text-sm text-gray-600 self-center">الشدة:</span>
          {(['all', 'critical', 'high', 'medium', 'low'] as const).map((s) => (
            <button
              key={s}
              onClick={() => setSeverityFilter(s)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                severityFilter === s
                  ? 'bg-primary text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {s === 'all' && 'الكل'}
              {s === 'critical' && 'حرج'}
              {s === 'high' && 'عالي'}
              {s === 'medium' && 'متوسط'}
              {s === 'low' && 'منخفض'}
            </button>
          ))}
        </div>
      </div>

      {/* Cases List */}
      {filteredCases.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
          <AlertCircle size={48} className="mx-auto text-gray-300 mb-4" />
          <div className="text-gray-500">لا توجد حالات حرجة</div>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredCases.map((case_) => (
            <div
              key={case_.id}
              className={`bg-white rounded-2xl shadow-sm border p-6 ${getSeverityColor(case_.severity)}`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <AlertCircle size={24} />
                    <h3 className="text-xl font-bold text-gray-900">{case_.patient_name}</h3>
                    <span className={`text-xs px-2 py-1 rounded ${getSeverityColor(case_.severity)}`}>
                      {getSeverityLabel(case_.severity)}
                    </span>
                    <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                      {case_.status === 'open' && 'مفتوحة'}
                      {case_.status === 'in_review' && 'قيد المراجعة'}
                      {case_.status === 'resolved' && 'محلولة'}
                      {case_.status === 'escalated' && 'مرفوعة'}
                    </span>
                  </div>
                  <div className="text-sm font-medium text-gray-700 mb-2">{case_.case_type}</div>
                  <div className="text-sm text-gray-600 mb-2">{case_.description}</div>
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    {case_.doctor_name && <span>الطبيب: {case_.doctor_name}</span>}
                    <span>اكتشف بواسطة: {case_.detected_by}</span>
                    <span>{new Date(case_.created_at).toLocaleDateString('ar-SA')}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

