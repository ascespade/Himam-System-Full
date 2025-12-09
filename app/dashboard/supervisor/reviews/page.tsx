'use client'

/**
 * Supervisor Reviews Page
 * Review sessions for quality and compliance
 */

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { FileText, User, Calendar, CheckCircle, XCircle, Clock } from 'lucide-react'

interface Review {
  id: string
  session_id: string
  patient_id: string
  patient_name: string
  doctor_id: string
  doctor_name: string
  review_type: string
  status: string
  findings?: string
  recommendations?: string
  priority: string
  created_at: string
}

export default function SupervisorReviewsPage() {
  const router = useRouter()
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'needs_correction'>('all')

  useEffect(() => {
    loadReviews()
  }, [])

  const loadReviews = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/supervisor/reviews')
      const data = await res.json()
      if (data.success) {
        setReviews(data.data || [])
      }
    } catch (error) {
      console.error('Error loading reviews:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredReviews = reviews.filter((review) => {
    if (filter === 'all') return true
    return review.status === filter
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-700'
      case 'needs_correction':
        return 'bg-orange-100 text-orange-700'
      case 'rejected':
        return 'bg-red-100 text-red-700'
      case 'pending':
        return 'bg-yellow-100 text-yellow-700'
      default:
        return 'bg-gray-100 text-gray-700'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'approved':
        return 'موافق عليها'
      case 'needs_correction':
        return 'يحتاج تصحيح'
      case 'rejected':
        return 'مرفوضة'
      case 'pending':
        return 'معلقة'
      default:
        return status
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
        <h1 className="text-4xl font-extrabold text-gray-900 mb-2">مراجعات الجلسات</h1>
        <p className="text-gray-500 text-lg">مراجعة جلسات الأطباء للجودة والامتثال</p>
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-6">
        {(['all', 'pending', 'approved', 'needs_correction'] as const).map((f) => (
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
            {f === 'pending' && 'معلقة'}
            {f === 'approved' && 'موافق عليها'}
            {f === 'needs_correction' && 'يحتاج تصحيح'}
          </button>
        ))}
      </div>

      {/* Reviews List */}
      {filteredReviews.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
          <FileText size={48} className="mx-auto text-gray-300 mb-4" />
          <div className="text-gray-500">لا توجد مراجعات</div>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredReviews.map((review) => (
            <div
              key={review.id}
              className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-xl font-bold text-gray-900">{review.patient_name}</h3>
                    <span className={`text-xs px-2 py-1 rounded ${getStatusColor(review.status)}`}>
                      {getStatusLabel(review.status)}
                    </span>
                    <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                      {review.review_type}
                    </span>
                  </div>
                  <div className="text-sm text-gray-600 mb-2">الطبيب: {review.doctor_name}</div>
                  {review.findings && (
                    <div className="text-sm text-gray-700 mb-2">
                      <strong>النتائج:</strong> {review.findings}
                    </div>
                  )}
                  {review.recommendations && (
                    <div className="text-sm text-gray-700 mb-2">
                      <strong>التوصيات:</strong> {review.recommendations}
                    </div>
                  )}
                  <div className="text-xs text-gray-400 mt-2">
                    {new Date(review.created_at).toLocaleDateString('ar-SA')}
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

