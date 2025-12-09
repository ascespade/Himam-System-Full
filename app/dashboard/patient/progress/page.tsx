'use client'

/**
 * Patient Progress Tracking Page
 * Track treatment progress and milestones
 */

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'
import { TrendingUp, Calendar, Target, CheckCircle, Clock, BarChart } from 'lucide-react'

interface ProgressEntry {
  id: string
  date: string
  category: string
  metric: string
  value: number
  previous_value?: number
  trend?: 'up' | 'down' | 'stable'
  notes?: string
}

interface Milestone {
  id: string
  title: string
  date: string
  status: 'achieved' | 'pending'
  description?: string
}

export default function PatientProgressPage() {
  const router = useRouter()
  const [progressEntries, setProgressEntries] = useState<ProgressEntry[]>([])
  const [milestones, setMilestones] = useState<Milestone[]>([])
  const [loading, setLoading] = useState(true)

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  useEffect(() => {
    loadProgress()
  }, [])

  const loadProgress = async () => {
    try {
      setLoading(true)

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }

      const patientRes = await fetch(`/api/patients?user_id=${user.id}`)
      const patientData = await patientRes.json()
      if (patientData.success && patientData.data?.length > 0) {
        const patientInfo = patientData.data[0]

        const [progressRes, milestonesRes] = await Promise.all([
          fetch(`/api/patients/${patientInfo.id}/progress`),
          fetch(`/api/patients/${patientInfo.id}/milestones`),
        ])

        const progressData = await progressRes.json()
        const milestonesData = await milestonesRes.json()

        if (progressData.success) {
          setProgressEntries(progressData.data || [])
        }
        if (milestonesData.success) {
          setMilestones(milestonesData.data || [])
        }
      }
    } catch (error) {
      console.error('Error loading progress:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="p-8">
        <div className="text-center text-gray-500">جاري تحميل التقدم...</div>
      </div>
    )
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-extrabold text-gray-900 mb-2">تتبع التقدم</h1>
        <p className="text-gray-500 text-lg">متابعة تقدم العلاج والإنجازات</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Progress Entries */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <BarChart size={24} />
            المقاييس
          </h2>

          {progressEntries.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
              <TrendingUp size={48} className="mx-auto text-gray-400 mb-4" />
              <div className="text-gray-500">لا توجد بيانات تقدم</div>
            </div>
          ) : (
            <div className="space-y-4">
              {progressEntries.map((entry) => (
                <div
                  key={entry.id}
                  className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-bold text-gray-900">{entry.metric}</h3>
                      <p className="text-sm text-gray-500">{entry.category}</p>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-primary">{entry.value}</div>
                      {entry.previous_value && entry.trend && (
                        <div
                          className={`text-xs flex items-center gap-1 ${
                            entry.trend === 'up'
                              ? 'text-green-600'
                              : entry.trend === 'down'
                              ? 'text-red-600'
                              : 'text-gray-600'
                          }`}
                        >
                          {entry.trend === 'up' && '↑'}
                          {entry.trend === 'down' && '↓'}
                          {entry.trend === 'stable' && '→'}
                          {Math.abs(entry.value - entry.previous_value)}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Calendar size={16} className="text-gray-400" />
                    <span>{new Date(entry.date).toLocaleDateString('ar-SA')}</span>
                  </div>

                  {entry.notes && (
                    <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-600">{entry.notes}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Milestones */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Target size={24} />
            الإنجازات
          </h2>

          {milestones.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
              <Target size={48} className="mx-auto text-gray-400 mb-4" />
              <div className="text-gray-500">لا توجد إنجازات</div>
            </div>
          ) : (
            <div className="space-y-4">
              {milestones.map((milestone) => (
                <div
                  key={milestone.id}
                  className={`bg-white rounded-2xl shadow-sm border p-6 ${
                    milestone.status === 'achieved'
                      ? 'border-green-200 bg-green-50'
                      : 'border-gray-100'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {milestone.status === 'achieved' ? (
                      <CheckCircle size={24} className="text-green-500" />
                    ) : (
                      <Clock size={24} className="text-gray-400" />
                    )}
                    <div className="flex-1">
                      <h3 className="font-bold text-gray-900 mb-1">{milestone.title}</h3>
                      {milestone.description && (
                        <p className="text-sm text-gray-600 mb-2">{milestone.description}</p>
                      )}
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <Calendar size={16} />
                        <span>{new Date(milestone.date).toLocaleDateString('ar-SA')}</span>
                      </div>
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${
                        milestone.status === 'achieved'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {milestone.status === 'achieved' ? 'محقق' : 'قيد الانتظار'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
