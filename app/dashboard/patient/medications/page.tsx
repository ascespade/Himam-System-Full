'use client'

/**
 * Patient Medications Page
 * View and manage patient medications
 */

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'
import { Pill, Calendar, Clock, AlertCircle, CheckCircle, Search, Filter } from 'lucide-react'

interface Medication {
  id: string
  name: string
  dosage: string
  frequency: string
  start_date: string
  end_date?: string
  status: 'active' | 'completed' | 'discontinued'
  doctor_name?: string
  instructions?: string
  side_effects?: string
  notes?: string
}

export default function PatientMedicationsPage() {
  const router = useRouter()
  const [medications, setMedications] = useState<Medication[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'completed' | 'discontinued'>('all')

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const loadMedications = useCallback(async () => {
    try {
      setLoading(true)

      // Get current user
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }

      // Load patient info
      const patientRes = await fetch(`/api/patients?user_id=${user.id}`)
      const patientData = await patientRes.json()
      if (patientData.success && patientData.data?.length > 0) {
        const patientInfo = patientData.data[0]

        // Load medications
        const medsRes = await fetch(`/api/patients/${patientInfo.id}/medications`)
        const medsData = await medsRes.json()
        if (medsData.success) {
          setMedications(medsData.data || [])
        }
      }
    } catch (error) {
      console.error('Error loading medications:', error)
    } finally {
      setLoading(false)
    }
  }, [supabase, router])

  useEffect(() => {
    loadMedications()
  }, [loadMedications])

  const filteredMedications = medications.filter((med) => {
    const matchesSearch =
      !searchTerm ||
      med.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      med.dosage?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      med.instructions?.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStatus = filterStatus === 'all' || med.status === filterStatus

    return matchesSearch && matchesStatus
  })

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle size={18} className="text-green-500" />
      case 'completed':
        return <CheckCircle size={18} className="text-blue-500" />
      case 'discontinued':
        return <AlertCircle size={18} className="text-red-500" />
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
      case 'discontinued':
        return 'متوقف'
      default:
        return status
    }
  }

  if (loading) {
    return (
      <div className="p-8">
        <div className="text-center text-gray-500">جاري تحميل الأدوية...</div>
      </div>
    )
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-extrabold text-gray-900 mb-2">الأدوية</h1>
        <p className="text-gray-500 text-lg">عرض وإدارة جميع الأدوية الموصوفة</p>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <Search size={20} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="ابحث في الأدوية..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pr-10 pl-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>

          {/* Status Filter */}
          <div className="flex gap-2">
            {(['all', 'active', 'completed', 'discontinued'] as const).map((status) => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filterStatus === status
                    ? 'bg-primary text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {status === 'all' && 'الكل'}
                {status === 'active' && 'نشط'}
                {status === 'completed' && 'مكتمل'}
                {status === 'discontinued' && 'متوقف'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Medications List */}
      {filteredMedications.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
          <Pill size={48} className="mx-auto text-gray-400 mb-4" />
          <div className="text-gray-500 text-lg mb-2">لا توجد أدوية</div>
          <div className="text-gray-400 text-sm">
            {medications.length === 0
              ? 'لم يتم وصف أي أدوية بعد'
              : 'لم يتم العثور على أدوية تطابق البحث'}
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredMedications.map((medication) => (
            <div
              key={medication.id}
              className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    {getStatusIcon(medication.status)}
                    <h3 className="text-xl font-bold text-gray-900">{medication.name}</h3>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      medication.status === 'active'
                        ? 'bg-green-100 text-green-700'
                        : medication.status === 'completed'
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-red-100 text-red-700'
                    }`}>
                      {getStatusText(medication.status)}
                    </span>
                  </div>

                  {medication.doctor_name && (
                    <div className="text-sm text-gray-600 mb-2">الطبيب: {medication.doctor_name}</div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-gray-600">
                    <Pill size={16} className="text-gray-400" />
                    <span className="text-sm"><strong>الجرعة:</strong> {medication.dosage}</span>
                  </div>

                  <div className="flex items-center gap-2 text-gray-600">
                    <Clock size={16} className="text-gray-400" />
                    <span className="text-sm"><strong>التكرار:</strong> {medication.frequency}</span>
                  </div>

                  <div className="flex items-center gap-2 text-gray-600">
                    <Calendar size={16} className="text-gray-400" />
                    <span className="text-sm">
                      <strong>من:</strong> {new Date(medication.start_date).toLocaleDateString('ar-SA')}
                    </span>
                  </div>

                  {medication.end_date && (
                    <div className="flex items-center gap-2 text-gray-600">
                      <Calendar size={16} className="text-gray-400" />
                      <span className="text-sm">
                        <strong>إلى:</strong> {new Date(medication.end_date).toLocaleDateString('ar-SA')}
                      </span>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  {medication.instructions && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-1">التعليمات:</h4>
                      <p className="text-sm text-gray-600">{medication.instructions}</p>
                    </div>
                  )}

                  {medication.side_effects && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-1">الآثار الجانبية:</h4>
                      <p className="text-sm text-red-600">{medication.side_effects}</p>
                    </div>
                  )}

                  {medication.notes && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-1">ملاحظات:</h4>
                      <p className="text-sm text-gray-600">{medication.notes}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Summary */}
      {medications.length > 0 && (
        <div className="mt-6 bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-gray-600">إجمالي الأدوية:</span>
              <span className="font-bold text-gray-900 mr-2">{medications.length}</span>
            </div>
            <div>
              <span className="text-gray-600">نشطة:</span>
              <span className="font-bold text-green-600 mr-2">
                {medications.filter((m) => m.status === 'active').length}
              </span>
            </div>
            <div>
              <span className="text-gray-600">مكتملة:</span>
              <span className="font-bold text-blue-600 mr-2">
                {medications.filter((m) => m.status === 'completed').length}
              </span>
            </div>
            <div>
              <span className="text-gray-600">متوقفة:</span>
              <span className="font-bold text-red-600 mr-2">
                {medications.filter((m) => m.status === 'discontinued').length}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
