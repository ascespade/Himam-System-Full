'use client'

/**
 * Patients Management Page (Admin)
 * View all users with role 'patient'
 */

import { useState, useEffect } from 'react'
import { User, Phone, Mail, Calendar, Search, Eye, Edit, Plus } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface Patient {
  id: string
  name: string
  email?: string
  phone?: string
  role: string
  created_at: string
  date_of_birth?: string
  gender?: string
}

export default function PatientsPage() {
  const router = useRouter()
  const [patients, setPatients] = useState<Patient[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    fetchPatients()
  }, [])

  const fetchPatients = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/users?role=patient')
      const data = await res.json()
      if (data.success) {
        setPatients(data.data || [])
      }
    } catch (error) {
      const { logError } = await import('@/shared/utils/logger')
      logError('Error fetching patients', error, { endpoint: '/dashboard/patients' })
    } finally {
      setLoading(false)
    }
  }

  const filteredPatients = patients.filter(patient => {
    const matchesSearch = 
      patient.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patient.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patient.phone?.includes(searchTerm)
    
    return matchesSearch
  })

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-extrabold text-gray-900 mb-2">المرضى</h1>
            <p className="text-gray-500 text-lg">عرض وإدارة جميع المرضى</p>
          </div>
          <button className="bg-primary hover:bg-primary-dark text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-all shadow-lg shadow-primary/20">
            <Plus size={20} />
            إضافة مريض
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
        <div className="relative">
          <Search className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="ابحث عن مريض بالاسم أو البريد أو الهاتف..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pr-12 pl-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent"
          />
        </div>
      </div>

      {/* Patients Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full text-center py-12 text-gray-500">
            جاري التحميل...
          </div>
        ) : filteredPatients.length === 0 ? (
          <div className="col-span-full text-center py-12 text-gray-500 bg-white rounded-2xl">
            لا توجد نتائج
          </div>
        ) : (
          filteredPatients.map((patient) => (
            <div key={patient.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-lg transition-all">
              <div className="flex items-start gap-4 mb-4">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center text-primary font-bold text-2xl">
                  {patient.name?.charAt(0) || 'P'}
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-gray-900 mb-1">{patient.name}</h3>
                  <div className="flex items-center gap-2 text-sm text-primary font-bold">
                    <User size={14} />
                    مريض
                  </div>
                </div>
              </div>

              <div className="space-y-2 text-sm text-gray-600 mb-4">
                {patient.email && (
                  <div className="flex items-center gap-2">
                    <Mail size={14} />
                    {patient.email}
                  </div>
                )}
                {patient.phone && (
                  <div className="flex items-center gap-2">
                    <Phone size={14} />
                    {patient.phone}
                  </div>
                )}
                {patient.date_of_birth && (
                  <div className="flex items-center gap-2">
                    <Calendar size={14} />
                    {new Date(patient.date_of_birth).toLocaleDateString('ar-SA')}
                  </div>
                )}
                {patient.gender && (
                  <div className="text-sm text-gray-500">
                    الجنس: {patient.gender === 'male' ? 'ذكر' : patient.gender === 'female' ? 'أنثى' : patient.gender}
                  </div>
                )}
                <div className="text-xs text-gray-400">
                  تاريخ التسجيل: {new Date(patient.created_at).toLocaleDateString('ar-SA')}
                </div>
              </div>

              <div className="flex gap-2 pt-4 border-t border-gray-100">
                <button
                  onClick={() => router.push(`/dashboard/patients/${patient.id}`)}
                  className="flex-1 px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-lg font-bold text-sm transition-colors flex items-center justify-center gap-2"
                >
                  <Eye size={16} />
                  عرض
                </button>
                <button className="px-4 py-2 border border-gray-200 text-gray-600 rounded-lg font-bold text-sm hover:bg-gray-50 transition-colors">
                  <Edit size={16} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
