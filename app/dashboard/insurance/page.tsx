'use client'

import { useState, useEffect } from 'react'
import { Shield, Search, Filter, FileText, CheckCircle, XCircle, Clock, DollarSign, TrendingUp, AlertCircle, Eye } from 'lucide-react'
import Modal from '@/components/Modal'

interface InsuranceClaim {
  id: string
  claim_number: string
  patient_id: string
  patient_name: string
  claim_type: string
  service_date: string
  service_description: string
  amount: number
  covered_amount: number
  patient_responsibility: number
  status: 'pending' | 'submitted' | 'approved' | 'rejected' | 'paid' | 'appealed'
  submitted_date?: string
  processed_date?: string
  rejection_reason?: string
  insurance_provider: string
}

interface Stats {
  total: number
  pending: number
  approved: number
  rejected: number
  totalAmount: number
  coveredAmount: number
}

export default function InsurancePage() {
  const [claims, setClaims] = useState<InsuranceClaim[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedStatus, setSelectedStatus] = useState<string>('all')
  const [selectedProvider, setSelectedProvider] = useState<string>('all')
  const [stats, setStats] = useState<Stats>({ total: 0, pending: 0, approved: 0, rejected: 0, totalAmount: 0, coveredAmount: 0 })
  const [showClaimModal, setShowClaimModal] = useState(false)
  const [selectedClaim, setSelectedClaim] = useState<InsuranceClaim | null>(null)

  useEffect(() => {
    fetchClaims()
  }, [])

  const fetchClaims = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/insurance/claims')
      const data = await res.json()
      if (data.success) {
        setClaims(data.data || [])
        calculateStats(data.data || [])
      }
    } catch (error) {
      console.error('Error fetching claims:', error)
    } finally {
      setLoading(false)
    }
  }

  const calculateStats = (items: InsuranceClaim[]) => {
    setStats({
      total: items.length,
      pending: items.filter(c => c.status === 'pending' || c.status === 'submitted').length,
      approved: items.filter(c => c.status === 'approved' || c.status === 'paid').length,
      rejected: items.filter(c => c.status === 'rejected').length,
      totalAmount: items.reduce((sum, c) => sum + c.amount, 0),
      coveredAmount: items.reduce((sum, c) => sum + (c.covered_amount || 0), 0)
    })
  }

  const updateClaimStatus = async (id: string, status: InsuranceClaim['status'], reason?: string) => {
    try {
      const res = await fetch(`/api/insurance/claims/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, rejection_reason: reason })
      })
      const data = await res.json()
      if (data.success) {
        fetchClaims()
        setShowClaimModal(false)
      }
    } catch (error) {
      console.error('Error updating claim:', error)
    }
  }

  const filteredClaims = claims.filter(claim => {
    const matchesSearch = 
      claim.patient_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      claim.claim_number.includes(searchTerm) ||
      claim.service_description.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = selectedStatus === 'all' || claim.status === selectedStatus
    const matchesProvider = selectedProvider === 'all' || claim.insurance_provider === selectedProvider
    
    return matchesSearch && matchesStatus && matchesProvider
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-700'
      case 'submitted': return 'bg-blue-100 text-blue-700'
      case 'approved': return 'bg-green-100 text-green-700'
      case 'paid': return 'bg-green-100 text-green-700'
      case 'rejected': return 'bg-red-100 text-red-700'
      case 'appealed': return 'bg-purple-100 text-purple-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending': return 'قيد المراجعة'
      case 'submitted': return 'تم الإرسال'
      case 'approved': return 'موافق عليه'
      case 'paid': return 'مدفوع'
      case 'rejected': return 'مرفوض'
      case 'appealed': return 'قيد الاستئناف'
      default: return status
    }
  }

  const providers = Array.from(new Set(claims.map(c => c.insurance_provider).filter(Boolean)))

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-extrabold text-gray-900 mb-2">شاشة التأمينات</h1>
        <p className="text-gray-500 text-lg">إدارة مطالبات التأمين والمتابعة</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="text-3xl font-bold text-gray-900">{stats.total}</div>
          <div className="text-sm text-gray-500 mt-1">إجمالي المطالبات</div>
        </div>
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="text-3xl font-bold text-yellow-600">{stats.pending}</div>
          <div className="text-sm text-gray-500 mt-1">قيد المراجعة</div>
        </div>
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="text-3xl font-bold text-green-600">{stats.approved}</div>
          <div className="text-sm text-gray-500 mt-1">موافق عليه</div>
        </div>
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="text-3xl font-bold text-red-600">{stats.rejected}</div>
          <div className="text-sm text-gray-500 mt-1">مرفوض</div>
        </div>
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="text-3xl font-bold text-primary">
            {stats.coveredAmount.toLocaleString()} ر.س
          </div>
          <div className="text-sm text-gray-500 mt-1">المبلغ المغطى</div>
        </div>
      </div>

      {/* Actions Bar */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="flex-1 w-full md:w-auto">
            <div className="relative">
              <Search className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="ابحث في المطالبات..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pr-12 pl-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
          </div>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent"
          >
            <option value="all">جميع الحالات</option>
            <option value="pending">قيد المراجعة</option>
            <option value="submitted">تم الإرسال</option>
            <option value="approved">موافق عليه</option>
            <option value="paid">مدفوع</option>
            <option value="rejected">مرفوض</option>
          </select>

          {providers.length > 0 && (
            <select
              value={selectedProvider}
              onChange={(e) => setSelectedProvider(e.target.value)}
              className="px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              <option value="all">جميع شركات التأمين</option>
              {providers.map(provider => (
                <option key={provider} value={provider}>{provider}</option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* Claims Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-right text-sm font-bold text-gray-700">رقم المطالبة</th>
                <th className="px-6 py-4 text-right text-sm font-bold text-gray-700">المريض</th>
                <th className="px-6 py-4 text-right text-sm font-bold text-gray-700">نوع الخدمة</th>
                <th className="px-6 py-4 text-right text-sm font-bold text-gray-700">المبلغ</th>
                <th className="px-6 py-4 text-right text-sm font-bold text-gray-700">المغطى</th>
                <th className="px-6 py-4 text-right text-sm font-bold text-gray-700">الحالة</th>
                <th className="px-6 py-4 text-center text-sm font-bold text-gray-700">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredClaims.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                    {loading ? 'جاري التحميل...' : 'لا توجد مطالبات'}
                  </td>
                </tr>
              ) : (
                filteredClaims.map((claim) => (
                  <tr key={claim.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-bold text-gray-900">{claim.claim_number}</div>
                      <div className="text-xs text-gray-400 mt-1">
                        {new Date(claim.service_date).toLocaleDateString('ar-SA')}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-bold text-gray-900">{claim.patient_name}</div>
                      <div className="text-xs text-gray-400 mt-1">{claim.insurance_provider}</div>
                    </td>
                    <td className="px-6 py-4 text-gray-600">{claim.service_description}</td>
                    <td className="px-6 py-4">
                      <div className="font-bold text-gray-900">{claim.amount.toLocaleString()} ر.س</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-bold text-green-600">
                        {claim.covered_amount.toLocaleString()} ر.س
                      </div>
                      {claim.patient_responsibility > 0 && (
                        <div className="text-xs text-red-600 mt-1">
                          المريض: {claim.patient_responsibility.toLocaleString()} ر.س
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${getStatusColor(claim.status)}`}>
                        {getStatusLabel(claim.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => {
                            setSelectedClaim(claim)
                            setShowClaimModal(true)
                          }}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="عرض التفاصيل"
                        >
                          <Eye size={18} />
                        </button>
                        {claim.status === 'pending' && (
                          <>
                            <button
                              onClick={() => updateClaimStatus(claim.id, 'approved')}
                              className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                              title="موافقة"
                            >
                              <CheckCircle size={18} />
                            </button>
                            <button
                              onClick={() => {
                                setSelectedClaim(claim)
                                setShowClaimModal(true)
                              }}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="رفض"
                            >
                              <XCircle size={18} />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Claim Details Modal */}
      <Modal
        isOpen={showClaimModal}
        onClose={() => {
          setShowClaimModal(false)
          setSelectedClaim(null)
        }}
        title={selectedClaim ? `مطالبة ${selectedClaim.claim_number}` : 'تفاصيل المطالبة'}
        size="lg"
      >
        {selectedClaim && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">المريض</label>
                <div className="px-4 py-3 bg-gray-50 rounded-lg">{selectedClaim.patient_name}</div>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">شركة التأمين</label>
                <div className="px-4 py-3 bg-gray-50 rounded-lg">{selectedClaim.insurance_provider}</div>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">نوع الخدمة</label>
                <div className="px-4 py-3 bg-gray-50 rounded-lg">{selectedClaim.claim_type}</div>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">تاريخ الخدمة</label>
                <div className="px-4 py-3 bg-gray-50 rounded-lg">
                  {new Date(selectedClaim.service_date).toLocaleDateString('ar-SA')}
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">وصف الخدمة</label>
              <div className="px-4 py-3 bg-gray-50 rounded-lg">{selectedClaim.service_description}</div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">المبلغ الإجمالي</label>
                <div className="px-4 py-3 bg-gray-50 rounded-lg font-bold">
                  {selectedClaim.amount.toLocaleString()} ر.س
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">المبلغ المغطى</label>
                <div className="px-4 py-3 bg-green-50 rounded-lg font-bold text-green-700">
                  {selectedClaim.covered_amount.toLocaleString()} ر.س
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">مسؤولية المريض</label>
                <div className="px-4 py-3 bg-red-50 rounded-lg font-bold text-red-700">
                  {selectedClaim.patient_responsibility.toLocaleString()} ر.س
                </div>
              </div>
            </div>

            {selectedClaim.rejection_reason && (
              <div>
                <label className="block text-sm font-bold text-red-700 mb-2">سبب الرفض</label>
                <div className="px-4 py-3 bg-red-50 rounded-lg text-red-700">
                  {selectedClaim.rejection_reason}
                </div>
              </div>
            )}

            <div className="flex gap-3 pt-4">
              {selectedClaim.status === 'pending' && (
                <>
                  <button
                    onClick={() => updateClaimStatus(selectedClaim.id, 'approved')}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-xl font-bold transition-colors"
                  >
                    موافقة
                  </button>
                  <button
                    onClick={() => {
                      const reason = prompt('سبب الرفض:')
                      if (reason) {
                        updateClaimStatus(selectedClaim.id, 'rejected', reason)
                      }
                    }}
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-xl font-bold transition-colors"
                  >
                    رفض
                  </button>
                </>
              )}
              <button
                onClick={() => {
                  setShowClaimModal(false)
                  setSelectedClaim(null)
                }}
                className="px-6 py-3 border border-gray-200 rounded-xl font-bold hover:bg-gray-50 transition-colors"
              >
                إغلاق
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}

