'use client'

/**
 * Guardian Patients List
 * List of all patients linked to the guardian
 */

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Users, Phone, Calendar, FileText, ChevronRight } from 'lucide-react'

interface Patient {
  id: string
  name: string
  phone: string
  date_of_birth?: string
  gender?: string
  relationship_type: string
  is_primary: boolean
  permissions: {
    view_records: boolean
    view_appointments: boolean
    approve_procedures: boolean
    view_billing: boolean
  }
}

export default function GuardianPatientsPage() {
  const router = useRouter()
  const [patients, setPatients] = useState<Patient[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    loadPatients()
  }, [])

  const loadPatients = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/guardian/patients')
      const data = await res.json()
      if (data.success) {
        setPatients(data.data || [])
      }
    } catch (error) {
      console.error('Error loading patients:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredPatients = patients.filter((patient) =>
    patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    patient.phone?.includes(searchTerm)
  )

  if (loading) {
    return (
      <div className="p-8">
        <div className="text-center text-gray-500">جاري التحميل...</div>
      </div>
    )
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-4xl font-extrabold text-gray-900">قائمة المرضى</h1>
          <button
            onClick={() => router.push('/dashboard/guardian')}
            className="text-sm text-primary hover:underline"
          >
            ← العودة للوحة التحكم
          </button>
        </div>
        <p className="text-gray-500 text-lg">جميع المرضى المرتبطين بك</p>
      </div>

      {/* Search */}
      <div className="mb-6">
        <input
          type="text"
          placeholder="ابحث عن مريض..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full max-w-md px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>

      {/* Patients Grid */}
      {filteredPatients.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
          <Users size={48} className="mx-auto text-gray-300 mb-4" />
          <div className="text-gray-500">لا توجد مرضى مرتبطين</div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPatients.map((patient) => (
            <div
              key={patient.id}
              className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 cursor-pointer hover:shadow-md transition"
              onClick={() => router.push(`/dashboard/guardian/patients/${patient.id}`)}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{patient.name}</h3>
                  <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                    <Phone size={16} />
                    {patient.phone}
                  </div>
                  {patient.date_of_birth && (
                    <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                      <Calendar size={16} />
                      {new Date(patient.date_of_birth).toLocaleDateString('ar-SA')}
                    </div>
                  )}
                </div>
                {patient.is_primary && (
                  <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">رئيسي</span>
                )}
              </div>

              <div className="border-t border-gray-200 pt-4 mt-4">
                <div className="text-xs text-gray-500 mb-2">نوع العلاقة: {patient.relationship_type}</div>
                <div className="flex flex-wrap gap-2">
                  {patient.permissions.view_records && (
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">عرض السجلات</span>
                  )}
                  {patient.permissions.approve_procedures && (
                    <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded">الموافقات</span>
                  )}
                  {patient.permissions.view_appointments && (
                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">المواعيد</span>
                  )}
                </div>
              </div>

              <div className="mt-4 flex items-center justify-end text-primary text-sm">
                عرض التفاصيل
                <ChevronRight size={16} className="mr-1" />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

