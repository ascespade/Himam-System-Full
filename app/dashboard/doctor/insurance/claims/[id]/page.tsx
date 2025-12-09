'use client'

import { Shield, ArrowRight, Download, Edit, Send, CheckCircle, XCircle, Clock } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
// import { toast } from 'sonner' // TODO: Install sonner package
const toast = {
  success: (message: string) => console.log('Success:', message),
  error: (message: string) => console.error('Error:', message),
  info: (message: string) => console.info('Info:', message),
}

interface Claim {
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
  resubmission_notes?: string
  created_at: string
}

export default function ClaimDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [claim, setClaim] = useState<Claim | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchClaim()
  }, [params.id])

  const fetchClaim = async () => {
    try {
      const res = await fetch(`/api/insurance/claims`)
      const data = await res.json()
      if (data.success) {
        const found = data.data.find((c: Claim) => c.id === params.id)
        if (found) {
          setClaim(found)
        } else {
          toast.error('المطالبة غير موجودة')
          router.push('/dashboard/doctor/insurance/claims')
        }
      }
    } catch (error) {
      console.error('Error fetching claim:', error)
      toast.error('حدث خطأ في تحميل المطالبة')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async () => {
    if (!claim) return
    try {
      const res = await fetch(`/api/insurance/claims/${claim.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'submitted',
          submitted_date: new Date().toISOString()
        })
      })

      if (res.ok) {
        toast.success('تم إرسال المطالبة')
        fetchClaim()
      }
    } catch (error) {
      toast.error('حدث خطأ')
    }
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-center py-12">جاري التحميل...</div>
      </div>
    )
  }

  if (!claim) {
    return (
      <div className="p-6">
        <div className="text-center py-12">المطالبة غير موجودة</div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowRight size={18} />
          العودة
        </button>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">تفاصيل المطالبة</h1>
            <p className="text-sm text-gray-500 mt-1">رقم المطالبة: {claim.claim_number}</p>
          </div>
          <div className="flex gap-2">
            {claim.status === 'pending' && (
              <button
                onClick={handleSubmit}
                className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark"
              >
                <Send size={18} />
                إرسال المطالبة
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Status Card */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {claim.status === 'approved' || claim.status === 'paid' ? (
              <CheckCircle className="text-green-600" size={32} />
            ) : claim.status === 'rejected' ? (
              <XCircle className="text-red-600" size={32} />
            ) : (
              <Clock className="text-yellow-600" size={32} />
            )}
            <div>
              <h3 className="font-bold text-lg text-gray-900">حالة المطالبة</h3>
              <p className="text-sm text-gray-500">
                {claim.status === 'pending' ? 'قيد الانتظار' :
                 claim.status === 'submitted' ? 'مرسلة' :
                 claim.status === 'under_review' ? 'قيد المراجعة' :
                 claim.status === 'approved' ? 'موافق عليها' :
                 claim.status === 'rejected' ? 'مرفوضة' :
                 claim.status === 'paid' ? 'مدفوعة' : claim.status}
              </p>
            </div>
          </div>
          {claim.rejection_reason && (
            <div className="flex-1 mr-4 p-4 bg-red-50 rounded-lg border border-red-200">
              <p className="text-sm font-medium text-red-800 mb-1">سبب الرفض:</p>
              <p className="text-sm text-red-700">{claim.rejection_reason}</p>
            </div>
          )}
        </div>
      </div>

      {/* Details */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 space-y-6">
        <h3 className="font-bold text-lg text-gray-900">تفاصيل المطالبة</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="text-sm text-gray-500">المريض</label>
            <p className="font-medium text-gray-900 mt-1">{claim.patient_name}</p>
          </div>
          <div>
            <label className="text-sm text-gray-500">نوع المطالبة</label>
            <p className="font-medium text-gray-900 mt-1">
              {claim.claim_type === 'medical' ? 'طبي' :
               claim.claim_type === 'pharmacy' ? 'صيدلية' :
               claim.claim_type === 'lab' ? 'مختبر' :
               claim.claim_type === 'imaging' ? 'تصوير' :
               claim.claim_type === 'surgery' ? 'جراحة' : claim.claim_type}
            </p>
          </div>
          <div>
            <label className="text-sm text-gray-500">تاريخ الخدمة</label>
            <p className="font-medium text-gray-900 mt-1">
              {new Date(claim.service_date).toLocaleDateString('ar-SA')}
            </p>
          </div>
          <div>
            <label className="text-sm text-gray-500">شركة التأمين</label>
            <p className="font-medium text-gray-900 mt-1">{claim.insurance_provider || 'غير محدد'}</p>
          </div>
          <div>
            <label className="text-sm text-gray-500">المبلغ الإجمالي</label>
            <p className="font-medium text-gray-900 mt-1">{claim.amount.toFixed(2)} ر.س</p>
          </div>
          {claim.covered_amount && (
            <div>
              <label className="text-sm text-gray-500">المبلغ المغطى</label>
              <p className="font-medium text-green-600 mt-1">{claim.covered_amount.toFixed(2)} ر.س</p>
            </div>
          )}
          {claim.patient_responsibility && (
            <div>
              <label className="text-sm text-gray-500">مسؤولية المريض</label>
              <p className="font-medium text-gray-900 mt-1">{claim.patient_responsibility.toFixed(2)} ر.س</p>
            </div>
          )}
        </div>

        {claim.service_description && (
          <div>
            <label className="text-sm text-gray-500">وصف الخدمة</label>
            <p className="text-gray-700 mt-1 whitespace-pre-wrap">{claim.service_description}</p>
          </div>
        )}

        <div className="pt-4 border-t border-gray-200">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-500">تاريخ الإنشاء:</span>
              <span className="text-gray-900 mr-2">{new Date(claim.created_at).toLocaleDateString('ar-SA')}</span>
            </div>
            {claim.submitted_date && (
              <div>
                <span className="text-gray-500">تاريخ الإرسال:</span>
                <span className="text-gray-900 mr-2">{new Date(claim.submitted_date).toLocaleDateString('ar-SA')}</span>
              </div>
            )}
            {claim.processed_date && (
              <div>
                <span className="text-gray-500">تاريخ المعالجة:</span>
                <span className="text-gray-900 mr-2">{new Date(claim.processed_date).toLocaleDateString('ar-SA')}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

