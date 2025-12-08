'use client'

/**
 * Smart Patient Selector
 * محرك بحث ذكي لاختيار المريض
 * - بحث فوري بالاسم/الهاتف
 * - قائمة المرضى الأخيرة
 * - قائمة المرضى النشطين
 * - Quick Access للمرضى المفضلين
 */

import { Search, Clock, User, X, Star, Phone, Calendar } from 'lucide-react'
import { useState, useEffect, useRef } from 'react'
import { usePatientContext } from '@/contexts/PatientContext'

export default function PatientSelector() {
  const {
    currentPatient,
    setCurrentPatient,
    recentPatients,
    activePatients,
    searchPatients,
    clearPatient,
    isLoading
  } = usePatientContext()

  const [searchTerm, setSearchTerm] = useState('')
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [showDropdown, setShowDropdown] = useState(false)
  const [showQuickAccess, setShowQuickAccess] = useState(false)
  const searchTimeoutRef = useRef<NodeJS.Timeout>()
  const containerRef = useRef<HTMLDivElement>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowDropdown(false)
        setShowQuickAccess(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Search with debounce
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
    }

    if (searchTerm.length >= 2) {
      searchTimeoutRef.current = setTimeout(async () => {
        const results = await searchPatients(searchTerm)
        setSearchResults(results)
        setShowDropdown(true)
      }, 300)
    } else {
      setSearchResults([])
      setShowDropdown(false)
    }

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current)
      }
    }
  }, [searchTerm, searchPatients])

  const handleSelectPatient = (patient: any) => {
    setCurrentPatient(patient)
    setSearchTerm('')
    setShowDropdown(false)
    setShowQuickAccess(false)
  }

  const displayPatients = searchTerm.length >= 2 ? searchResults : 
                         showQuickAccess ? [...activePatients, ...recentPatients].slice(0, 10) : []

  return (
    <div ref={containerRef} className="relative">
      {/* Current Patient Display */}
      {currentPatient ? (
        <div className="bg-primary/10 border-2 border-primary rounded-xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-3 flex-1">
            <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center text-white font-bold text-lg">
              {currentPatient.name.charAt(0)}
            </div>
            <div className="flex-1">
              <div className="font-bold text-gray-900 text-lg">{currentPatient.name}</div>
              <div className="text-sm text-gray-600 flex items-center gap-3 mt-1">
                <span className="flex items-center gap-1">
                  <Phone size={14} />
                  {currentPatient.phone}
                </span>
                {currentPatient.last_visit && (
                  <span className="flex items-center gap-1">
                    <Calendar size={14} />
                    آخر زيارة: {new Date(currentPatient.last_visit).toLocaleDateString('ar-SA')}
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowQuickAccess(!showQuickAccess)}
              className="px-3 py-2 text-primary hover:bg-primary/10 rounded-lg transition-colors font-bold text-sm"
            >
              تغيير المريض
            </button>
            <button
              onClick={clearPatient}
              className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
              title="إلغاء اختيار المريض"
            >
              <X size={18} />
            </button>
          </div>
        </div>
      ) : (
        <div className="relative">
          <div className="relative">
            <Search className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="ابحث عن مريض بالاسم أو رقم الهاتف..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onFocus={() => {
                if (searchTerm.length < 2) {
                  setShowQuickAccess(true)
                }
              }}
              className="w-full pr-12 pl-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary transition-all"
              dir="rtl"
            />
          </div>

          {/* Quick Access Button */}
          {!showQuickAccess && (
            <button
              onClick={() => setShowQuickAccess(true)}
              className="absolute left-2 top-1/2 transform -translate-y-1/2 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-bold text-gray-700 transition-colors"
            >
              <Clock size={16} className="inline ml-1" />
              سريع
            </button>
          )}
        </div>
      )}

      {/* Dropdown / Quick Access Panel */}
      {(showDropdown || showQuickAccess) && displayPatients.length > 0 && (
        <div className="absolute z-50 w-full mt-2 bg-white rounded-xl shadow-xl border border-gray-200 max-h-96 overflow-y-auto">
          {/* Quick Access Header */}
          {showQuickAccess && searchTerm.length < 2 && (
            <div className="p-3 border-b border-gray-100 bg-gray-50">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-bold text-gray-700">الوصول السريع</span>
                <button
                  onClick={() => setShowQuickAccess(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X size={16} />
                </button>
              </div>
              {activePatients.length > 0 && (
                <div className="text-xs text-gray-500 mb-2">المرضى النشطين ({activePatients.length})</div>
              )}
            </div>
          )}

          {/* Patient List */}
          <div className="py-2">
            {displayPatients.map((patient) => (
              <div
                key={patient.id}
                onClick={() => handleSelectPatient(patient)}
                className="px-4 py-3 hover:bg-primary/5 cursor-pointer transition-colors border-b border-gray-50 last:border-0"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center text-primary font-bold shrink-0">
                    {patient.name.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-gray-900 truncate">{patient.name}</div>
                    <div className="text-sm text-gray-500 flex items-center gap-2 mt-0.5">
                      <Phone size={12} />
                      {patient.phone}
                      {patient.last_visit && (
                        <>
                          <span className="text-gray-300">•</span>
                          <span className="text-xs">آخر زيارة: {new Date(patient.last_visit).toLocaleDateString('ar-SA')}</span>
                        </>
                      )}
                    </div>
                  </div>
                  {patient.active_treatment_plans > 0 && (
                    <div className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-bold">
                      {patient.active_treatment_plans} خطة
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Empty State */}
          {displayPatients.length === 0 && !isLoading && (
            <div className="p-8 text-center text-gray-400">
              <User size={32} className="mx-auto mb-2 opacity-50" />
              <p className="text-sm">لا توجد نتائج</p>
            </div>
          )}

          {/* Loading State */}
          {isLoading && (
            <div className="p-8 text-center text-gray-400">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="text-sm mt-2">جاري البحث...</p>
            </div>
          )}
        </div>
      )}

      {/* Recent Patients Quick List (when no search) */}
      {!currentPatient && !showQuickAccess && searchTerm.length < 2 && recentPatients.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-2">
          <span className="text-xs text-gray-500 self-center">الأخيرة:</span>
          {recentPatients.slice(0, 5).map((patient) => (
            <button
              key={patient.id}
              onClick={() => handleSelectPatient(patient)}
              className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-bold text-gray-700 transition-colors flex items-center gap-1"
            >
              <User size={14} />
              {patient.name}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

