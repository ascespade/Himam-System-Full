'use client'

import { Calendar, Clock, Save, Trash2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { toast } from '@/shared/utils/toast'
interface WorkingHour {
  id?: string
  day_of_week: number
  start_time: string
  end_time: string
  break_start?: string
  break_end?: string
  slot_duration_minutes: number
  max_appointments_per_day: number
  is_active: boolean
  is_working_day: boolean
  valid_from?: string
  valid_until?: string
  notes?: string
}

const DAYS = [
  { value: 0, label: 'الأحد' },
  { value: 1, label: 'الإثنين' },
  { value: 2, label: 'الثلاثاء' },
  { value: 3, label: 'الأربعاء' },
  { value: 4, label: 'الخميس' },
  { value: 5, label: 'الجمعة' },
  { value: 6, label: 'السبت' },
]

export default function WorkingHoursPage() {
  const [workingHours, setWorkingHours] = useState<WorkingHour[]>([])
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<'weekly' | 'monthly'>('weekly')
  const [monthlyDate, setMonthlyDate] = useState(new Date().toISOString().split('T')[0])

  useEffect(() => {
    fetchWorkingHours()
  }, [viewMode, monthlyDate])

  const fetchWorkingHours = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (viewMode === 'monthly' && monthlyDate) {
        const monthStart = new Date(monthlyDate)
        monthStart.setDate(1)
        const monthEnd = new Date(monthStart)
        monthEnd.setMonth(monthEnd.getMonth() + 1)
        monthEnd.setDate(0)

        params.append('valid_from', monthStart.toISOString().split('T')[0])
        params.append('valid_until', monthEnd.toISOString().split('T')[0])
      }

      const res = await fetch(`/api/doctor/schedule/working-hours?${params.toString()}`)
      const json = await res.json()

      if (json.success) {
        // If no data, initialize with default weekly schedule
        if (json.data.length === 0 && viewMode === 'weekly') {
          const defaultHours: WorkingHour[] = DAYS.map((day) => ({
            day_of_week: day.value,
            start_time: '09:00',
            end_time: '17:00',
            slot_duration_minutes: 30,
            max_appointments_per_day: 20,
            is_active: true,
            is_working_day: day.value !== 5, // Friday off by default
          }))
          setWorkingHours(defaultHours)
        } else {
          setWorkingHours(json.data || [])
        }
      }
    } catch (error) {
      console.error('Error fetching working hours:', error)
      toast.error('حدث خطأ في تحميل البيانات')
    } finally {
      setLoading(false)
    }
  }

  const updateWorkingHour = (dayOfWeek: number, field: keyof WorkingHour, value: any) => {
    setWorkingHours((prev) => {
      const existing = prev.find((h) => h.day_of_week === dayOfWeek)
      if (existing) {
        return prev.map((h) =>
          h.day_of_week === dayOfWeek ? { ...h, [field]: value } : h
        )
      } else {
        return [
          ...prev,
          {
            day_of_week: dayOfWeek,
            start_time: '09:00',
            end_time: '17:00',
            slot_duration_minutes: 30,
            max_appointments_per_day: 20,
            is_active: true,
            is_working_day: true,
            [field]: value,
          },
        ]
      }
    })
  }

  const handleSave = async () => {
    try {
      const hoursToSave = workingHours.map((hour) => ({
        ...hour,
        valid_from: viewMode === 'monthly' ? monthlyDate : null,
        valid_until:
          viewMode === 'monthly'
            ? new Date(new Date(monthlyDate).setMonth(new Date(monthlyDate).getMonth() + 1))
                .toISOString()
                .split('T')[0]
            : null,
      }))

      const res = await fetch('/api/doctor/schedule/working-hours', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workingHours: hoursToSave,
          replaceExisting: true,
        }),
      })

      const json = await res.json()

      if (json.success) {
        toast.success('تم حفظ أوقات العمل بنجاح')
        fetchWorkingHours()
      } else {
        toast.error(json.error || 'حدث خطأ في الحفظ')
      }
    } catch (error) {
      toast.error('حدث خطأ في الحفظ')
    }
  }

  const getDayHours = (dayOfWeek: number): WorkingHour => {
    return (
      workingHours.find((h) => h.day_of_week === dayOfWeek) || {
        day_of_week: dayOfWeek,
        start_time: '09:00',
        end_time: '17:00',
        slot_duration_minutes: 30,
        max_appointments_per_day: 20,
        is_active: true,
        is_working_day: false,
      }
    )
  }

  if (loading) {
    return (
      <div className="p-8">
        <div className="text-center py-12">جاري تحميل البيانات...</div>
      </div>
    )
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-extrabold text-gray-900 mb-2">تخطيط أوقات العمل</h1>
        <p className="text-gray-500 text-lg">إدارة ساعات العمل الأسبوعية والشهرية</p>
      </div>

      {/* View Mode Toggle */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-2 mb-6 flex gap-2">
        <button
          onClick={() => setViewMode('weekly')}
          className={`flex-1 px-4 py-3 rounded-xl font-bold transition-all ${
            viewMode === 'weekly'
              ? 'bg-primary text-white shadow-md'
              : 'text-gray-500 hover:bg-gray-50'
          }`}
        >
          <Calendar size={20} className="inline ml-2" />
          أسبوعي
        </button>
        <button
          onClick={() => setViewMode('monthly')}
          className={`flex-1 px-4 py-3 rounded-xl font-bold transition-all ${
            viewMode === 'monthly'
              ? 'bg-primary text-white shadow-md'
              : 'text-gray-500 hover:bg-gray-50'
          }`}
        >
          <Calendar size={20} className="inline ml-2" />
          شهري
        </button>
      </div>

      {/* Monthly Date Picker */}
      {viewMode === 'monthly' && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
          <label className="block text-sm font-bold text-gray-700 mb-2">اختر الشهر</label>
          <input
            type="month"
            value={monthlyDate.substring(0, 7)}
            onChange={(e) => setMonthlyDate(e.target.value + '-01')}
            className="px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent"
          />
        </div>
      )}

      {/* Working Hours Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-right text-sm font-bold text-gray-700">اليوم</th>
                <th className="px-6 py-4 text-right text-sm font-bold text-gray-700">يوم عمل</th>
                <th className="px-6 py-4 text-right text-sm font-bold text-gray-700">وقت البداية</th>
                <th className="px-6 py-4 text-right text-sm font-bold text-gray-700">وقت النهاية</th>
                <th className="px-6 py-4 text-right text-sm font-bold text-gray-700">وقت الاستراحة</th>
                <th className="px-6 py-4 text-right text-sm font-bold text-gray-700">مدة الموعد (دقيقة)</th>
                <th className="px-6 py-4 text-right text-sm font-bold text-gray-700">الحد الأقصى للمواعيد</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {DAYS.map((day) => {
                const hours = getDayHours(day.value)
                return (
                  <tr key={day.value} className="hover:bg-gray-50">
                    <td className="px-6 py-4 font-bold text-gray-900">{day.label}</td>
                    <td className="px-6 py-4">
                      <input
                        type="checkbox"
                        checked={hours.is_working_day}
                        onChange={(e) =>
                          updateWorkingHour(day.value, 'is_working_day', e.target.checked)
                        }
                        className="w-5 h-5 text-primary rounded focus:ring-primary"
                      />
                    </td>
                    <td className="px-6 py-4">
                      {hours.is_working_day ? (
                        <input
                          type="time"
                          value={hours.start_time}
                          onChange={(e) =>
                            updateWorkingHour(day.value, 'start_time', e.target.value)
                          }
                          className="px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary"
                        />
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {hours.is_working_day ? (
                        <input
                          type="time"
                          value={hours.end_time}
                          onChange={(e) =>
                            updateWorkingHour(day.value, 'end_time', e.target.value)
                          }
                          className="px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary"
                        />
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {hours.is_working_day ? (
                        <div className="flex gap-2">
                          <input
                            type="time"
                            value={hours.break_start || ''}
                            onChange={(e) =>
                              updateWorkingHour(day.value, 'break_start', e.target.value || undefined)
                            }
                            placeholder="من"
                            className="px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary w-24"
                          />
                          <input
                            type="time"
                            value={hours.break_end || ''}
                            onChange={(e) =>
                              updateWorkingHour(day.value, 'break_end', e.target.value || undefined)
                            }
                            placeholder="إلى"
                            className="px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary w-24"
                          />
                        </div>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {hours.is_working_day ? (
                        <input
                          type="number"
                          value={hours.slot_duration_minutes}
                          onChange={(e) =>
                            updateWorkingHour(day.value, 'slot_duration_minutes', parseInt(e.target.value) || 30)
                          }
                          min="15"
                          step="15"
                          className="px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary w-20"
                        />
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {hours.is_working_day ? (
                        <input
                          type="number"
                          value={hours.max_appointments_per_day}
                          onChange={(e) =>
                            updateWorkingHour(day.value, 'max_appointments_per_day', parseInt(e.target.value) || 20)
                          }
                          min="1"
                          className="px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary w-20"
                        />
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Save Button */}
      <div className="mt-6 flex justify-end">
        <button
          onClick={handleSave}
          className="px-8 py-4 bg-primary hover:bg-primary-dark text-white rounded-xl font-bold text-lg transition-colors flex items-center gap-2"
        >
          <Save size={20} />
          حفظ أوقات العمل
        </button>
      </div>
    </div>
  )
}

