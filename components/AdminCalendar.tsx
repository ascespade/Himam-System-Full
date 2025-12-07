'use client'

import { addMonths, format, isSameDay, isToday, subMonths } from 'date-fns'
import { arSA } from 'date-fns/locale'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useEffect, useState } from 'react'

const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export default function AdminCalendar() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [events, setEvents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAppointments()
  }, [])

  const fetchAppointments = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/appointments')
      const data = await res.json()
      if (data.success) {
        setEvents(data.data)
      }
    } catch (e) {
      console.error(e)
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

  const getEventsForDate = (date: Date) => {
    return events.filter(event => isSameDay(new Date(event.date), date))
  }

  const renderCalendarCells = () => {
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()

    const firstDayOfMonth = new Date(year, month, 1).getDay()
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    const daysInPrevMonth = new Date(year, month, 0).getDate()

    const cells = []

    // Previous month days
    for (let i = firstDayOfMonth - 1; i >= 0; i--) {
      const day = daysInPrevMonth - i
      cells.push(
        <td key={`prev-${day}`} className="border border-[#eff1f3] p-2 align-top h-24 bg-gray-50/30">
          <div className="opacity-30">
            <div className="text-[#67779d] p-2">{day}</div>
          </div>
        </td>
      )
    }

    // Current month days
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day)
      const dayOfWeek = date.getDay()
      const isCurrentDay = isToday(date)
      const dayEvents = getEventsForDate(date)

      cells.push(
        <td key={`current-${day}`} className="border border-[#eff1f3] p-2 align-top h-24 bg-white hover:bg-gray-50 transition-colors">
          <div className={`${dayOfWeek === 0 ? 'text-[#fb6340]' : 'text-[#67779d]'} p-2 ${isCurrentDay ? 'font-bold bg-primary/10 rounded-full w-8 h-8 flex items-center justify-center text-primary' : ''}`}>
            {day}
          </div>
          <div className="space-y-1 mt-1">
            {dayEvents.map((event: any) => (
              <div
                key={event.id}
                className={`
                  text-white text-xs px-2 py-1 rounded cursor-pointer truncate
                  ${event.status === 'confirmed' ? 'bg-green-500' :
                    event.status === 'cancelled' ? 'bg-red-500' :
                    'bg-[#5e72e4]'}
                `}
                title={`${event.patient_name} - ${event.specialist}`}
              >
                {event.patient_name}
              </div>
            ))}
          </div>
        </td>
      )
    }

    // Next month days to fill the grid
    const totalCells = cells.length
    const remainingCells = Math.ceil(totalCells / 7) * 7 - totalCells

    for (let day = 1; day <= remainingCells; day++) {
      cells.push(
        <td key={`next-${day}`} className="border border-[#eff1f3] p-2 align-top h-24 bg-gray-50/30">
          <div className="opacity-30">
            <div className="text-[#67779d] p-2">{day}</div>
          </div>
        </td>
      )
    }

    // Group into rows
    const rows = []
    for (let i = 0; i < cells.length; i += 7) {
      rows.push(
        <tr key={`row-${i}`}>
          {cells.slice(i, i + 7)}
        </tr>
      )
    }

    return rows
  }

  return (
    <div className="bg-white rounded-md shadow-lg">
      {/* Header */}
      <div className="bg-white rounded-t-md p-5 flex items-center justify-between border-b border-[#eff1f3]">
        <h5 className="text-[#32325d] text-lg font-semibold m-0">
          {format(currentDate, 'MMMM yyyy', { locale: arSA })}
        </h5>
        <div className="flex items-center gap-4">
          <button
            onClick={handlePrevMonth}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            aria-label="Previous month"
          >
            <ChevronRight className="w-5 h-5 text-[#8898aa]" />
          </button>
          <button
            onClick={handleNextMonth}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            aria-label="Next month"
          >
            <ChevronLeft className="w-5 h-5 text-[#8898aa]" />
          </button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="p-4">
        <table className="w-full border-collapse table-fixed">
          <thead>
            <tr>
              {DAYS_OF_WEEK.map(day => (
                <th
                  key={day}
                  className="border border-[#eff1f3] text-[#8898aa] uppercase text-xs p-3 bg-gray-50 font-semibold"
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
      </div>
    </div>
  )
}
