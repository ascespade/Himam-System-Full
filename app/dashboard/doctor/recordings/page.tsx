'use client'

import { Mic, Play, Download, Calendar, Search } from 'lucide-react'
import { useEffect, useState } from 'react'

interface Recording {
  id: string
  session_id: string
  patient_name: string
  recording_url: string
  duration: number
  created_at: string
  status: string
}

export default function RecordingsPage() {
  const [recordings, setRecordings] = useState<Recording[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    fetchRecordings()
  }, [])

  const fetchRecordings = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/doctor/recordings')
      const data = await response.json()
      
      if (data.success && data.data) {
        // Transform the data to match the interface
        const transformedRecordings = data.data
          .filter((rec: { recording_url?: string; recording_status?: string }) => rec.recording_url || rec.recording_status) // Only show recordings with URLs
          .map((rec: { id: string; session_id: string; patients?: { name?: string }; recording_url?: string; duration?: number; recording_duration?: number; created_at?: string; recorded_at?: string; recording_status?: string }) => ({
            id: rec.id,
            session_id: rec.session_id,
            patient_name: rec.patients?.name || 'غير معروف',
            recording_url: rec.recording_url || '',
            duration: rec.duration || rec.recording_duration || 0,
            created_at: rec.created_at || rec.recorded_at || new Date().toISOString(),
            status: rec.recording_status || 'completed',
          }))
        setRecordings(transformedRecordings)
      } else {
        console.error('Error fetching recordings:', data.error)
        setRecordings([])
      }
    } catch (error) {
      console.error('Error fetching recordings:', error)
      setRecordings([])
    } finally {
      setLoading(false)
    }
  }

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">التسجيلات</h1>
        <p className="text-sm text-gray-500 mt-1">إدارة وعرض جميع تسجيلات الجلسات</p>
      </div>

      {/* Search */}
      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
        <div className="relative">
          <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="ابحث عن تسجيل..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pr-10 pl-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">إجمالي التسجيلات</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{recordings.length}</p>
            </div>
            <Mic className="text-primary" size={32} />
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">إجمالي المدة</p>
              <p className="text-2xl font-bold text-blue-600 mt-1">
                {formatDuration(recordings.reduce((acc, r) => acc + (r.duration || 0), 0))}
              </p>
            </div>
            <Calendar className="text-blue-600" size={32} />
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">هذا الشهر</p>
              <p className="text-2xl font-bold text-green-600 mt-1">
                {recordings.filter(r => {
                  const created = new Date(r.created_at)
                  const now = new Date()
                  return created.getMonth() === now.getMonth() && created.getFullYear() === now.getFullYear()
                }).length}
              </p>
            </div>
            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Recordings List */}
      {loading ? (
        <div className="bg-white rounded-xl p-12 shadow-sm border border-gray-100 text-center">
          <div className="text-gray-400">جاري التحميل...</div>
        </div>
      ) : recordings.filter(r => 
        !searchQuery.trim() || 
        r.patient_name?.toLowerCase().includes(searchQuery.toLowerCase())
      ).length === 0 ? (
        <div className="bg-white rounded-xl p-12 shadow-sm border border-gray-100 text-center">
          <Mic className="mx-auto text-gray-300 mb-4" size={48} />
          <p className="text-gray-500">لا توجد تسجيلات</p>
          <p className="text-sm text-gray-400 mt-2">سيتم عرض التسجيلات هنا عند توفرها</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {recordings.filter(r => 
            !searchQuery.trim() || 
            r.patient_name?.toLowerCase().includes(searchQuery.toLowerCase())
          ).map((recording) => (
            <div key={recording.id} className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                    <Mic className="text-primary" size={24} />
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">{recording.patient_name}</h3>
                    <p className="text-xs text-gray-500">{new Date(recording.created_at).toLocaleDateString('ar-SA')}</p>
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between text-sm text-gray-600 mb-4">
                <span>المدة: {formatDuration(recording.duration)}</span>
                <span className={`px-2 py-1 rounded-full text-xs ${
                  recording.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {recording.status === 'completed' ? 'مكتمل' : 'قيد المعالجة'}
                </span>
              </div>
              <div className="flex gap-2">
                {recording.recording_url && (
                  <button 
                    onClick={() => window.open(recording.recording_url, '_blank')}
                    className="flex-1 flex items-center justify-center gap-2 bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary-dark transition-colors"
                  >
                    <Play size={16} />
                    تشغيل
                  </button>
                )}
                {recording.recording_url && (
                  <button 
                    onClick={() => {
                      const link = document.createElement('a')
                      link.href = recording.recording_url
                      link.download = `recording-${recording.id}.mp4`
                      link.click()
                    }}
                    className="flex items-center justify-center gap-2 border border-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <Download size={16} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

