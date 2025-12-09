'use client'

import { CheckCircle2, Circle, Plus, Target, TrendingUp } from 'lucide-react'
import { useEffect, useState } from 'react'
<<<<<<< HEAD
import { usePatientContext } from '@/contexts/PatientContext'
import PatientSelector from '@/components/PatientSelector'
=======
import { useSearchParams } from 'next/navigation'
// import { usePatientContext } from '@/contexts/PatientContext' // TODO: Re-implement
// import PatientSelector from '@/components/PatientSelector' // TODO: Re-implement
>>>>>>> cursor/fix-code-errors-and-warnings-8041

interface Goal {
  id: string
  description: string
  target_date?: string
  status: 'pending' | 'in_progress' | 'completed'
  progress: number
}

interface TreatmentPlan {
  id: string
  patient_id: string
  doctor_id: string
  title: string
  description?: string
  goals: Goal[]
  start_date: string
  end_date?: string
  status: string
  progress_percentage: number
  patients?: {
    name: string
    phone: string
  }
}

export default function TreatmentPlansPage() {
<<<<<<< HEAD
  const { currentPatient } = usePatientContext()
=======
  const searchParams = useSearchParams()
  const patientId = searchParams.get('patient_id')
  // const { currentPatient } = usePatientContext() // TODO: Re-implement
  const [currentPatient, setCurrentPatient] = useState<{ id: string; name: string; phone: string } | null>(null)
>>>>>>> cursor/fix-code-errors-and-warnings-8041
  const [plans, setPlans] = useState<TreatmentPlan[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [formData, setFormData] = useState({
<<<<<<< HEAD
    patient_id: '',
=======
    patient_id: patientId || '',
>>>>>>> cursor/fix-code-errors-and-warnings-8041
    title: '',
    description: '',
    start_date: new Date().toISOString().split('T')[0],
    end_date: '',
    goals: [] as Omit<Goal, 'id'>[]
  })

<<<<<<< HEAD
  // Update patient_id when currentPatient changes
  useEffect(() => {
    if (currentPatient) {
      setFormData(prev => ({ ...prev, patient_id: currentPatient.id }))
    }
  }, [currentPatient])
=======
  // Fetch patient if patient_id is provided
  useEffect(() => {
    if (patientId) {
      fetch(`/api/patients/${patientId}`)
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            setCurrentPatient(data.data)
            setFormData(prev => ({ ...prev, patient_id: patientId }))
          }
        })
        .catch(err => console.error('Error fetching patient:', err))
    }
  }, [patientId])
