'use client'

/**
 * Patient Medical Records Page
 * View patient medical records and history
 */

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'
import { FileText, Calendar, User, Download, Search } from 'lucide-react'

interface MedicalRecord {
  id: string
  record_type: string
  date: string
  doctor_name?: string
  doctor_id?: string
  diagnosis?: string
  treatment?: string
  notes?: string
  attachments?: Array<{ id: string; name: string; url: string }>
}

export default function PatientRecordsPage() {
  const router = useRouter()
  const [records, setRecords] = useState<MedicalRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState<string>('all')

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  useEffect(() => {
    loadRecords()
  }, [])

  const loadRecords = async () => {
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

        // Load medical file
        const fileRes = await fetch(`/api/patients/${patientInfo.id}/medical-file`)
        const fileData = await fileRes.json()
        if (fileData.success && fileData.data) {
          setRecords(fileData.data.medical_records || [])
        }
      }
    } catch (error) {
      console.error('Error loading records:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredRecords = records.filter((record) => {
    const matchesSearch =
      !searchTerm ||
      record.record_type?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.diagnosis?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.treatment?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.notes?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.doctor_name?.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesType = filterType === 'all' || record.record_type === filterType

    return matchesSearch && matchesType
  })

  const recordTypes = Array.from(new Set(records.map((r) => r.record_type).filter(Boolean)))

  if (loading) {
    return (
      <div className="p-8">
        <div className="text-center text-gray-500">جاري تحميل السجلات الطبية...</div>
      </div>
    )
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-extrabold text-gray-900 mb-2">السجلات الطبية</h1>
        <p className="text-gray-500 text-lg">عرض جميع السجلات الطبية والتاريخ المرضي</p>
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
                placeholder="ابحث في السجلات..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pr-10 pl-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>

          {/* Type Filter */}
          <div className="md:w-64">
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="all">جميع الأنواع</option>
              {recordTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Records List */}
      {filteredRecords.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
          <FileText size={48} className="mx-auto text-gray-400 mb-4" />
          <div className="text-gray-500 text-lg mb-2">لا توجد سجلات طبية</div>
          <div className="text-gray-400 text-sm">
            {records.length === 0
              ? 'لم يتم إنشاء أي سجلات طبية بعد'
              : 'لم يتم العثور على سجلات تطابق البحث'}
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredRecords.map((record) => (
            <div
              key={record.id}
              className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <FileText size={20} className="text-primary" />
                    <h3 className="text-xl font-bold text-gray-900">{record.record_type}</h3>
                  </div>

                  {record.doctor_name && (
                    <div className="flex items-center gap-2 text-gray-600 mb-2">
                      <User size={16} className="text-gray-400" />
                      <span className="text-sm">الطبيب: {record.doctor_name}</span>
                    </div>
                  )}

                  <div className="flex items-center gap-2 text-gray-500 text-sm">
                    <Calendar size={16} className="text-gray-400" />
                    <span>
                      {new Date(record.date).toLocaleDateString('ar-SA', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-3 mt-4">
                {record.diagnosis && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-1">التشخيص:</h4>
                    <p className="text-gray-600">{record.diagnosis}</p>
                  </div>
                )}

                {record.treatment && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-1">العلاج:</h4>
                    <p className="text-gray-600">{record.treatment}</p>
                  </div>
                )}

                {record.notes && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-1">ملاحظات:</h4>
                    <p className="text-gray-600">{record.notes}</p>
                  </div>
                )}

                {record.attachments && record.attachments.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">المرفقات:</h4>
                    <div className="flex flex-wrap gap-2">
                      {record.attachments.map((attachment) => (
                        <a
                          key={attachment.id}
                          href={attachment.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg hover:bg-gray-100 transition text-sm text-gray-700"
                        >
                          <Download size={16} />
                          <span>{attachment.name}</span>
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Summary */}
      {records.length > 0 && (
        <div className="mt-6 bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="text-sm text-gray-600">
            <span className="font-medium">إجمالي السجلات:</span> {records.length} سجل
          </div>
        </div>
      )}
    </div>
  )
}
