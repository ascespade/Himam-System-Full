'use client'

/**
 * Guardian Approvals Page
 * Pending approvals that require guardian consent
 */

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { UserCheck, Check, X, Clock, AlertCircle } from 'lucide-react'

interface Approval {
  id: string
  patient_id: string
  patient_name: string
  procedure_type: string
  description: string
  requested_at: string
  status: 'pending' | 'approved' | 'rejected'
  doctor_name?: string
}

export default function GuardianApprovalsPage() {
  const router = useRouter()
  const [approvals, setApprovals] = useState<Approval[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending')

  useEffect(() => {
    loadApprovals()
  }, [])

  const loadApprovals = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/guardian/notifications?type=approval')
      const data = await res.json()
      if (data.success) {
        setApprovals(data.data || [])
      }
    } catch (error) {
      console.error('Error loading approvals:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleApproval = async (approvalId: string, action: 'approve' | 'reject') => {
    try {
      const approval = approvals.find((a) => a.id === approvalId)
      if (!approval) return

      const res = await fetch('/api/guardian/approve-procedure', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patient_id: approval.patient_id,
          procedure_id: approvalId,
          approved: action === 'approve',
        }),
      })

      const data = await res.json()
      if (data.success) {
        loadApprovals()
      }
    } catch (error) {
      console.error('Error processing approval:', error)
    }
  }

  const filteredApprovals = approvals.filter((approval) => {
    if (filter === 'all') return true
    return approval.status === filter
  })

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
          onClick={() => router.push('/dashboard/guardian')}
          className="text-sm text-primary hover:underline mb-4 flex items-center gap-1"
        >
          ← العودة للوحة التحكم
        </button>
        <h1 className="text-4xl font-extrabold text-gray-900 mb-2">الموافقات المعلقة</h1>
        <p className="text-gray-500 text-lg">الموافقات التي تتطلب موافقتك</p>
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-6">
        {(['all', 'pending', 'approved', 'rejected'] as const).map((f) => (
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
            {f === 'rejected' && 'مرفوضة'}
          </button>
        ))}
      </div>

      {/* Approvals List */}
      {filteredApprovals.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
          <UserCheck size={48} className="mx-auto text-gray-300 mb-4" />
          <div className="text-gray-500">لا توجد موافقات</div>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredApprovals.map((approval) => (
            <div
              key={approval.id}
              className={`bg-white rounded-2xl shadow-sm border p-6 ${
                approval.status === 'pending'
                  ? 'border-orange-200 bg-orange-50'
                  : approval.status === 'approved'
                  ? 'border-green-200 bg-green-50'
                  : 'border-red-200 bg-red-50'
              }`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-xl font-bold text-gray-900">{approval.patient_name}</h3>
                    <span
                      className={`text-xs px-2 py-1 rounded ${
                        approval.status === 'pending'
                          ? 'bg-orange-100 text-orange-700'
                          : approval.status === 'approved'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-red-100 text-red-700'
                      }`}
                    >
                      {approval.status === 'pending' && 'معلقة'}
                      {approval.status === 'approved' && 'موافق عليها'}
                      {approval.status === 'rejected' && 'مرفوضة'}
                    </span>
                  </div>
                  <div className="text-sm font-medium text-gray-700 mb-2">{approval.procedure_type}</div>
                  <div className="text-sm text-gray-600 mb-2">{approval.description}</div>
                  {approval.doctor_name && (
                    <div className="text-xs text-gray-500">الطبيب: {approval.doctor_name}</div>
                  )}
                  <div className="text-xs text-gray-400 mt-2">
                    {new Date(approval.requested_at).toLocaleDateString('ar-SA')}
                  </div>
                </div>
              </div>

              {approval.status === 'pending' && (
                <div className="flex gap-3 mt-4">
                  <button
                    onClick={() => handleApproval(approval.id, 'approve')}
                    className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition flex items-center justify-center gap-2"
                  >
                    <Check size={18} />
                    موافقة
                  </button>
                  <button
                    onClick={() => handleApproval(approval.id, 'reject')}
                    className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition flex items-center justify-center gap-2"
                  >
                    <X size={18} />
                    رفض
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

