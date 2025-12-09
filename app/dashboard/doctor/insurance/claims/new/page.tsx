'use client'

import { Shield, Save, ArrowRight } from 'lucide-react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { toast } from '@/shared/utils/toast'

interface Patient {
  id: string
  name: string
  phone: string
}

export default function NewClaimPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const patientId = searchParams.get('patient_id')

  const [patient, setPatient] = useState<Patient | null>(null)
  const [formData, setFormData] = useState({
    patient_id: patientId || '',
    claim_type: 'medical',
    service_date: new Date().toISOString().split('T')[0],
    service_description: '',
    amount: '',
    insurance_provider: ''
  })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (patientId) {
      fetchPatient()
    }
  }, [patientId])

  const fetchPatient = async () => {
    try {
      const res = await fetch(`/api/patients/${patientId}`)
      const data = await res.json()
      if (data.success) {
        setPatient(data.data)
        setFormData(prev => ({ ...prev, patient_id: patientId || '' }))
      }
    } catch (error) {
      console.error('Error fetching patient:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Try AI auto-submit first
      const autoSubmitRes = await fetch('/api/doctor/insurance/claims/auto-submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          amount: parseFloat(formData.amount)
        })
      })

      const autoSubmitData = await autoSubmitRes.json()

      if (autoSubmitData.success) {
        if (autoSubmitData.data.autoSubmitted) {
          toast.success('تم إرسال المطالبة تلقائياً بنجاح')
        } else {
          toast.success('تم إنشاء المطالبة، سيتم مراجعتها تلقائياً')
        }
        router.push('/dashboard/doctor/insurance/claims')
        return
      }

      // If auto-submit requires human review, create claim manually
      if (autoSubmitData.requiresHumanReview) {
        const res = await fetch('/api/insurance/claims', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...formData,
            amount: parseFloat(formData.amount)
          })
        })

        const data = await res.json()

        if (data.success) {
          toast.warning('تم إنشاء المطالبة، تحتاج مراجعة يدوية')
          router.push('/dashboard/doctor/insurance/claims')
        } else {
          throw new Error(data.error || 'فشل إنشاء المطالبة')
        }
      } else {
        throw new Error(autoSubmitData.error || 'فشل إنشاء المطالبة')
      }
    } catch (error: any) {
      toast.error(error.message || 'حدث خطأ في إنشاء المطالبة')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowRight size={18} />
          العودة
        </button>
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
            <Shield className="text-primary" size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">مطالبة تأمين جديدة</h1>
            <p className="text-sm text-gray-500 mt-1">إنشاء مطالبة تأمين جديدة</p>
          </div>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 space-y-6">
        {/* Patient Selection */}
        {patient ? (
          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-sm text-blue-800 mb-1">المريض المحدد:</p>
            <p className="font-medium text-blue-900">{patient.name} - {patient.phone}</p>
          </div>
        ) : (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              المريض *
            </label>
            <input
              type="text"
              value={formData.patient_id}
              onChange={(e) => setFormData({ ...formData, patient_id: e.target.value })}
              placeholder="اختر المريض"
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              required
            />
          </div>
        )}

        {/* Claim Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            نوع المطالبة *
          </label>
          <select
            value={formData.claim_type}
            onChange={(e) => setFormData({ ...formData, claim_type: e.target.value })}
            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            required
          >
            <option value="medical">طبي</option>
            <option value="pharmacy">صيدلية</option>
            <option value="lab">مختبر</option>
            <option value="imaging">تصوير</option>
            <option value="surgery">جراحة</option>
          </select>
        </div>

        {/* Service Date */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            تاريخ الخدمة *
          </label>
          <input
            type="date"
            value={formData.service_date}
            onChange={(e) => setFormData({ ...formData, service_date: e.target.value })}
            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            required
          />
        </div>

        {/* Service Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            وصف الخدمة
          </label>
          <textarea
            value={formData.service_description}
            onChange={(e) => setFormData({ ...formData, service_description: e.target.value })}
            placeholder="وصف تفصيلي للخدمة المقدمة..."
            className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary resize-none"
            rows={4}
          />
        </div>

        {/* Amount */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            المبلغ (ريال سعودي) *
          </label>
          <input
            type="number"
            step="0.01"
            value={formData.amount}
            onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
            placeholder="0.00"
            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            required
          />
        </div>

        {/* Insurance Provider */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            شركة التأمين
          </label>
          <input
            type="text"
            value={formData.insurance_provider}
            onChange={(e) => setFormData({ ...formData, insurance_provider: e.target.value })}
            placeholder="اسم شركة التأمين"
            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-6 py-2 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50"
          >
            إلغاء
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-2 px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark disabled:opacity-50"
          >
            <Save size={18} />
            {loading ? 'جاري الحفظ...' : 'إنشاء المطالبة'}
          </button>
        </div>
      </form>
    </div>
  )
}

