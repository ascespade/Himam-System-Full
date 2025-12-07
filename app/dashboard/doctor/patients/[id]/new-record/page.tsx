'use client'

import { ChevronRight, Save } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

export default function NewRecordPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [formData, setFormData] = useState({
    record_type: 'visit',
    chief_complaint: '',
    history_of_present_illness: '',
    physical_examination: '',
    assessment: '',
    plan: '',
    notes: ''
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/medical-records', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patient_id: params.id,
          doctor_id: 'placeholder', // API handles this
          ...formData
        })
      })

      const data = await res.json()

      if (data.success) {
        router.push(`/dashboard/doctor/patients/${params.id}`)
        router.refresh()
      } else {
        setError(Array.isArray(data.error) ? data.error[0].message : data.error)
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-2 text-gray-500 mb-6">
        <span className="cursor-pointer hover:text-primary" onClick={() => router.push('/dashboard/doctor')}>شاشة الطبيب</span>
        <ChevronRight size={16} />
        <span className="cursor-pointer hover:text-primary" onClick={() => router.push(`/dashboard/doctor/patients/${params.id}`)}>ملف المريض</span>
        <ChevronRight size={16} />
        <span className="font-bold text-gray-900">سجل طبي جديد</span>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">إضافة سجل طبي جديد</h1>

        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-xl mb-6 text-sm font-bold">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">نوع السجل</label>
            <select
              value={formData.record_type}
              onChange={(e) => setFormData({ ...formData, record_type: e.target.value })}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              <option value="visit">زيارة عيادة</option>
              <option value="consultation">استشارة</option>
              <option value="follow_up">متابعة</option>
              <option value="emergency">طوارئ</option>
              <option value="procedure">إجراء طبي</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">الشكوى الرئيسية (Chief Complaint)</label>
            <textarea
              required
              rows={2}
              value={formData.chief_complaint}
              onChange={(e) => setFormData({ ...formData, chief_complaint: e.target.value })}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder="ما هي المشكلة الرئيسية؟"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">التاريخ المرضي (HPI)</label>
            <textarea
              rows={4}
              value={formData.history_of_present_illness}
              onChange={(e) => setFormData({ ...formData, history_of_present_illness: e.target.value })}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder="تفاصيل الحالة المرضية..."
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">الفحص السريري (Physical Exam)</label>
            <textarea
              rows={4}
              value={formData.physical_examination}
              onChange={(e) => setFormData({ ...formData, physical_examination: e.target.value })}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder="نتائج الفحص..."
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">التقييم (Assessment)</label>
              <textarea
                rows={3}
                value={formData.assessment}
                onChange={(e) => setFormData({ ...formData, assessment: e.target.value })}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="التشخيص المبدئي..."
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">الخطة العلاجية (Plan)</label>
              <textarea
                rows={3}
                value={formData.plan}
                onChange={(e) => setFormData({ ...formData, plan: e.target.value })}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="الخطوات القادمة..."
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">ملاحظات إضافية</label>
            <textarea
              rows={2}
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>

          <div className="flex gap-4 pt-4 border-t border-gray-100">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-primary hover:bg-primary-dark text-white font-bold py-3 px-6 rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              {loading ? 'جاري الحفظ...' : (
                <>
                  <Save size={20} />
                  حفظ السجل
                </>
              )}
            </button>
            <button
              type="button"
              onClick={() => router.back()}
              className="px-6 py-3 border border-gray-200 text-gray-600 font-bold rounded-xl hover:bg-gray-50 transition-colors"
            >
              إلغاء
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