>>>>>>> cursor/fix-code-errors-and-warnings-8041

  useEffect(() => {
    fetchPlans()
  }, [])

  const fetchPlans = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/doctor/treatment-plans')
      const data = await res.json()
      if (data.success) {
        setPlans(data.data || [])
      }
    } catch (error) {
      console.error('Error fetching treatment plans:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddGoal = () => {
    setFormData({
      ...formData,
      goals: [...formData.goals, {
        description: '',
        status: 'pending',
        progress: 0
      }]
    })
  }

  const handleRemoveGoal = (index: number) => {
    setFormData({
      ...formData,
      goals: formData.goals.filter((_, i) => i !== index)
    })
  }

  const handleSave = async () => {
    try {
      if (!currentPatient || !formData.patient_id || !formData.title || formData.goals.length === 0) {
        alert('يرجى اختيار مريض وملء جميع الحقول المطلوبة')
        return
      }

      const res = await fetch('/api/doctor/treatment-plans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          goals: formData.goals.map(g => ({
            description: g.description,
            target_date: g.target_date || null,
            status: g.status,
            progress: g.progress
          }))
        })
      })

      const data = await res.json()
      if (data.success) {
        await fetchPlans()
        setShowAddForm(false)
        setFormData({
          patient_id: '',
          title: '',
          description: '',
          start_date: new Date().toISOString().split('T')[0],
          end_date: '',
          goals: []
        })
      } else {
        alert('فشل في حفظ الخطة: ' + (data.error || 'خطأ غير معروف'))
      }
    } catch (error) {
      console.error('Error saving plan:', error)
      alert('حدث خطأ أثناء حفظ الخطة')
    }
  }

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      'active': 'bg-green-100 text-green-700',
      'completed': 'bg-blue-100 text-blue-700',
      'paused': 'bg-yellow-100 text-yellow-700',
      'cancelled': 'bg-red-100 text-red-700'
    }
    return colors[status] || 'bg-gray-100 text-gray-700'
  }

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      'active': 'نشطة',
      'completed': 'مكتملة',
      'paused': 'متوقفة',
      'cancelled': 'ملغاة'
    }
    return labels[status] || status
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
      <div className="mb-8">
        <h1 className="text-4xl font-extrabold text-gray-900 mb-2">خطط العلاج والتقدم</h1>
        <p className="text-gray-500 text-lg">إدارة خطط العلاج وتتبع تقدم المرضى</p>
      </div>

      <div className="mb-6">
        <button
          onClick={() => setShowAddForm(true)}
          className="flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-lg font-bold hover:bg-primary-dark transition-colors"
        >
          <Plus size={20} />
          خطة علاجية جديدة
        </button>
      </div>

      {showAddForm && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">إنشاء خطة علاجية جديدة</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">المريض *</label>
              {currentPatient ? (
                <div className="bg-primary/5 border border-primary/20 rounded-xl p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center text-white font-bold">
                      {currentPatient.name.charAt(0)}
                    </div>
                    <div>
                      <div className="font-bold text-gray-900">{currentPatient.name}</div>
                      <div className="text-sm text-gray-600">{currentPatient.phone}</div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
<<<<<<< HEAD
                  <PatientSelector />
=======
                  {/* <PatientSelector /> TODO: Re-implement */}
                  <input
                    type="text"
                    placeholder="أدخل معرف المريض أو ابحث..."
                    value={formData.patient_id}
                    onChange={(e) => {
                      setFormData({ ...formData, patient_id: e.target.value })
                      if (e.target.value) {
                        fetch(`/api/patients/${e.target.value}`)
                          .then(res => res.json())
                          .then(data => {
                            if (data.success) {
                              setCurrentPatient(data.data)
                            }
                          })
                          .catch(() => setCurrentPatient(null))
                      } else {
                        setCurrentPatient(null)
                      }
                    }}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
>>>>>>> cursor/fix-code-errors-and-warnings-8041
                  <p className="text-xs text-gray-500">يرجى اختيار مريض لإنشاء خطة علاجية</p>
                </div>
              )}
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">عنوان الخطة</label>
              <input
                type="text"
                placeholder="مثال: خطة علاج النطق - 2024"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">الوصف</label>
              <textarea
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="وصف الخطة العلاجية..."
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">تاريخ البدء</label>
                <input
                  type="date"
                  value={formData.start_date}
                  onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">تاريخ الانتهاء (اختياري)</label>
                <input
                  type="date"
                  value={formData.end_date}
                  onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>
            </div>
            <div>
              <div className="flex justify-between items-center mb-3">
                <label className="block text-sm font-bold text-gray-700">الأهداف العلاجية</label>
                <button
                  onClick={handleAddGoal}
                  className="text-sm text-primary hover:underline font-bold"
                >
                  + إضافة هدف
                </button>
              </div>
              {formData.goals.map((goal, index) => (
                <div key={index} className="mb-3 p-4 border border-gray-200 rounded-lg">
                  <div className="flex justify-between items-start mb-2">
                    <input
                      type="text"
                      placeholder="وصف الهدف"
                      value={goal.description}
                      onChange={(e) => {
                        const newGoals = [...formData.goals]
                        newGoals[index].description = e.target.value
                        setFormData({ ...formData, goals: newGoals })
                      }}
                      className="flex-1 px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent mr-2"
                    />
                    <button
                      onClick={() => handleRemoveGoal(index)}
                      className="text-red-500 hover:text-red-700"
                    >
                      ×
                    </button>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <select
                      value={goal.status}
                      onChange={(e) => {
                        const newGoals = [...formData.goals]
                        newGoals[index].status = e.target.value as any
                        setFormData({ ...formData, goals: newGoals })
                      }}
                      className="px-3 py-2 border border-gray-200 rounded-lg text-sm"
                    >
                      <option value="pending">قيد الانتظار</option>
                      <option value="in_progress">قيد التنفيذ</option>
                      <option value="completed">مكتمل</option>
                    </select>
                    <input
                      type="number"
                      placeholder="التقدم %"
                      value={goal.progress}
                      onChange={(e) => {
                        const newGoals = [...formData.goals]
                        newGoals[index].progress = parseInt(e.target.value) || 0
                        setFormData({ ...formData, goals: newGoals })
                      }}
                      className="px-3 py-2 border border-gray-200 rounded-lg text-sm"
                      min="0"
                      max="100"
                    />
                    <input
                      type="date"
                      placeholder="تاريخ الهدف"
                      value={goal.target_date || ''}
                      onChange={(e) => {
                        const newGoals = [...formData.goals]
                        newGoals[index].target_date = e.target.value
                        setFormData({ ...formData, goals: newGoals })
                      }}
                      className="px-3 py-2 border border-gray-200 rounded-lg text-sm"
                    />
                  </div>
                </div>
              ))}
            </div>
            <div className="flex gap-3 pt-4">
              <button
                onClick={handleSave}
                className="px-6 py-2 bg-primary text-white rounded-lg font-bold hover:bg-primary-dark transition-colors"
              >
                حفظ الخطة
              </button>
              <button
                onClick={() => {
                  setShowAddForm(false)
                  setFormData({
                    patient_id: '',
                    title: '',
                    description: '',
                    start_date: new Date().toISOString().split('T')[0],
                    end_date: '',
                    goals: []
                  })
                }}
                className="px-6 py-2 border border-gray-200 text-gray-600 rounded-lg font-bold hover:bg-gray-50 transition-colors"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {plans.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
            <Target size={48} className="mx-auto mb-4 text-gray-300" />
            <p className="text-gray-500">لا توجد خطط علاجية</p>
          </div>
        ) : (
          plans.map((plan) => (
            <div
              key={plan.id}
              className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-xl font-bold text-gray-900">{plan.title}</h3>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${getStatusColor(plan.status)}`}>
                      {getStatusLabel(plan.status)}
                    </span>
                  </div>
                  <p className="text-gray-600 mb-2">{plan.patients?.name || 'مريض غير معروف'}</p>
                  {plan.description && (
                    <p className="text-sm text-gray-500 mb-3">{plan.description}</p>
                  )}
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <span>من: {new Date(plan.start_date).toLocaleDateString('ar-SA')}</span>
                    {plan.end_date && (
                      <span>إلى: {new Date(plan.end_date).toLocaleDateString('ar-SA')}</span>
                    )}
                    <span className="flex items-center gap-1">
                      <TrendingUp size={14} />
                      التقدم: {plan.progress_percentage}%
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => window.location.href = `/dashboard/doctor/treatment-plans/${plan.id}`}
                  className="px-4 py-2 text-primary hover:bg-primary/10 rounded-lg transition-colors font-bold"
                >
                  عرض التفاصيل
                </button>
              </div>
              <div className="mt-4 pt-4 border-t border-gray-100">
                <h4 className="text-sm font-bold text-gray-700 mb-3">الأهداف:</h4>
                <div className="space-y-2">
                  {plan.goals && plan.goals.length > 0 ? (
                    plan.goals.map((goal, index) => (
                      <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                        {goal.status === 'completed' ? (
                          <CheckCircle2 size={20} className="text-green-600" />
                        ) : (
                          <Circle size={20} className="text-gray-400" />
                        )}
                        <div className="flex-1">
                          <p className="text-sm font-bold text-gray-900">{goal.description}</p>
                          <div className="flex items-center gap-3 mt-1">
                            <span className="text-xs text-gray-500">
                              التقدم: {goal.progress}%
                            </span>
                            {goal.target_date && (
                              <span className="text-xs text-gray-500">
                                الهدف: {new Date(goal.target_date).toLocaleDateString('ar-SA')}
                              </span>
                            )}
                          </div>
                        </div>
                        <span className={`px-2 py-1 rounded text-xs font-bold ${
                          goal.status === 'completed' ? 'bg-green-100 text-green-700' :
                          goal.status === 'in_progress' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-gray-100 text-gray-500'
                        }`}>
                          {goal.status === 'completed' ? 'مكتمل' :
                           goal.status === 'in_progress' ? 'قيد التنفيذ' :
                           'قيد الانتظار'}
                        </span>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-gray-400">لا توجد أهداف محددة</p>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

