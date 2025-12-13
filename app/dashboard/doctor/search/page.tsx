'use client'

import { Search, Filter, FileText, User, Calendar, Target } from 'lucide-react'
import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'

interface SearchResult {
  type: 'patient' | 'appointment' | 'session' | 'record' | 'treatment_plan'
  id: string
  title: string
  description?: string
  date?: string
  patient_name?: string
}

export default function SearchPage() {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [typeFilter, setTypeFilter] = useState<string>('all')

  const handleSearch = useCallback(async () => {
    if (!searchQuery.trim()) {
      setResults([])
      return
    }

    setLoading(true)
    try {
      const searchType = typeFilter === 'all' ? '' : typeFilter
      const url = `/api/doctor/search?q=${encodeURIComponent(searchQuery)}${searchType ? `&entity_type=${searchType}` : ''}`
      
      const response = await fetch(url)
      const data = await response.json()
      
      if (data.success && data.data) {
        const allResults: SearchResult[] = []
        
        // Transform patients
        if (data.data.patients && data.data.patients.length > 0) {
          data.data.patients.forEach((patient: { id: string; name?: string; phone?: string; created_at?: string }) => {
            allResults.push({
              type: 'patient',
              id: patient.id,
              title: patient.name || 'غير معروف',
              description: `هاتف: ${patient.phone || 'غير متوفر'}`,
              date: patient.created_at,
            })
          })
        }
        
        // Transform sessions
        if (data.data.sessions && data.data.sessions.length > 0) {
          data.data.sessions.forEach((session: { id: string; session_type?: string; date: string; notes?: string }) => {
            allResults.push({
              type: 'session',
              id: session.id,
              title: `${session.session_type || 'جلسة'} - ${new Date(session.date).toLocaleDateString('ar-SA')}`,
              description: session.notes || 'لا توجد ملاحظات',
              date: session.date,
            })
          })
        }
        
        // Transform medical records
        if (data.data.medical_records && data.data.medical_records.length > 0) {
          data.data.medical_records.forEach((record: { id: string; record_type?: string; title?: string; description?: string; notes?: string; created_at?: string; date?: string }) => {
            allResults.push({
              type: 'record',
              id: record.id,
              title: `${record.record_type || 'سجل'} - ${record.title || 'بدون عنوان'}`,
              description: record.description || record.notes || 'لا يوجد وصف',
              date: record.created_at || record.date,
            })
          })
        }
        
        // Transform treatment plans
        if (data.data.treatment_plans && data.data.treatment_plans.length > 0) {
          data.data.treatment_plans.forEach((plan: { id: string; title?: string; description?: string; goals?: string; created_at?: string; start_date?: string }) => {
            allResults.push({
              type: 'treatment_plan',
              id: plan.id,
              title: plan.title || 'خطة علاج',
              description: plan.description || plan.goals || 'لا يوجد وصف',
              date: plan.created_at || plan.start_date,
            })
          })
        }
        
        setResults(allResults)
      } else {
        setResults([])
      }
    } catch (error) {
      console.error('Error searching:', error)
      setResults([])
    } finally {
      setLoading(false)
    }
  }, [searchQuery, typeFilter])

  useEffect(() => {
    if (searchQuery.trim()) {
      const timeout = setTimeout(handleSearch, 500)
      return () => clearTimeout(timeout)
    } else {
      setResults([])
    }
  }, [searchQuery, typeFilter, handleSearch])

  const getResultIcon = (type: string) => {
    switch (type) {
      case 'patient': return User
      case 'appointment': return Calendar
      case 'session': return FileText
      case 'record': return FileText
      case 'treatment_plan': return Target
      default: return FileText
    }
  }

  const getResultTypeText = (type: string) => {
    const types: Record<string, string> = {
      patient: 'مريض',
      appointment: 'موعد',
      session: 'جلسة',
      record: 'سجل طبي',
      treatment_plan: 'خطة علاج'
    }
    return types[type] || type
  }

  const handleResultClick = (result: SearchResult) => {
    switch (result.type) {
      case 'patient':
        router.push(`/dashboard/doctor/patients/${result.id}`)
        break
      case 'appointment':
        router.push(`/dashboard/doctor/appointments`)
        break
      case 'session':
        router.push(`/dashboard/doctor/sessions/${result.id}`)
        break
      case 'record':
        router.push(`/dashboard/doctor/medical-records`)
        break
      case 'treatment_plan':
        router.push(`/dashboard/doctor/treatment-plans/${result.id}`)
        break
    }
  }

  const filteredResults = typeFilter === 'all' 
    ? results 
    : results.filter(r => r.type === typeFilter)

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">البحث المتقدم</h1>
        <p className="text-sm text-gray-500 mt-1">ابحث في جميع البيانات الطبية والمرضى</p>
      </div>

      {/* Search Bar */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={24} />
            <input
              type="text"
              placeholder="ابحث عن مريض، موعد، جلسة، سجل طبي، أو خطة علاج..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pr-12 pl-4 py-4 text-lg border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <div className="flex items-center gap-4">
            <Filter className="text-gray-400" size={20} />
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="all">جميع الأنواع</option>
              <option value="patient">مرضى</option>
              <option value="appointment">مواعيد</option>
              <option value="session">جلسات</option>
              <option value="record">سجلات طبية</option>
              <option value="treatment_plan">خطط علاج</option>
            </select>
          </div>
        </div>
      </div>

      {/* Results */}
      {loading ? (
        <div className="bg-white rounded-xl p-12 shadow-sm border border-gray-100 text-center">
          <div className="text-gray-400">جاري البحث...</div>
        </div>
      ) : searchQuery.trim() && filteredResults.length === 0 ? (
        <div className="bg-white rounded-xl p-12 shadow-sm border border-gray-100 text-center">
          <Search className="mx-auto text-gray-300 mb-4" size={48} />
          <p className="text-gray-500">لا توجد نتائج</p>
          <p className="text-sm text-gray-400 mt-2">جرب مصطلحات بحث مختلفة</p>
        </div>
      ) : !searchQuery.trim() ? (
        <div className="bg-white rounded-xl p-12 shadow-sm border border-gray-100 text-center">
          <Search className="mx-auto text-gray-300 mb-4" size={48} />
          <p className="text-gray-500">ابدأ بالبحث</p>
          <p className="text-sm text-gray-400 mt-2">اكتب في مربع البحث للبدء</p>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="text-sm text-gray-500">
            تم العثور على {filteredResults.length} نتيجة
          </div>
          {filteredResults.map((result) => {
            const Icon = getResultIcon(result.type)
            return (
              <div
                key={`${result.type}-${result.id}`}
                onClick={() => handleResultClick(result)}
                className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow cursor-pointer"
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                    <Icon className="text-primary" size={24} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-medium text-gray-900">{result.title}</h3>
                      <span className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded-full">
                        {getResultTypeText(result.type)}
                      </span>
                    </div>
                    {result.description && (
                      <p className="text-sm text-gray-600 mb-2">{result.description}</p>
                    )}
                    {result.patient_name && (
                      <p className="text-xs text-gray-500">المريض: {result.patient_name}</p>
                    )}
                    {result.date && (
                      <p className="text-xs text-gray-400 mt-1">
                        {new Date(result.date).toLocaleDateString('ar-SA')}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

