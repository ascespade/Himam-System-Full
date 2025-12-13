'use client'

import { Clock, Plus, Save, Trash2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { logError } from '@/shared/utils/logger'
import { toastError } from '@/shared/utils/toast'

interface Schedule {
  id: string
  day_of_week: number
  start_time: string
  end_time: string
  break_start?: string
  break_end?: string
  slot_duration: number
  is_active: boolean
}

const DAYS = [
  { value: 0, label: 'الأحد' },
  { value: 1, label: 'الإثنين' },
  { value: 2, label: 'الثلاثاء' },
  { value: 3, label: 'الأربعاء' },
  { value: 4, label: 'الخميس' },
  { value: 5, label: 'الجمعة' },
  { value: 6, label: 'السبت' }
]

export default function DoctorSchedulePage() {
  const [schedules, setSchedules] = useState<Schedule[]>([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [formData, setFormData] = useState<Partial<Schedule>>({
    day_of_week: 0,
    start_time: '09:00',
    end_time: '17:00',
    break_start: '13:00',
    break_end: '14:00',
    slot_duration: 30,
    is_active: true
  })

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  useEffect(() => {
    fetchSchedules()
  }, [])

  const fetchSchedules = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/doctor/schedule')
      const data = await res.json()
      if (data.success) {
        setSchedules(data.data || [])
      }
    } catch (error) {
      logError('Error fetching schedules', error, { endpoint: '/api/doctor/schedule' })
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    try {
      const url = editingId ? `/api/doctor/schedule/${editingId}` : '/api/doctor/schedule'
      const method = editingId ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      const data = await res.json()
      if (data.success) {
        await fetchSchedules()
        setEditingId(null)
        setShowAddForm(false)
        setFormData({
          day_of_week: 0,
          start_time: '09:00',
          end_time: '17:00',
          break_start: '13:00',
          break_end: '14:00',
          slot_duration: 30,
          is_active: true
        })
      } else {
        const errorMessage = data.error || 'خطأ غير معروف'
        logError('Failed to save schedule', new Error(errorMessage), { endpoint: '/api/doctor/schedule' })
        toastError('فشل في حفظ الجدول: ' + errorMessage)
      }
    } catch (error) {
      logError('Error saving schedule', error, { endpoint: '/api/doctor/schedule' })
      toastError('حدث خطأ أثناء حفظ الجدول')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا الجدول؟')) return

    try {
      const res = await fetch(`/api/doctor/schedule/${id}`, {
        method: 'DELETE'
      })

      const data = await res.json()
      if (data.success) {
        await fetchSchedules()
      } else {
        const errorMessage = data.error || 'خطأ غير معروف'
        logError('Failed to delete schedule', new Error(errorMessage), { endpoint: '/api/doctor/schedule' })
        toastError('فشل في حذف الجدول: ' + errorMessage)
      }
    } catch (error) {
      logError('Error deleting schedule', error, { endpoint: '/api/doctor/schedule' })
      toastError('حدث خطأ أثناء حذف الجدول')
    }
  }

  const handleEdit = (schedule: Schedule) => {
    setEditingId(schedule.id)
    setFormData(schedule)
    setShowAddForm(true)
  }

  if (loading) {
    return (
      <div className="p-8">
        <div className="text-center text-gray-500">جاري تحميل الجدول الزمني...</div>
      </div>
    )
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-4xl font-extrabold text-gray-900 mb-2">إدارة الجدول الزمني</h1>
        <p className="text-gray-500 text-lg">حدد أوقات عملك وأوقات الاستراحة</p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">جدول العمل الأسبوعي</h2>
          <button
            onClick={() => {
              setShowAddForm(true)
              setEditingId(null)
              setFormData({
                day_of_week: 0,
                start_time: '09:00',
                end_time: '17:00',
                break_start: '13:00',
                break_end: '14:00',
                slot_duration: 30,
                is_active: true
              })
            }}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg font-bold hover:bg-primary-dark transition-colors"
          >
            <Plus size={20} />
            إضافة يوم
          </button>
        </div>

        {showAddForm && (
          <div className="bg-gray-50 rounded-xl p-6 mb-6 border border-gray-200">
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              {editingId ? 'تعديل الجدول' : 'إضافة جدول جديد'}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">اليوم</label>
                <select
                  value={formData.day_of_week}
                  onChange={(e) => setFormData({ ...formData, day_of_week: parseInt(e.target.value) })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                >
                  {DAYS.map(day => (
                    <option key={day.value} value={day.value}>{day.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">مدة الجلسة (دقيقة)</label>
                <input
                  type="number"
                  value={formData.slot_duration}
                  onChange={(e) => setFormData({ ...formData, slot_duration: parseInt(e.target.value) })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  min="15"
                  max="120"
                  step="15"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">وقت البدء</label>
                <input
                  type="time"
                  value={formData.start_time}
                  onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">وقت الانتهاء</label>
                <input
                  type="time"
                  value={formData.end_time}
                  onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">بداية الاستراحة (اختياري)</label>
                <input
                  type="time"
                  value={formData.break_start || ''}
                  onChange={(e) => setFormData({ ...formData, break_start: e.target.value || undefined })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">نهاية الاستراحة (اختياري)</label>
                <input
                  type="time"
                  value={formData.break_end || ''}
                  onChange={(e) => setFormData({ ...formData, break_end: e.target.value || undefined })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="w-4 h-4 text-primary rounded focus:ring-primary"
                />
                <label htmlFor="is_active" className="text-sm font-bold text-gray-700">نشط</label>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={handleSave}
                className="flex items-center gap-2 px-6 py-2 bg-primary text-white rounded-lg font-bold hover:bg-primary-dark transition-colors"
              >
                <Save size={18} />
                حفظ
              </button>
              <button
                onClick={() => {
                  setShowAddForm(false)
                  setEditingId(null)
                }}
                className="px-6 py-2 border border-gray-200 text-gray-600 rounded-lg font-bold hover:bg-gray-50 transition-colors"
              >
                إلغاء
              </button>
            </div>
          </div>
        )}

        <div className="space-y-3">
          {schedules.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Clock size={48} className="mx-auto mb-4 text-gray-300" />
              <p>لا توجد جداول زمنية محددة</p>
              <p className="text-sm mt-2">انقر على "إضافة يوم" لبدء إعداد جدولك</p>
            </div>
          ) : (
            schedules.map((schedule) => {
              const day = DAYS.find(d => d.value === schedule.day_of_week)
              return (
                <div
                  key={schedule.id}
                  className="flex items-center justify-between p-4 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-lg flex items-center justify-center font-bold ${
                      schedule.is_active ? 'bg-primary/10 text-primary' : 'bg-gray-100 text-gray-400'
                    }`}>
                      {day?.label.charAt(0) || '?'}
                    </div>
                    <div>
                      <div className="font-bold text-gray-900">{day?.label}</div>
                      <div className="text-sm text-gray-500">
                        {schedule.start_time} - {schedule.end_time}
                        {schedule.break_start && schedule.break_end && (
                          <span className="mr-2">(استراحة: {schedule.break_start} - {schedule.break_end})</span>
                        )}
                      </div>
                      <div className="text-xs text-gray-400">
                        مدة الجلسة: {schedule.slot_duration} دقيقة
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                      schedule.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                    }`}>
                      {schedule.is_active ? 'نشط' : 'غير نشط'}
                    </span>
                    <button
                      onClick={() => handleEdit(schedule)}
                      className="p-2 text-primary hover:bg-primary/10 rounded-lg transition-colors"
                      title="تعديل"
                    >
                      ✏️
                    </button>
                    <button
                      onClick={() => handleDelete(schedule.id)}
                      className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      title="حذف"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}

