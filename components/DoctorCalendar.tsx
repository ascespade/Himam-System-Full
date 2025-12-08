'use client'

import { addMonths, format, isSameDay, isToday, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, startOfWeek, endOfWeek } from 'date-fns'
import { arSA } from 'date-fns/locale'
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react'
import { useEffect, useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'

interface Appointment {
  id: string
  patient_id: string
  doctor_id: string
  date: string
  duration: number
  status: string
  session_type: string
  color?: string
  notes?: string
  patients?: {
    name: string
    phone: string
  }
}

const SESSION_TYPE_COLORS: Record<string, string> = {
  'speech_therapy': '#3B82F6', // Blue
  'behavior_modification': '#F59E0B', // Orange
  'occupational_therapy': '#10B981', // Green
  'sensory_integration': '#8B5CF6', // Purple
  'early_intervention': '#EC4899', // Pink
  'autism_therapy': '#6366F1', // Indigo
  'consultation': '#14B8A6', // Teal
  'follow_up': '#06B6D4', // Cyan
  'evaluation': '#F97316', // Orange
  'video_call': '#EF4444', // Red
  'session': '#5e72e4' // Default
}

const STATUS_COLORS: Record<string, string> = {
  'confirmed': '#10B981',
  'pending': '#F59E0B',
  'completed': '#6366F1',
  'cancelled': '#EF4444'
}

export default function DoctorCalendar() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)
  const [draggedAppointment, setDraggedAppointment] = useState<Appointment | null>(null)
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const DAYS_OF_WEEK = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت']

  useEffect(() => {
    fetchAppointments()
    
    // Subscribe to real-time updates
    const channel = supabase
      .channel('appointments_changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'appointments'
      }, () => {
        fetchAppointments()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [currentDate])

  const fetchAppointments = async () => {
    try {
      setLoading(true)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Get start and end of current month
      const monthStart = startOfMonth(currentDate)
      const monthEnd = endOfMonth(currentDate)

      const res = await fetch(`/api/doctor/appointments?start=${monthStart.toISOString()}&end=${monthEnd.toISOString()}`)
      const data = await res.json()
      if (data.success) {
        setAppointments(data.data || [])
      }
    } catch (e) {
      console.error('Error fetching appointments:', e)
    } finally {
      setLoading(false)
    }
  }

  const handlePrevMonth = () => {
    setCurrentDate(subMonths(currentDate, 1))
  }

  const handleNextMonth = () => {
    setCurrentDate(addMonths(currentDate, 1))
  }

  const getAppointmentsForDate = (date: Date) => {
    return appointments.filter(apt => isSameDay(new Date(apt.date), date))
  }

  const getAppointmentColor = (appointment: Appointment): string => {
    if (appointment.color) return appointment.color
    if (appointment.session_type && SESSION_TYPE_COLORS[appointment.session_type]) {
      return SESSION_TYPE_COLORS[appointment.session_type]
    }
    return STATUS_COLORS[appointment.status] || '#5e72e4'
  }

  const handleDragStart = (e: React.DragEvent, appointment: Appointment) => {
    setDraggedAppointment(appointment)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  const handleDrop = async (e: React.DragEvent, targetDate: Date) => {
    e.preventDefault()
    if (!draggedAppointment) return

    const newDate = new Date(targetDate)
    const oldDate = new Date(draggedAppointment.date)
    newDate.setHours(oldDate.getHours(), oldDate.getMinutes(), 0, 0)

    try {
      const res = await fetch(`/api/appointments/${draggedAppointment.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: newDate.toISOString()
        })
      })

      const data = await res.json()
      if (data.success) {
        // Update local state
        setAppointments(prev => prev.map(apt =>
          apt.id === draggedAppointment.id
            ? { ...apt, date: newDate.toISOString() }
            : apt
        ))
      } else {
        alert('فشل في نقل الموعد: ' + (data.error || 'خطأ غير معروف'))
      }
    } catch (error) {
      console.error('Error moving appointment:', error)
      alert('حدث خطأ أثناء نقل الموعد')
    } finally {
      setDraggedAppointment(null)
    }
  }

  const handleAppointmentClick = (appointment: Appointment) => {
    // Could open a modal or navigate to appointment details
    console.log('Appointment clicked:', appointment)
  }

  const renderCalendarCells = () => {
    const monthStart = startOfMonth(currentDate)
    const monthEnd = endOfMonth(currentDate)
    const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 })
    const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 })

    const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd })
    const rows = []
    
    for (let i = 0; i < days.length; i += 7) {
      const weekDays = days.slice(i, i + 7)
      rows.push(
        <tr key={`week-${i}`}>
          {weekDays.map((day, dayIndex) => {
            const dayOfWeek = day.getDay()
            const isCurrentDay = isToday(day)
            const isCurrentMonth = day >= monthStart && day <= monthEnd
            const dayAppointments = getAppointmentsForDate(day)

            return (
              <td
                key={`day-${i}-${dayIndex}`}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, day)}
                className={`
                  border border-gray-200 p-2 align-top h-32
                  ${isCurrentMonth ? 'bg-white hover:bg-gray-50' : 'bg-gray-50/50 opacity-60'}
                  ${isCurrentDay ? 'ring-2 ring-primary ring-offset-2' : ''}
                  transition-colors cursor-pointer
                `}
              >
                <div className={`
                  ${dayOfWeek === 0 ? 'text-red-500' : dayOfWeek === 5 ? 'text-blue-500' : 'text-gray-700'}
                  p-1 mb-1
                  ${isCurrentDay ? 'font-bold bg-primary/10 rounded-full w-8 h-8 flex items-center justify-center text-primary' : ''}
                `}>
                  {format(day, 'd')}
                </div>
                <div className="space-y-1 mt-1 max-h-20 overflow-y-auto">
                  {dayAppointments.map((appointment) => {
                    const color = getAppointmentColor(appointment)
                    return (
                      <div
                        key={appointment.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, appointment)}
                        onClick={() => handleAppointmentClick(appointment)}
                        className={`
                          text-white text-xs px-2 py-1 rounded cursor-move truncate
                          hover:opacity-80 transition-opacity
                          ${draggedAppointment?.id === appointment.id ? 'opacity-50' : ''}
                        `}
                        style={{ backgroundColor: color }}
                        title={`${appointment.patients?.name || 'مريض'} - ${format(new Date(appointment.date), 'HH:mm')} - ${appointment.session_type || appointment.status}`}
                      >
                        <div className="font-bold">{appointment.patients?.name || 'مريض'}</div>
                        <div className="text-[10px] opacity-90">
                          {format(new Date(appointment.date), 'HH:mm')}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </td>
            )
          })}
        </tr>
      )
    }
    return rows
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
      {/* Header */}
      <div className="bg-white rounded-t-2xl p-6 flex items-center justify-between border-b border-gray-100">
        <div className="flex items-center gap-4">
          <CalendarIcon className="w-6 h-6 text-primary" />
          <h5 className="text-gray-900 text-xl font-bold m-0">
            {format(currentDate, 'MMMM yyyy', { locale: arSA })}
          </h5>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handlePrevMonth}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="الشهر السابق"
          >
            <ChevronRight className="w-5 h-5 text-gray-600" />
          </button>
          <button
            onClick={() => setCurrentDate(new Date())}
            className="px-4 py-2 text-sm font-bold text-primary hover:bg-primary/10 rounded-lg transition-colors"
          >
            اليوم
          </button>
          <button
            onClick={handleNextMonth}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="الشهر التالي"
          >
            <ChevronLeft className="w-5 h-5 text-gray-600" />
          </button>
        </div>
      </div>

      {/* Legend */}
      <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
        <div className="flex items-center gap-4 flex-wrap">
          <span className="text-sm font-bold text-gray-700">مفتاح الألوان:</span>
          {Object.entries(SESSION_TYPE_COLORS).slice(0, 6).map(([type, color]) => (
            <div key={type} className="flex items-center gap-2">
              <div className="w-4 h-4 rounded" style={{ backgroundColor: color }}></div>
              <span className="text-xs text-gray-600">{type.replace('_', ' ')}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="p-4">
        {loading ? (
          <div className="flex items-center justify-center h-96">
            <div className="text-gray-500">جاري تحميل المواعيد...</div>
          </div>
        ) : (
          <table className="w-full border-collapse">
            <thead>
              <tr>
                {DAYS_OF_WEEK.map(day => (
                  <th
                    key={day}
                    className="border border-gray-200 text-gray-600 uppercase text-xs p-3 bg-gray-50 font-bold text-center"
                  >
                    {day}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {renderCalendarCells()}
            </tbody>
          </table>
        )}
      </div>

      {/* Instructions */}
      <div className="px-6 py-3 bg-gray-50 border-t border-gray-100 rounded-b-2xl">
        <p className="text-xs text-gray-500 text-center">
          💡 اسحب المواعيد إلى تواريخ أخرى لتغييرها
        </p>
      </div>
    </div>
  )
}

