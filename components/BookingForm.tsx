'use client'

import { useState } from 'react'

interface BookingFormProps {
  onClose?: () => void
}

export default function BookingForm({ onClose }: BookingFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    nationality: '',
    specialist: '',
    preferredDate: '',
    preferredTime: '',
    notes: '',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setSubmitStatus('idle')

    try {
      const response = await fetch('/api/patients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          phone: formData.phone,
          nationality: formData.nationality,
          status: 'Pending Booking',
        }),
      })

      if (response.ok) {
        setSubmitStatus('success')
        setTimeout(() => {
          if (onClose) onClose()
          setFormData({
            name: '',
            phone: '',
            nationality: '',
            specialist: '',
            preferredDate: '',
            preferredTime: '',
            notes: '',
          })
        }, 2000)
      } else {
        setSubmitStatus('error')
      }
    } catch (error) {
      setSubmitStatus('error')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-xl p-6 text-gray-900">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">حجز موعد جديد</h2>
        {onClose && (
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">الاسم الكامل</label>
          <input
            type="text"
            required
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">رقم الجوال</label>
          <input
            type="tel"
            required
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="+966501234567"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">الجنسية</label>
          <input
            type="text"
            required
            value={formData.nationality}
            onChange={(e) => setFormData({ ...formData, nationality: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="سعودي"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">التخصص المطلوب</label>
          <select
            value={formData.specialist}
            onChange={(e) => setFormData({ ...formData, specialist: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">اختر التخصص</option>
            <option value="speech-therapy">علاج النطق</option>
            <option value="behavior-modification">تعديل السلوك</option>
            <option value="occupational-therapy">العلاج الوظيفي</option>
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">التاريخ المفضل</label>
            <input
              type="date"
              value={formData.preferredDate}
              onChange={(e) => setFormData({ ...formData, preferredDate: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">الوقت المفضل</label>
            <input
              type="time"
              value={formData.preferredTime}
              onChange={(e) => setFormData({ ...formData, preferredTime: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">ملاحظات (اختياري)</label>
          <textarea
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            rows={3}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {submitStatus === 'success' && (
          <div className="p-4 bg-green-100 text-green-700 rounded-lg">
            تم إرسال طلب الحجز بنجاح! سنتواصل معك قريباً.
          </div>
        )}

        {submitStatus === 'error' && (
          <div className="p-4 bg-red-100 text-red-700 rounded-lg">
            حدث خطأ أثناء إرسال الطلب. يرجى المحاولة مرة أخرى.
          </div>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? 'جاري الإرسال...' : 'إرسال طلب الحجز'}
        </button>
      </form>
    </div>
  )
}

