'use client'

/**
 * New Session Page
 * صفحة إنشاء جلسة جديدة
<<<<<<< HEAD
 * تلقائياً تربط الجلسة بالمريض المختار في PatientContext
 */

import { Calendar, Clock, FileText, Save, X } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { usePatientContext } from '@/contexts/PatientContext'
=======
 * TODO: Re-implement PatientContext integration
 */

import { Calendar, Clock, FileText, Save, X } from 'lucide-react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useState, useEffect } from 'react'
// import { usePatientContext } from '@/contexts/PatientContext' // TODO: Re-implement
>>>>>>> cursor/fix-code-errors-and-warnings-8041

const SESSION_TYPES = [
  { value: 'session', label: 'جلسة علاجية' },
  { value: 'speech_therapy', label: 'جلسة نطق وتخاطب' },
  { value: 'behavior_modification', label: 'جلسة تعديل سلوك' },
  { value: 'occupational_therapy', label: 'جلسة علاج وظيفي' },
  { value: 'sensory_integration', label: 'جلسة تكامل حسي' },
  { value: 'early_intervention', label: 'جلسة تدخل مبكر' },
  { value: 'autism_therapy', label: 'جلسة علاج توحد' },
  { value: 'consultation', label: 'استشارة' },
  { value: 'follow_up', label: 'متابعة' },
  { value: 'evaluation', label: 'تقييم' },
  { value: 'video_call', label: 'جلسة عن بُعد (فيديو)' }
]

export default function NewSessionPage() {
  const router = useRouter()
<<<<<<< HEAD
  const { currentPatient } = usePatientContext()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    patient_id: currentPatient?.id || '',
=======
  const searchParams = useSearchParams()
  const patientId = searchParams.get('patient_id')
  // const { currentPatient } = usePatientContext() // TODO: Re-implement
  const [currentPatient, setCurrentPatient] = useState<{ id: string; name: string; phone: string } | null>(null)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    patient_id: patientId || '',
>>>>>>> cursor/fix-code-errors-and-warnings-8041
    appointment_id: '',
    date: new Date().toISOString().slice(0, 16),
    duration: 30,
    session_type: 'session',
    chief_complaint: '',
    assessment: '',
    plan: '',
    notes: ''
  })

<<<<<<< HEAD
  // Update patient_id when currentPatient changes
  useEffect(() => {
    if (currentPatient) {
      setFormData(prev => ({ ...prev, patient_id: currentPatient.id }))
    }
  }, [currentPatient])

  // If no patient selected, redirect to doctor page
  useEffect(() => {
    if (!currentPatient) {
      router.push('/dashboard/doctor')
    }
  }, [currentPatient, router])
=======
  // Fetch patient if patient_id is provided
  useEffect(() => {
    if (patientId) {
      fetch(`/api/patients/${patientId}`)
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            setCurrentPatient(data.data)
            setFormData(prev => ({ ...prev, patient_id: patientId }))
          }
        })
        .catch(err => console.error('Error fetching patient:', err))
    }
  }, [patientId])
>>>>>>> cursor/fix-code-errors-and-warnings-8041

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!currentPatient) {
      alert('يرجى اختيار مريض أولاً')
      return
    }

    if (!formData.date || !formData.session_type) {
      alert('يرجى ملء جميع الحقول المطلوبة')
      return
    }

    try {
      setLoading(true)
      const res = await fetch('/api/doctor/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          patient_id: currentPatient.id
        })
      })

      const data = await res.json()
      if (data.success) {
        router.push(`/dashboard/doctor/sessions/${data.data.id}`)
      } else {
        alert('فشل في إنشاء الجلسة: ' + (data.error || 'خطأ غير معروف'))
      }
    } catch (error) {
      console.error('Error creating session:', error)
      alert('حدث خطأ أثناء إنشاء الجلسة')
    } finally {
      setLoading(false)
    }
  }

  if (!currentPatient) {
    return (
      <div className="p-8 text-center">
        <p className="text-gray-500 mb-4">يرجى اختيار مريض أولاً</p>
        <button
          onClick={() => router.push('/dashboard/doctor')}
          className="px-4 py-2 bg-primary text-white rounded-lg"
        >
          العودة للصفحة الرئيسية
        </button>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-4xl font-extrabold text-gray-900 mb-2">جلسة جديدة</h1>
        <p className="text-gray-500 text-lg">إنشاء جلسة علاجية للمريض: {currentPatient.name}</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 space-y-6">
        {/* Patient Info (Read-only) */}
        <div className="bg-primary/5 border border-primary/20 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center text-white font-bold text-lg">
              {currentPatient.name.charAt(0)}
            </div>
            <div>
              <div className="font-bold text-gray-900">{currentPatient.name}</div>
              <div className="text-sm text-gray-600">{currentPatient.phone}</div>
            </div>
          </div>
        </div>

        {/* Session Type */}
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">نوع الجلسة *</label>
          <select
            value={formData.session_type}
            onChange={(e) => setFormData({ ...formData, session_type: e.target.value })}
            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent"
            required
          >
            {SESSION_TYPES.map(type => (
              <option key={type.value} value={type.value}>{type.label}</option>
            ))}
          </select>
        </div>

        {/* Date & Time */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">التاريخ والوقت *</label>
            <input
              type="datetime-local"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">المدة (دقيقة) *</label>
            <input
              type="number"
              min="15"
              max="120"
              step="15"
              value={formData.duration}
              onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) || 30 })}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent"
              required
            />
          </div>
        </div>

        {/* Chief Complaint */}
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">الهدف من الجلسة</label>
          <textarea
            rows={2}
            value={formData.chief_complaint}
            onChange={(e) => setFormData({ ...formData, chief_complaint: e.target.value })}
            placeholder="ما هو الهدف الرئيسي من هذه الجلسة؟"
            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent"
          />
        </div>

        {/* Assessment */}
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">التقييم</label>
          <textarea
            rows={4}
            value={formData.assessment}
            onChange={(e) => setFormData({ ...formData, assessment: e.target.value })}
            placeholder="ملاحظات التقييم والملاحظات أثناء الجلسة..."
            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent"
          />
        </div>

        {/* Plan */}
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">الخطة</label>
          <textarea
            rows={3}
            value={formData.plan}
            onChange={(e) => setFormData({ ...formData, plan: e.target.value })}
            placeholder="الخطة العلاجية المقترحة..."
            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent"
          />
        </div>

        {/* Notes */}
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">ملاحظات إضافية</label>
          <textarea
            rows={3}
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            placeholder="أي ملاحظات إضافية..."
            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent"
          />
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-4 border-t border-gray-100">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-primary text-white rounded-xl font-bold hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save size={20} />
            {loading ? 'جاري الحفظ...' : 'حفظ الجلسة'}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="flex items-center justify-center gap-2 px-6 py-3 border border-gray-200 text-gray-600 rounded-xl font-bold hover:bg-gray-50 transition-colors"
          >
            <X size={20} />
            إلغاء
          </button>
        </div>
      </form>
    </div>
  )
}

