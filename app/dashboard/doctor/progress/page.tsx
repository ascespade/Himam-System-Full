'use client'

import { TrendingUp, Target, Calendar, Search, BarChart } from 'lucide-react'
import { useEffect, useState } from 'react'

interface ProgressEntry {
  id: string
  patient_id: string
  patient_name: string
  treatment_plan_id?: string
  progress_type: string
  title: string
  description?: string
  progress_value?: number
  progress_level?: string
  created_at: string
}

export default function ProgressPage() {
  const [progressEntries, setProgressEntries] = useState<ProgressEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    fetchProgress()
  }, [])

  useEffect(() => {
    if (searchQuery.trim()) {
      // Filter locally when search query changes
    }
  }, [searchQuery])

  const fetchProgress = async () => {
    try {
      setLoading(true)
      // Get all patients for this doctor first
      const patientsRes = await fetch('/api/doctor/patients')
      const patientsData = await patientsRes.json()
      
      if (!patientsData.success || !patientsData.data || patientsData.data.length === 0) {
        setProgressEntries([])
        return
      }

      // Fetch progress for all patients
      const progressPromises = patientsData.data.map((patient: { id: string; name?: string }) =>
        fetch(`/api/doctor/progress-tracking?patient_id=${patient.id}`)
      )
      
      const progressResponses = await Promise.all(progressPromises)
      const allProgress: ProgressEntry[] = []
      
      for (let i = 0; i < progressResponses.length; i++) {
        const progressData = await progressResponses[i].json()
        if (progressData.success && progressData.data) {
          const patient = patientsData.data[i]
          progressData.data.forEach((entry: Omit<ProgressEntry, 'patient_name'>) => {
            allProgress.push({
              ...entry,
              patient_name: patient.name || 'غير معروف',
            })
          })
        }
      }
      
      setProgressEntries(allProgress)
    } catch (error) {
      console.error('Error fetching progress:', error)
      setProgressEntries([])
    } finally {
      setLoading(false)
    }
  }

  const getProgressColor = (level?: string) => {
    switch (level) {
      case 'excellent': return 'bg-green-100 text-green-800'
      case 'good': return 'bg-blue-100 text-blue-800'
      case 'fair': return 'bg-yellow-100 text-yellow-800'
      case 'poor': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getProgressText = (level?: string) => {
    switch (level) {
      case 'excellent': return 'ممتاز'
      case 'good': return 'جيد'
      case 'fair': return 'متوسط'
      case 'poor': return 'ضعيف'
      default: return 'غير محدد'
    }
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">تتبع التقدم</h1>
        <p className="text-sm text-gray-500 mt-1">مراقبة تقدم المرضى في خطط العلاج</p>
      </div>

      {/* Search */}
      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
        <div className="relative">
          <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="ابحث عن تقدم مريض..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pr-10 pl-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">إجمالي التقدم</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{progressEntries.length}</p>
            </div>
            <TrendingUp className="text-primary" size={32} />
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">ممتاز</p>
              <p className="text-2xl font-bold text-green-600 mt-1">
                {progressEntries.filter(p => p.progress_level === 'excellent').length}
              </p>
            </div>
            <Target className="text-green-600" size={32} />
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">جيد</p>
              <p className="text-2xl font-bold text-blue-600 mt-1">
                {progressEntries.filter(p => p.progress_level === 'good').length}
              </p>
            </div>
            <BarChart className="text-blue-600" size={32} />
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">هذا الشهر</p>
              <p className="text-2xl font-bold text-purple-600 mt-1">
                {progressEntries.filter(p => {
                  const created = new Date(p.created_at)
                  const now = new Date()
                  return created.getMonth() === now.getMonth() && created.getFullYear() === now.getFullYear()
                }).length}
              </p>
            </div>
            <Calendar className="text-purple-600" size={32} />
          </div>
        </div>
      </div>

      {/* Progress List */}
      {loading ? (
        <div className="bg-white rounded-xl p-12 shadow-sm border border-gray-100 text-center">
          <div className="text-gray-400">جاري التحميل...</div>
        </div>
      ) : progressEntries.filter(entry => 
        !searchQuery.trim() || 
        entry.patient_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        entry.title?.toLowerCase().includes(searchQuery.toLowerCase())
      ).length === 0 ? (
        <div className="bg-white rounded-xl p-12 shadow-sm border border-gray-100 text-center">
          <TrendingUp className="mx-auto text-gray-300 mb-4" size={48} />
          <p className="text-gray-500">لا توجد سجلات تقدم</p>
          <p className="text-sm text-gray-400 mt-2">سيتم عرض تقدم المرضى هنا عند توفرها</p>
        </div>
      ) : (
        <div className="space-y-4">
          {progressEntries.filter(entry => 
            !searchQuery.trim() || 
            entry.patient_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            entry.title?.toLowerCase().includes(searchQuery.toLowerCase())
          ).map((entry) => (
            <div key={entry.id} className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                    <TrendingUp className="text-primary" size={24} />
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">{entry.patient_name}</h3>
                    <p className="text-sm text-gray-500">{entry.title}</p>
                  </div>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs ${getProgressColor(entry.progress_level)}`}>
                  {getProgressText(entry.progress_level)}
                </span>
              </div>
              {entry.description && (
                <p className="text-sm text-gray-600 mb-3">{entry.description}</p>
              )}
              {entry.progress_value !== undefined && (
                <div className="mb-3">
                  <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                    <span>القيمة</span>
                    <span>{entry.progress_value}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-primary h-2 rounded-full transition-all"
                      style={{ width: `${entry.progress_value}%` }}
                    ></div>
                  </div>
                </div>
              )}
              <div className="text-xs text-gray-400">
                {new Date(entry.created_at).toLocaleDateString('ar-SA')}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

