'use client'

import { Calendar, Clock, Monitor, Plus, Video, VideoOff } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
// import { toast } from 'sonner' // TODO: Install sonner package
const toast = {
  success: (message: string) => console.log('Success:', message),
  error: (message: string) => console.error('Error:', message),
  info: (message: string) => console.info('Info:', message),
}

interface VideoSession {
  id: string
  patient_id: string
  appointment_id?: string
  status: 'scheduled' | 'active' | 'completed' | 'cancelled'
  scheduled_at: string
  started_at?: string
  ended_at?: string
  meeting_url?: string
  recording_url?: string
  patients?: {
    name: string
    phone: string
  }
}

export default function VideoSessionsPage() {
  const router = useRouter()
  const [sessions, setSessions] = useState<VideoSession[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'scheduled' | 'active' | 'completed'>('all')

  useEffect(() => {
    fetchSessions()
  }, [])

  const fetchSessions = async () => {
    try {
      const res = await fetch('/api/doctor/video-sessions')
      const json = await res.json()
      if (json.success) {
        setSessions(json.data || [])
      }
    } catch (error) {
      console.error('Error fetching video sessions:', error)
      toast.error('حدث خطأ في تحميل الجلسات')
    } finally {
      setLoading(false)
    }
  }

  const handleStartSession = async (sessionId: string) => {
    try {
      const res = await fetch(`/api/doctor/video-sessions/${sessionId}/start`, {
        method: 'POST',
      })
      const json = await res.json()
      if (json.success) {
        toast.success('تم بدء الجلسة')
        if (json.data?.meeting_url) {
          window.open(json.data.meeting_url, '_blank')
        }
        fetchSessions()
      }
    } catch (error) {
      toast.error('حدث خطأ في بدء الجلسة')
    }
  }

  const handleEndSession = async (sessionId: string) => {
    try {
      const res = await fetch(`/api/doctor/video-sessions/${sessionId}/end`, {
        method: 'POST',
      })
      const json = await res.json()
      if (json.success) {
        toast.success('تم إنهاء الجلسة')
        fetchSessions()
      }
    } catch (error) {
      toast.error('حدث خطأ في إنهاء الجلسة')
    }
  }

  const filteredSessions = sessions.filter((session) => {
    if (filter === 'all') return true
    return session.status === filter
  })

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
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-extrabold text-gray-900 mb-2">الجلسات المرئية</h1>
          <p className="text-gray-500 text-lg">إدارة الجلسات المرئية مع المرضى</p>
        </div>
        <button
          onClick={() => router.push('/dashboard/doctor/video-sessions/new')}
          className="px-6 py-3 bg-primary hover:bg-primary-dark text-white rounded-xl font-bold transition-colors flex items-center gap-2"
        >
          <Plus size={20} />
          جلسة مرئية جديدة
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-2 mb-6 flex gap-2">
        <button
          onClick={() => setFilter('all')}
          className={`flex-1 px-4 py-3 rounded-xl font-bold transition-all ${
            filter === 'all'
              ? 'bg-primary text-white shadow-md'
              : 'text-gray-500 hover:bg-gray-50'
          }`}
        >
          الكل ({sessions.length})
        </button>
        <button
          onClick={() => setFilter('scheduled')}
          className={`flex-1 px-4 py-3 rounded-xl font-bold transition-all ${
            filter === 'scheduled'
              ? 'bg-primary text-white shadow-md'
              : 'text-gray-500 hover:bg-gray-50'
          }`}
        >
          مجدولة ({sessions.filter((s) => s.status === 'scheduled').length})
        </button>
        <button
          onClick={() => setFilter('active')}
          className={`flex-1 px-4 py-3 rounded-xl font-bold transition-all ${
            filter === 'active'
              ? 'bg-primary text-white shadow-md'
              : 'text-gray-500 hover:bg-gray-50'
          }`}
        >
          نشطة ({sessions.filter((s) => s.status === 'active').length})
        </button>
        <button
          onClick={() => setFilter('completed')}
          className={`flex-1 px-4 py-3 rounded-xl font-bold transition-all ${
            filter === 'completed'
              ? 'bg-primary text-white shadow-md'
              : 'text-gray-500 hover:bg-gray-50'
          }`}
        >
          مكتملة ({sessions.filter((s) => s.status === 'completed').length})
        </button>
      </div>

      {/* Sessions List */}
      {filteredSessions.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
          <Video className="mx-auto text-gray-300 mb-4" size={48} />
          <p className="text-gray-500 text-lg mb-4">لا توجد جلسات مرئية</p>
          <button
            onClick={() => router.push('/dashboard/doctor/video-sessions/new')}
            className="px-6 py-3 bg-primary hover:bg-primary-dark text-white rounded-xl font-bold transition-colors"
          >
            إنشاء جلسة مرئية جديدة
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredSessions.map((session) => (
            <div
              key={session.id}
              className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-all"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4 flex-1">
                  <div className="w-16 h-16 bg-purple-100 rounded-xl flex items-center justify-center">
                    <Video className="text-purple-600" size={32} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-bold text-gray-900">
                        {session.patients?.name || 'مريض غير معروف'}
                      </h3>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-bold ${
                          session.status === 'active'
                            ? 'bg-green-100 text-green-700'
                            : session.status === 'completed'
                            ? 'bg-blue-100 text-blue-700'
                            : session.status === 'cancelled'
                            ? 'bg-red-100 text-red-700'
                            : 'bg-yellow-100 text-yellow-700'
                        }`}
                      >
                        {session.status === 'active'
                          ? 'نشطة'
                          : session.status === 'completed'
                          ? 'مكتملة'
                          : session.status === 'cancelled'
                          ? 'ملغاة'
                          : 'مجدولة'}
                      </span>
                    </div>
                    <div className="flex items-center gap-6 text-sm text-gray-600 mb-4">
                      {session.patients?.phone && (
                        <span className="flex items-center gap-2">
                          <Clock size={16} />
                          {session.patients.phone}
                        </span>
                      )}
                      {session.scheduled_at && (
                        <span className="flex items-center gap-2">
                          <Calendar size={16} />
                          {new Date(session.scheduled_at).toLocaleString('ar-SA')}
                        </span>
                      )}
                    </div>
                    {session.meeting_url && (
                      <div className="mb-4">
                        <a
                          href={session.meeting_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline font-bold text-sm"
                        >
                          رابط الجلسة →
                        </a>
                      </div>
                    )}
                    {session.recording_url && (
                      <div>
                        <a
                          href={session.recording_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline font-bold text-sm"
                        >
                          عرض التسجيل →
                        </a>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  {session.status === 'scheduled' && (
                    <button
                      onClick={() => handleStartSession(session.id)}
                      className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold transition-colors flex items-center gap-2"
                    >
                      <Video size={18} />
                      بدء الجلسة
                    </button>
                  )}
                  {session.status === 'active' && (
                    <button
                      onClick={() => handleEndSession(session.id)}
                      className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold transition-colors flex items-center gap-2"
                    >
                      <VideoOff size={18} />
                      إنهاء الجلسة
                    </button>
                  )}
                  {session.status === 'active' && session.meeting_url && (
                    <a
                      href={session.meeting_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-6 py-3 bg-primary hover:bg-primary-dark text-white rounded-xl font-bold transition-colors flex items-center gap-2"
                    >
                      <Monitor size={18} />
                      الانضمام
                    </a>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

