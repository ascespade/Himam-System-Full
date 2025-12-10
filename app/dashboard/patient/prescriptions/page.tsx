'use client'

/**
 * Patient Prescriptions Page
 * View prescription history
 */

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'
import { FileText, Calendar, User, Download, Search, Filter } from 'lucide-react'

interface Prescription {
  id: string
  prescription_number: string
  date: string
  doctor_name: string
  doctor_id?: string
  medications: Array<{
    name: string
    dosage: string
    frequency: string
    instructions?: string
  }>
  notes?: string
  status: 'active' | 'expired' | 'cancelled'
  expiry_date?: string
}

export default function PatientPrescriptionsPage() {
  const router = useRouter()
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'expired' | 'cancelled'>('all')

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const loadPrescriptions = useCallback(async () => {
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

        const presRes = await fetch(`/api/patients/${patientInfo.id}/prescriptions`)
        const presData = await presRes.json()
        if (presData.success) {
          setPrescriptions(presData.data || [])
        }
      }
    } catch (error) {
      console.error('Error loading prescriptions:', error)
    } finally {
      setLoading(false)
    }
  }, [supabase, router])

  useEffect(() => {
    loadPrescriptions()
  }, [loadPrescriptions])

  const filteredPrescriptions = prescriptions.filter((pres) => {
    const matchesSearch =
      !searchTerm ||
      pres.prescription_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pres.doctor_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pres.medications?.some((m) => m.name.toLowerCase().includes(searchTerm.toLowerCase()))

    const matchesStatus = filterStatus === 'all' || pres.status === filterStatus

    return matchesSearch && matchesStatus
  })

  const handleDownload = (prescriptionId: string) => {
    // TODO: Implement prescription download
    console.log('Download prescription:', prescriptionId)
  }

  if (loading) {
    return (
      <div className="p-8">
        <div className="text-center text-gray-500">جاري تحميل الوصفات الطبية...</div>
      </div>
    )
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-extrabold text-gray-900 mb-2">الوصفات الطبية</h1>
        <p className="text-gray-500 text-lg">عرض جميع الوصفات الطبية</p>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search size={20} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="ابحث في الوصفات..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pr-10 pl-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>

          <div className="flex gap-2">
            {(['all', 'active', 'expired', 'cancelled'] as const).map((status) => (
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
                {status === 'active' && 'نشطة'}
                {status === 'expired' && 'منتهية'}
                {status === 'cancelled' && 'ملغاة'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Prescriptions List */}
      {filteredPrescriptions.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
          <FileText size={48} className="mx-auto text-gray-400 mb-4" />
          <div className="text-gray-500 text-lg mb-2">لا توجد وصفات طبية</div>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredPrescriptions.map((prescription) => (
            <div
              key={prescription.id}
              className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <FileText size={20} className="text-primary" />
                    <h3 className="text-xl font-bold text-gray-900">
                      وصفة رقم: {prescription.prescription_number}
                    </h3>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      prescription.status === 'active'
                        ? 'bg-green-100 text-green-700'
                        : prescription.status === 'expired'
                        ? 'bg-red-100 text-red-700'
                        : 'bg-gray-100 text-gray-700'
                    }`}>
                      {prescription.status === 'active' ? 'نشطة' : prescription.status === 'expired' ? 'منتهية' : 'ملغاة'}
                    </span>
                  </div>

                  <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
                    <div className="flex items-center gap-2">
                      <User size={16} className="text-gray-400" />
                      <span>الطبيب: {prescription.doctor_name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar size={16} className="text-gray-400" />
                      <span>{new Date(prescription.date).toLocaleDateString('ar-SA')}</span>
                    </div>
                    {prescription.expiry_date && (
                      <div className="flex items-center gap-2">
                        <Calendar size={16} className="text-gray-400" />
                        <span>ينتهي: {new Date(prescription.expiry_date).toLocaleDateString('ar-SA')}</span>
                      </div>
                    )}
                  </div>
                </div>

                <button
                  onClick={() => handleDownload(prescription.id)}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm text-gray-700 transition-colors"
                >
                  <Download size={16} />
                  تحميل
                </button>
              </div>

              {/* Medications */}
              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <h4 className="text-sm font-medium text-gray-700 mb-3">الأدوية:</h4>
                <div className="space-y-2">
                  {prescription.medications.map((med, index) => (
                    <div key={index} className="flex items-start justify-between text-sm">
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">{med.name}</div>
                        <div className="text-gray-600">
                          {med.dosage} - {med.frequency}
                        </div>
                        {med.instructions && (
                          <div className="text-gray-500 text-xs mt-1">{med.instructions}</div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {prescription.notes && (
                <div className="bg-blue-50 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-1">ملاحظات الطبيب:</h4>
                  <p className="text-sm text-gray-600">{prescription.notes}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
