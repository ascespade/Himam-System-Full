'use client'

import { addMonths, eachDayOfInterval, endOfMonth, endOfWeek, format, isSameDay, isSameMonth, isToday, startOfMonth, startOfWeek, subMonths } from 'date-fns'
import { arSA } from 'date-fns/locale'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useEffect, useState } from 'react'

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

  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1))
  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1))

  const monthStart = startOfMonth(currentDate)
  const monthEnd = endOfMonth(monthStart)
  const startDate = startOfWeek(monthStart)
  const endDate = endOfWeek(monthEnd)

  const calendarDays = eachDayOfInterval({
    start: startDate,
    end: endDate,
  })

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  const getEventsForDay = (day: Date) => {
    return events.filter(event => isSameDay(new Date(event.date), day))
  }

  return (
    <div className="w-full bg-[#f8f9fe] px-[30px] py-8 rounded-xl">
      <div className="flex flex-wrap -mx-[15px]">
        <div className="flex-grow max-w-full px-[15px] relative w-full">
          <div className="bg-white rounded-md shadow-[0_0_32px_rgba(136,152,170,0.15)] flex flex-col mb-[30px] relative break-words">

            {/* Header */}
            <div className="bg-white rounded-t-md p-6 border-b border-[#eff1f3] flex justify-between items-center">
              <h5 className="text-[#32325d] text-[17px] font-semibold">
                {format(currentDate, 'MMMM yyyy', { locale: arSA })}
              </h5>
              <div className="flex gap-2">
                <button onClick={prevMonth} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                  <ChevronRight className="w-5 h-5 text-[#32325d]" />
                </button>
                <button onClick={nextMonth} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                  <ChevronLeft className="w-5 h-5 text-[#32325d]" />
                </button>
              </div>
            </div>

            {/* Calendar Grid */}
            <div className="flex-grow min-h-[1px]">
              <div className="flex flex-col z-0">
                <div className="border-[#eff1f3] flex-grow relative h-[908px]">
                  <div className="absolute inset-0 overflow-hidden">
                    <div className="h-full w-full flex flex-col">

                      {/* Weekday Headers */}
                      <div className="flex border-b border-[#eff1f3]">
                        {weekDays.map((day) => (
                          <div key={day} className="flex-1 py-3 px-4 text-[#8898aa] text-xs font-semibold uppercase border-r border-[#eff1f3] last:border-r-0">
                            {day}
                          </div>
                        ))}
                      </div>

                      {/* Days Grid */}
                      <div className="flex-grow grid grid-cols-7 grid-rows-5">
                        {calendarDays.map((day, dayIdx) => {
                          const dayEvents = getEventsForDay(day)
                          const isCurrentMonth = isSameMonth(day, monthStart)

                          return (
                            <div
                              key={day.toString()}
                              className={`
                                border-b border-r border-[#eff1f3] p-2 min-h-[100px] relative
                                ${!isCurrentMonth ? 'bg-gray-50/50' : ''}
                                ${(dayIdx + 1) % 7 === 0 ? 'border-r-0' : ''}
                              `}
                            >
                              <div className="flex justify-between items-start mb-2">
                                <span className={`
                                  text-sm font-semibold px-2 py-1 rounded-full
                                  ${isToday(day) ? 'bg-primary text-white' : 'text-[#8898aa]'}
                                `}>
                                  {format(day, 'd')}
                                </span>
                              </div>

                              <div className="space-y-1">
                                {dayEvents.map((event, idx) => (
                                  <div
                                    key={idx}
                                    className={`
                                      text-xs px-2 py-1 rounded text-white truncate cursor-pointer hover:opacity-90 transition-opacity
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
                            </div>
                          )
                        })}
                      </div>

                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  )
}
