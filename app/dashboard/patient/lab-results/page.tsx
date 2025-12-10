'use client'

/**
 * Patient Lab Results Page
 * View laboratory test results
 */

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'
import { FlaskConical, Calendar, User, Download, Search, Filter, AlertCircle, CheckCircle } from 'lucide-react'

interface LabResult {
  id: string
  test_name: string
  test_type: string
  date: string
  doctor_name?: string
  status: 'pending' | 'completed' | 'abnormal'
  results?: Array<{
    parameter: string
    value: string
    unit?: string
    normal_range?: string
    status?: 'normal' | 'abnormal' | 'critical'
  }>
  notes?: string
  attachment_url?: string
}

export default function PatientLabResultsPage() {
  const router = useRouter()
  const [labResults, setLabResults] = useState<LabResult[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'completed' | 'abnormal'>('all')

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const loadLabResults = useCallback(async () => {
    try {
      setLoading(true)

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }

      const patientRes = await fetch(`/api/patients?user_id=${user.id}`)
      const patientData = await patientRes.json()
      if (patientData.success && patientData.data?.length > 0) {
        const patientInfo = patientData.data[0]

        const labRes = await fetch(`/api/patients/${patientInfo.id}/lab-results`)
        const labData = await labRes.json()
        if (labData.success) {
          setLabResults(labData.data || [])
        }
      }
    } catch (error) {
      console.error('Error loading lab results:', error)
    } finally {
      setLoading(false)
    }
  }, [supabase, router])

  useEffect(() => {
    loadLabResults()
  }, [loadLabResults])

  const filteredResults = labResults.filter((result) => {
    const matchesSearch =
      !searchTerm ||
      result.test_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      result.test_type?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      result.doctor_name?.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStatus = filterStatus === 'all' || result.status === filterStatus

    return matchesSearch && matchesStatus
  })

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle size={18} className="text-green-500" />
      case 'abnormal':
        return <AlertCircle size={18} className="text-red-500" />
      case 'pending':
        return <AlertCircle size={18} className="text-yellow-500" />
      default:
        return <AlertCircle size={18} className="text-gray-400" />
    }
  }

  if (loading) {
    return (
      <div className="p-8">
        <div className="text-center text-gray-500">جاري تحميل نتائج التحاليل...</div>
      </div>
    )
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-extrabold text-gray-900 mb-2">نتائج التحاليل</h1>
        <p className="text-gray-500 text-lg">عرض جميع نتائج التحاليل المخبرية</p>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search size={20} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="ابحث في التحاليل..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pr-10 pl-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>

          <div className="flex gap-2">
            {(['all', 'pending', 'completed', 'abnormal'] as const).map((status) => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filterStatus === status
                    ? 'bg-primary text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {status === 'all' && 'الكل'}
                {status === 'pending' && 'قيد الانتظار'}
                {status === 'completed' && 'مكتملة'}
                {status === 'abnormal' && 'غير طبيعية'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Lab Results List */}
      {filteredResults.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
          <FlaskConical size={48} className="mx-auto text-gray-400 mb-4" />
          <div className="text-gray-500 text-lg mb-2">لا توجد نتائج تحاليل</div>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredResults.map((result) => (
            <div
              key={result.id}
              className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    {getStatusIcon(result.status)}
                    <h3 className="text-xl font-bold text-gray-900">{result.test_name}</h3>
                    <span className="px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                      {result.test_type}
                    </span>
                  </div>

                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    {result.doctor_name && (
                      <div className="flex items-center gap-2">
                        <User size={16} className="text-gray-400" />
                        <span>الطبيب: {result.doctor_name}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <Calendar size={16} className="text-gray-400" />
                      <span>{new Date(result.date).toLocaleDateString('ar-SA')}</span>
                    </div>
                  </div>
                </div>

                {result.attachment_url && (
                  <a
                    href={result.attachment_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm text-gray-700 transition-colors"
                  >
                    <Download size={16} />
                    تحميل
                  </a>
                )}
              </div>

              {/* Results */}
              {result.results && result.results.length > 0 && (
                <div className="bg-gray-50 rounded-lg p-4 mb-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-3">النتائج:</h4>
                  <div className="space-y-2">
                    {result.results.map((res, index) => (
                      <div
                        key={index}
                        className={`flex items-center justify-between p-3 rounded-lg ${
                          res.status === 'abnormal' || res.status === 'critical'
                            ? 'bg-red-50 border border-red-200'
                            : 'bg-white'
                        }`}
                      >
                        <div className="flex-1">
                          <div className="font-medium text-gray-900">{res.parameter}</div>
                          <div className="text-sm text-gray-600">
                            {res.value} {res.unit && res.unit}
                          </div>
                          {res.normal_range && (
                            <div className="text-xs text-gray-500">المدى الطبيعي: {res.normal_range}</div>
                          )}
                        </div>
                        {res.status && (
                          <span
                            className={`px-2 py-1 rounded text-xs font-medium ${
                              res.status === 'normal'
                                ? 'bg-green-100 text-green-700'
                                : res.status === 'critical'
                                ? 'bg-red-100 text-red-700'
                                : 'bg-yellow-100 text-yellow-700'
                            }`}
                          >
                            {res.status === 'normal' ? 'طبيعي' : res.status === 'critical' ? 'حرج' : 'غير طبيعي'}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {result.notes && (
                <div className="bg-blue-50 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-1">ملاحظات:</h4>
                  <p className="text-sm text-gray-600">{result.notes}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
