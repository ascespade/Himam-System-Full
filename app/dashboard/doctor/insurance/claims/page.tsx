'use client'

import { Shield, Plus, Search, Filter, CheckCircle, XCircle, Clock, AlertCircle, Download, Edit, Send, Eye } from 'lucide-react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'
// import { toast } from 'sonner' // TODO: Install sonner package
const toast = {
  success: (message: string) => console.log('Success:', message),
  error: (message: string) => console.error('Error:', message),
  info: (message: string) => console.info('Info:', message),
}

interface InsuranceClaim {
  id: string
  claim_number: string
  patient_id: string
  patient_name: string
  claim_type: string
  service_date: string
  service_description?: string
  amount: number
  covered_amount?: number
  patient_responsibility?: number
  status: string
  insurance_provider?: string
  submitted_date?: string
  processed_date?: string
  rejection_reason?: string
  created_at: string
}

export default function InsuranceClaimsPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [claims, setClaims] = useState<InsuranceClaim[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [showNewClaimModal, setShowNewClaimModal] = useState(false)
  const [selectedClaim, setSelectedClaim] = useState<InsuranceClaim | null>(null)
  const [showResponseModal, setShowResponseModal] = useState(false)

  const patientId = searchParams.get('patient_id')

  useEffect(() => {
    fetchClaims()
  }, [statusFilter, patientId])

  const fetchClaims = async () => {
    try {
      let url = '/api/insurance/claims'
      const params = new URLSearchParams()
      if (statusFilter !== 'all') params.append('status', statusFilter)
      if (patientId) params.append('patient_id', patientId)
      if (params.toString()) url += '?' + params.toString()

      const res = await fetch(url)
      const data = await res.json()
      if (data.success) {
        let filteredClaims = data.data || []
        if (patientId) {
          filteredClaims = filteredClaims.filter((c: InsuranceClaim) => c.patient_id === patientId)
        }
        setClaims(filteredClaims)
      }
    } catch (error) {
      console.error('Error fetching claims:', error)
      toast.error('حدث خطأ في تحميل المطالبات')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmitClaim = async (claimId: string) => {
    try {
      const res = await fetch(`/api/insurance/claims/${claimId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'submitted',
          submitted_date: new Date().toISOString()
        })
      })

      if (res.ok) {
        toast.success('تم إرسال المطالبة بنجاح')
        fetchClaims()
      } else {
        throw new Error('فشل إرسال المطالبة')
      }
    } catch (error: any) {
      toast.error(error.message || 'حدث خطأ في إرسال المطالبة')
    }
  }

  const handleRespondToRejection = async (claimId: string, response: string, resubmit: boolean) => {
    try {
      const res = await fetch(`/api/insurance/claims/${claimId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: resubmit ? 'submitted' : 'appealed',
          resubmission_notes: response,
          submitted_date: resubmit ? new Date().toISOString() : undefined
        })
      })

      if (res.ok) {
        toast.success(resubmit ? 'تم إعادة إرسال المطالبة' : 'تم إرسال الاستئناف')
        setShowResponseModal(false)
        setSelectedClaim(null)
        fetchClaims()
      } else {
        throw new Error('فشل إرسال الرد')
      }
    } catch (error: any) {
      toast.error(error.message || 'حدث خطأ')
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
      case 'paid':
        return <CheckCircle className="text-green-600" size={20} />
      case 'rejected':
        return <XCircle className="text-red-600" size={20} />
      case 'submitted':
      case 'under_review':
        return <Clock className="text-yellow-600" size={20} />
      default:
        return <AlertCircle className="text-gray-400" size={20} />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
      case 'paid':
        return 'bg-green-100 text-green-800'
      case 'rejected':
        return 'bg-red-100 text-red-800'
      case 'submitted':
      case 'under_review':
        return 'bg-yellow-100 text-yellow-800'
      case 'pending':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-blue-100 text-blue-800'
    }
  }

  const getStatusText = (status: string) => {
    const statusMap: Record<string, string> = {
      pending: 'قيد الانتظار',
      submitted: 'مرسلة',
      under_review: 'قيد المراجعة',
      approved: 'موافق عليها',
      rejected: 'مرفوضة',
      paid: 'مدفوعة',
      appealed: 'استئناف'
    }
    return statusMap[status] || status
  }

  const filteredClaims = claims.filter(claim =>
    claim.claim_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    claim.patient_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    claim.insurance_provider?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">مطالبات التأمين</h1>
          <p className="text-sm text-gray-500 mt-1">إدارة جميع مطالبات التأمين</p>
        </div>
        <button
          onClick={() => router.push(`/dashboard/doctor/insurance/claims/new${patientId ? `?patient_id=${patientId}` : ''}`)}
          className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary-dark transition-colors"
        >
          <Plus size={18} />
          مطالبة جديدة
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="relative">
            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="ابحث عن مطالبة..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pr-10 pl-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <div className="relative">
            <Filter className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full pr-10 pl-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary appearance-none"
            >
              <option value="all">جميع الحالات</option>
              <option value="pending">قيد الانتظار</option>
              <option value="submitted">مرسلة</option>
              <option value="under_review">قيد المراجعة</option>
              <option value="approved">موافق عليها</option>
              <option value="rejected">مرفوضة</option>
              <option value="paid">مدفوعة</option>
            </select>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">إجمالي المطالبات</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{claims.length}</p>
            </div>
            <Shield className="text-primary" size={32} />
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">موافق عليها</p>
              <p className="text-2xl font-bold text-green-600 mt-1">
                {claims.filter(c => c.status === 'approved' || c.status === 'paid').length}
              </p>
            </div>
            <CheckCircle className="text-green-600" size={32} />
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">قيد المراجعة</p>
              <p className="text-2xl font-bold text-yellow-600 mt-1">
                {claims.filter(c => c.status === 'submitted' || c.status === 'under_review').length}
              </p>
            </div>
            <Clock className="text-yellow-600" size={32} />
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">مرفوضة</p>
              <p className="text-2xl font-bold text-red-600 mt-1">
                {claims.filter(c => c.status === 'rejected').length}
              </p>
            </div>
            <XCircle className="text-red-600" size={32} />
          </div>
        </div>
      </div>

      {/* Claims List */}
      {loading ? (
        <div className="bg-white rounded-xl p-12 shadow-sm border border-gray-100 text-center">
          <div className="text-gray-400">جاري التحميل...</div>
        </div>
      ) : filteredClaims.length === 0 ? (
        <div className="bg-white rounded-xl p-12 shadow-sm border border-gray-100 text-center">
          <Shield className="mx-auto text-gray-300 mb-4" size={48} />
          <p className="text-gray-500">لا توجد مطالبات</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">رقم المطالبة</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">المريض</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">النوع</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">المبلغ</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">الحالة</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">التاريخ</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredClaims.map((claim) => (
                  <tr key={claim.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{claim.claim_number}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{claim.patient_name}</div>
                      {claim.insurance_provider && (
                        <div className="text-xs text-gray-500">{claim.insurance_provider}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {claim.claim_type === 'medical' ? 'طبي' :
                       claim.claim_type === 'pharmacy' ? 'صيدلية' :
                       claim.claim_type === 'lab' ? 'مختبر' :
                       claim.claim_type === 'imaging' ? 'تصوير' :
                       claim.claim_type === 'surgery' ? 'جراحة' : claim.claim_type}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{claim.amount.toFixed(2)} ر.س</div>
                      {claim.covered_amount && (
                        <div className="text-xs text-gray-500">
                          المغطى: {claim.covered_amount.toFixed(2)} ر.س
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(claim.status)}
                        <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(claim.status)}`}>
                          {getStatusText(claim.status)}
                        </span>
                      </div>
                      {claim.status === 'rejected' && claim.rejection_reason && (
                        <div className="text-xs text-red-600 mt-1">{claim.rejection_reason}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(claim.service_date).toLocaleDateString('ar-SA')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex items-center gap-2">
                        {claim.status === 'pending' && (
                          <button
                            onClick={() => handleSubmitClaim(claim.id)}
                            className="text-primary hover:text-primary-dark flex items-center gap-1"
                            title="إرسال المطالبة"
                          >
                            <Send size={16} />
                          </button>
                        )}
                        {claim.status === 'rejected' && (
                          <button
                            onClick={() => {
                              setSelectedClaim(claim)
                              setShowResponseModal(true)
                            }}
                            className="text-blue-600 hover:text-blue-800 flex items-center gap-1"
                            title="الرد على الرفض"
                          >
                            <Edit size={16} />
                          </button>
                        )}
                        <button
                          onClick={() => router.push(`/dashboard/doctor/insurance/claims/${claim.id}`)}
                          className="text-gray-600 hover:text-gray-900"
                          title="عرض التفاصيل"
                        >
                          <Eye size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Response Modal */}
      {showResponseModal && selectedClaim && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-2xl w-full">
            <h3 className="text-xl font-bold text-gray-900 mb-4">الرد على الرفض</h3>
            <div className="mb-4 p-4 bg-red-50 rounded-lg border border-red-200">
              <p className="text-sm text-red-800 font-medium mb-2">سبب الرفض:</p>
              <p className="text-sm text-red-700">{selectedClaim.rejection_reason || 'غير محدد'}</p>
            </div>
            <textarea
              placeholder="اكتب ردك أو توضيحاتك..."
              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary resize-none"
              rows={5}
            />
            <div className="flex gap-3 mt-4">
              <button
                onClick={() => {
                  // Handle response
                  setShowResponseModal(false)
                }}
                className="flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark"
              >
                إرسال الاستئناف
              </button>
              <button
                onClick={() => {
                  // Handle resubmit
                  setShowResponseModal(false)
                }}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                إعادة الإرسال
              </button>
              <button
                onClick={() => {
                  setShowResponseModal(false)
                  setSelectedClaim(null)
                }}
                className="px-4 py-2 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

