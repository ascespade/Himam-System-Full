'use client'

/**
 * Patient Treatment Plans Page
 * View treatment plans and progress
 */

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'
import { Target, Calendar, User, TrendingUp, CheckCircle, Clock, AlertCircle } from 'lucide-react'

interface TreatmentPlan {
  id: string
  title: string
  description: string
  start_date: string
  end_date?: string
  doctor_name: string
  status: 'active' | 'completed' | 'paused'
  goals: Array<{
    id: string
    description: string
    status: 'pending' | 'in_progress' | 'completed'
    target_date?: string
  }>
  sessions_count?: number
  completed_sessions?: number
  progress_percentage?: number
}

export default function PatientTreatmentPlansPage() {
  const router = useRouter()
  const [plans, setPlans] = useState<TreatmentPlan[]>([])
  const [loading, setLoading] = useState(true)

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const loadTreatmentPlans = useCallback(async () => {
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

        const plansRes = await fetch(`/api/patients/${patientInfo.id}/treatment-plans`)
        const plansData = await plansRes.json()
        if (plansData.success) {
          setPlans(plansData.data || [])
        }
      }
    } catch (error) {
      console.error('Error loading treatment plans:', error)
    } finally {
      setLoading(false)
    }
  }, [supabase, router])

  useEffect(() => {
    loadTreatmentPlans()
  }, [loadTreatmentPlans])

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <TrendingUp size={18} className="text-green-500" />
      case 'completed':
        return <CheckCircle size={18} className="text-blue-500" />
      case 'paused':
        return <Clock size={18} className="text-yellow-500" />
      default:
        return <AlertCircle size={18} className="text-gray-400" />
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active':
        return 'نشط'
      case 'completed':
        return 'مكتمل'
      case 'paused':
        return 'متوقف مؤقتاً'
      default:
        return status
    }
  }

  if (loading) {
    return (
      <div className="p-8">
        <div className="text-center text-gray-500">جاري تحميل خطط العلاج...</div>
      </div>
    )
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-extrabold text-gray-900 mb-2">خطط العلاج</h1>
        <p className="text-gray-500 text-lg">عرض ومتابعة خطط العلاج المخصصة</p>
      </div>

      {/* Treatment Plans List */}
      {plans.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
          <Target size={48} className="mx-auto text-gray-400 mb-4" />
          <div className="text-gray-500 text-lg mb-2">لا توجد خطط علاج</div>
          <div className="text-gray-400 text-sm">لم يتم إنشاء أي خطط علاج بعد</div>
        </div>
      ) : (
        <div className="space-y-6">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    {getStatusIcon(plan.status)}
                    <h3 className="text-xl font-bold text-gray-900">{plan.title}</h3>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      plan.status === 'active'
                        ? 'bg-green-100 text-green-700'
                        : plan.status === 'completed'
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-yellow-100 text-yellow-700'
                    }`}>
                      {getStatusText(plan.status)}
                    </span>
                  </div>

                  <p className="text-gray-600 mb-4">{plan.description}</p>

                  <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
                    <div className="flex items-center gap-2">
                      <User size={16} className="text-gray-400" />
                      <span>الطبيب: {plan.doctor_name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar size={16} className="text-gray-400" />
                      <span>من: {new Date(plan.start_date).toLocaleDateString('ar-SA')}</span>
                    </div>
                    {plan.end_date && (
                      <div className="flex items-center gap-2">
                        <Calendar size={16} className="text-gray-400" />
                        <span>إلى: {new Date(plan.end_date).toLocaleDateString('ar-SA')}</span>
                      </div>
                    )}
                  </div>

                  {/* Progress Bar */}
                  {plan.progress_percentage !== undefined && (
                    <div className="mb-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-700">التقدم</span>
                        <span className="text-sm font-bold text-primary">{plan.progress_percentage}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-3">
                        <div
                          className="bg-primary h-3 rounded-full transition-all"
                          style={{ width: `${plan.progress_percentage}%` }}
                        />
                      </div>
                      {plan.sessions_count && (
                        <div className="text-xs text-gray-500 mt-1">
                          {plan.completed_sessions || 0} / {plan.sessions_count} جلسة
                        </div>
                      )}
                    </div>
                  )}

                  {/* Goals */}
                  {plan.goals && plan.goals.length > 0 && (
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h4 className="text-sm font-medium text-gray-700 mb-3">الأهداف:</h4>
                      <div className="space-y-2">
                        {plan.goals.map((goal) => (
                          <div
                            key={goal.id}
                            className={`flex items-start gap-2 p-2 rounded ${
                              goal.status === 'completed'
                                ? 'bg-green-50'
                                : goal.status === 'in_progress'
                                ? 'bg-blue-50'
                                : 'bg-white'
                            }`}
                          >
                            {goal.status === 'completed' ? (
                              <CheckCircle size={16} className="text-green-500 mt-0.5" />
                            ) : goal.status === 'in_progress' ? (
                              <Clock size={16} className="text-blue-500 mt-0.5" />
                            ) : (
                              <AlertCircle size={16} className="text-gray-400 mt-0.5" />
                            )}
                            <div className="flex-1">
                              <div className="text-sm text-gray-900">{goal.description}</div>
                              {goal.target_date && (
                                <div className="text-xs text-gray-500 mt-1">
                                  الهدف: {new Date(goal.target_date).toLocaleDateString('ar-SA')}
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
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
