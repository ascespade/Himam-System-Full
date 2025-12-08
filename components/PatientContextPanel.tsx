'use client'

/**
 * Patient Context Panel
 * لوحة معلومات المريض الحالي
 * تظهر دائماً في أعلى الصفحة عندما يكون هناك مريض مختار
 */

import { Calendar, Phone, AlertCircle, Target, Activity, FileText, MessageSquare, X } from 'lucide-react'
import { usePatientContext } from '@/contexts/PatientContext'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

export default function PatientContextPanel() {
  const { currentPatient, clearPatient } = usePatientContext()
  const router = useRouter()
  const [quickStats, setQuickStats] = useState<any>(null)

  useEffect(() => {
    if (currentPatient) {
      fetchQuickStats()
    }
  }, [currentPatient])

  const fetchQuickStats = async () => {
    if (!currentPatient) return
    try {
      const res = await fetch(`/api/doctor/patients/${currentPatient.id}/quick-stats`)
      const data = await res.json()
      if (data.success) {
        setQuickStats(data.data)
      }
    } catch (error) {
      console.error('Error fetching quick stats:', error)
    }
  }

  if (!currentPatient) return null

  return (
    <div className="bg-gradient-to-r from-primary/10 to-blue-50 border-r-4 border-primary rounded-xl p-6 mb-6 shadow-sm">
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4 flex-1">
          <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center text-white font-bold text-2xl shrink-0">
            {currentPatient.name.charAt(0)}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h2 className="text-2xl font-bold text-gray-900">{currentPatient.name}</h2>
              {(currentPatient.active_treatment_plans || 0) > 0 && (
                <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold flex items-center gap-1">
                  <Target size={14} />
                  {currentPatient.active_treatment_plans} خطة نشطة
                </span>
              )}
            </div>
            <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
              <span className="flex items-center gap-1">
                <Phone size={14} />
                {currentPatient.phone}
              </span>
              {currentPatient.date_of_birth && (
                <span className="flex items-center gap-1">
                  <Calendar size={14} />
                  {new Date(currentPatient.date_of_birth).toLocaleDateString('ar-SA')}
                </span>
              )}
              {currentPatient.gender && (
                <span>{currentPatient.gender}</span>
              )}
            </div>
            {currentPatient.allergies && currentPatient.allergies.length > 0 && (
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle size={16} className="text-red-500" />
                <span className="text-xs text-red-600 font-bold">حساسيات:</span>
                <div className="flex flex-wrap gap-1">
                  {currentPatient.allergies.map((allergy, idx) => (
                    <span key={idx} className="px-2 py-0.5 bg-red-50 text-red-700 rounded text-xs">
                      {allergy}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {quickStats && (
              <div className="flex items-center gap-4 mt-3 pt-3 border-t border-primary/20">
                {quickStats.total_sessions > 0 && (
                  <div className="flex items-center gap-1 text-sm">
                    <Activity size={14} className="text-blue-600" />
                    <span className="font-bold text-gray-700">{quickStats.total_sessions}</span>
                    <span className="text-gray-500">جلسة</span>
                  </div>
                )}
                {quickStats.next_appointment && (
                  <div className="flex items-center gap-1 text-sm">
                    <Calendar size={14} className="text-green-600" />
                    <span className="text-gray-500">الموعد القادم:</span>
                    <span className="font-bold text-gray-700">
                      {new Date(quickStats.next_appointment).toLocaleDateString('ar-SA')}
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => router.push(`/dashboard/doctor/patients/${currentPatient.id}`)}
            className="px-4 py-2 bg-white hover:bg-gray-50 text-primary border border-primary rounded-lg font-bold text-sm transition-colors flex items-center gap-2"
          >
            <FileText size={16} />
            الملف الكامل
          </button>
          <button
            onClick={() => router.push(`/dashboard/doctor/chat?patient=${currentPatient.id}`)}
            className="px-4 py-2 bg-white hover:bg-gray-50 text-blue-600 border border-blue-200 rounded-lg font-bold text-sm transition-colors flex items-center gap-2"
          >
            <MessageSquare size={16} />
            محادثة
          </button>
          <button
            onClick={clearPatient}
            className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
            title="إلغاء اختيار المريض"
          >
            <X size={20} />
          </button>
        </div>
      </div>
    </div>
  )
}

