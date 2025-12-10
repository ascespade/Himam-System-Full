'use client'

import { Calendar, Clock, Filter, Plus, Search, Video, X } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect, useState, useCallback } from 'react'

interface Session {
  id: string
  patient_id: string
  doctor_id: string
  appointment_id?: string
  date: string
  duration: number
  session_type: string
  status: string
  chief_complaint?: string
  assessment?: string
  plan?: string
  notes?: string
  patients?: {
    name: string
    phone: string
  }
  video_sessions?: {
    meeting_url: string
    recording_url?: string
    recording_status: string
  }[]
}

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

const STATUSES = [
  { value: 'all', label: 'الكل' },
  { value: 'scheduled', label: 'مجدولة' },
  { value: 'in_progress', label: 'قيد التنفيذ' },
  { value: 'completed', label: 'مكتملة' },
  { value: 'cancelled', label: 'ملغاة' },
  { value: 'no_show', label: 'لم يحضر' }
]

export default function DoctorSessionsPage() {
  const router = useRouter()
  const [sessions, setSessions] = useState<Session[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState<string>('all')
  const [filterStatus, setFilterStatus] = useState<string>('all')

  const fetchSessions = useCallback(async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (filterType !== 'all') params.append('type', filterType)
      if (filterStatus !== 'all') params.append('status', filterStatus)

      const res = await fetch(`/api/doctor/sessions?${params.toString()}`)
      const data = await res.json()
      if (data.success) {
        setSessions(data.data || [])
      }
    } catch (error) {
      console.error('Error fetching sessions:', error)
    } finally {
      setLoading(false)
    }
  }, [filterType, filterStatus])

  useEffect(() => {
    fetchSessions()
  }, [fetchSessions])

  const filteredSessions = sessions.filter(session => {
    if (!searchTerm) return true
    const term = searchTerm.toLowerCase()
    return (
      session.patients?.name.toLowerCase().includes(term) ||
      session.patients?.phone.includes(term) ||
      session.chief_complaint?.toLowerCase().includes(term) ||
      session.session_type.toLowerCase().includes(term)
    )
  })

  const getSessionTypeLabel = (type: string) => {
    return SESSION_TYPES.find(t => t.value === type)?.label || type
  }

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      'scheduled': 'bg-blue-100 text-blue-700',
      'in_progress': 'bg-yellow-100 text-yellow-700',
      'completed': 'bg-green-100 text-green-700',
      'cancelled': 'bg-red-100 text-red-700',
      'no_show': 'bg-gray-100 text-gray-700'
    }
    return colors[status] || 'bg-gray-100 text-gray-700'
  }

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      'scheduled': 'مجدولة',
      'in_progress': 'قيد التنفيذ',
      'completed': 'مكتملة',
      'cancelled': 'ملغاة',
      'no_show': 'لم يحضر'
    }
    return labels[status] || status
  }

  if (loading) {
    return (
      <div className="p-8">
        <div className="text-center text-gray-500">جاري تحميل الجلسات...</div>
      </div>
    )
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-4xl font-extrabold text-gray-900 mb-2">إدارة الجلسات العلاجية</h1>
        <p className="text-gray-500 text-lg">تسجيل وتتبع جميع الجلسات العلاجية</p>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="ابحث عن جلسة..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pr-10 pl-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              dir="rtl"
            />
          </div>
          <div className="flex gap-2">
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              <option value="all">جميع الأنواع</option>
              {SESSION_TYPES.map(type => (
                <option key={type.value} value={type.value}>{type.label}</option>
              ))}
            </select>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              {STATUSES.map(status => (
                <option key={status.value} value={status.value}>{status.label}</option>
              ))}
            </select>
          </div>
          <button
            onClick={() => router.push('/dashboard/doctor/sessions/new')}
            className="flex items-center gap-2 px-6 py-2 bg-primary text-white rounded-lg font-bold hover:bg-primary-dark transition-colors"
          >
            <Plus size={20} />
            جلسة جديدة
          </button>
        </div>
      </div>

      {/* Sessions List */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        {filteredSessions.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <Calendar size={48} className="mx-auto mb-4 text-gray-300" />
            <p>لا توجد جلسات</p>
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="mt-2 text-primary hover:underline"
              >
                مسح البحث
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredSessions.map((session) => (
              <div
                key={session.id}
                className="p-5 border border-gray-200 rounded-xl hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => router.push(`/dashboard/doctor/sessions/${session.id}`)}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-bold text-gray-900">
                        {session.patients?.name || 'مريض غير معروف'}
                      </h3>
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${getStatusColor(session.status)}`}>
                        {getStatusLabel(session.status)}
                      </span>
                      {session.session_type === 'video_call' && (
                        <span className="flex items-center gap-1 px-2 py-1 bg-red-100 text-red-700 rounded text-xs font-bold">
                          <Video size={14} />
                          فيديو
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-500 mb-2">
                      <span className="flex items-center gap-1">
                        <Calendar size={14} />
                        {new Date(session.date).toLocaleDateString('ar-SA')}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock size={14} />
                        {new Date(session.date).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })}
                        {' - '}
                        {session.duration} دقيقة
                      </span>
                      <span className="text-primary font-bold">
                        {getSessionTypeLabel(session.session_type)}
                      </span>
                    </div>
                    {session.chief_complaint && (
                      <p className="text-sm text-gray-600 mb-2">
                        <span className="font-bold">الهدف:</span> {session.chief_complaint}
                      </p>
                    )}
                    {session.video_sessions && session.video_sessions.length > 0 && (
                      <div className="mt-2">
                        {session.video_sessions.map((video, idx) => (
                          <div key={idx} className="flex items-center gap-2 text-sm">
                            <a
                              href={video.meeting_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="text-blue-600 hover:underline flex items-center gap-1"
                            >
                              <Video size={14} />
                              رابط الجلسة
                            </a>
                            {video.recording_url && (
                              <a
                                href={video.recording_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="text-green-600 hover:underline"
                              >
                                📹 التسجيل
                              </a>
                            )}
                            {video.recording_status === 'processing' && (
                              <span className="text-yellow-600 text-xs">⏳ جاري المعالجة...</span>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      router.push(`/dashboard/doctor/sessions/${session.id}`)
                    }}
                    className="px-4 py-2 text-primary hover:bg-primary/10 rounded-lg transition-colors font-bold"
                  >
                    عرض التفاصيل
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

