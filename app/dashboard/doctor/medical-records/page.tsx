'use client'

import { FileText, Search, Filter, Calendar, Download } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

interface MedicalRecord {
  id: string
  patient_id: string
  patient_name: string
  record_type: string
  title: string
  description?: string
  date: string
  doctor_id: string
  attachments?: string[]
}

export default function MedicalRecordsPage() {
  const router = useRouter()
  const [records, setRecords] = useState<MedicalRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState<string>('all')

  useEffect(() => {
    fetchRecords()
  }, [])

  const fetchRecords = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/doctor/medical-records')
      const data = await response.json()
      
      if (data.success && data.data) {
        // Transform the data to include patient names
        const recordsWithPatients = await Promise.all(
          data.data.map(async (record: { id: string; patient_id: string; patients?: { name?: string; [key: string]: unknown }; [key: string]: unknown }) => {
            if (record.patients) {
              return {
                ...record,
                patient_name: record.patients.name || 'غير معروف',
              }
            }
            return record
          })
        )
        setRecords(recordsWithPatients)
      } else {
        console.error('Error fetching medical records:', data.error)
        setRecords([])
      }
    } catch (error) {
      console.error('Error fetching medical records:', error)
      setRecords([])
    } finally {
      setLoading(false)
    }
  }

  const getRecordTypeText = (type: string) => {
    const types: Record<string, string> = {
      visit: 'زيارة',
      diagnosis: 'تشخيص',
      prescription: 'وصفة طبية',
      lab_result: 'نتيجة مختبر',
      imaging: 'تصوير',
      surgery: 'جراحة',
      vaccination: 'تطعيم',
      note: 'ملاحظة',
      referral: 'تحويل'
    }
    return types[type] || type
  }

  const getRecordTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      visit: 'bg-blue-100 text-blue-800',
      diagnosis: 'bg-red-100 text-red-800',
      prescription: 'bg-green-100 text-green-800',
      lab_result: 'bg-purple-100 text-purple-800',
      imaging: 'bg-yellow-100 text-yellow-800',
      surgery: 'bg-orange-100 text-orange-800',
      vaccination: 'bg-teal-100 text-teal-800',
      note: 'bg-gray-100 text-gray-800',
      referral: 'bg-pink-100 text-pink-800'
    }
    return colors[type] || 'bg-gray-100 text-gray-800'
  }

  const filteredRecords = records.filter(record => {
    const matchesSearch = !searchQuery.trim() || 
      record.patient_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      record.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      record.description?.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesType = typeFilter === 'all' || record.record_type === typeFilter
    return matchesSearch && matchesType
  })

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">السجلات الطبية</h1>
        <p className="text-sm text-gray-500 mt-1">إدارة وعرض جميع السجلات الطبية</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="relative">
            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="ابحث عن سجل طبي..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pr-10 pl-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <div className="relative">
            <Filter className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full pr-10 pl-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary appearance-none"
            >
              <option value="all">جميع الأنواع</option>
              <option value="visit">زيارة</option>
              <option value="diagnosis">تشخيص</option>
              <option value="prescription">وصفة طبية</option>
              <option value="lab_result">نتيجة مختبر</option>
              <option value="imaging">تصوير</option>
              <option value="surgery">جراحة</option>
              <option value="vaccination">تطعيم</option>
              <option value="note">ملاحظة</option>
              <option value="referral">تحويل</option>
            </select>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">إجمالي السجلات</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{records.length}</p>
            </div>
            <FileText className="text-primary" size={32} />
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">زيارات</p>
              <p className="text-2xl font-bold text-blue-600 mt-1">
                {records.filter(r => r.record_type === 'visit').length}
              </p>
            </div>
            <Calendar className="text-blue-600" size={32} />
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">تشخيصات</p>
              <p className="text-2xl font-bold text-red-600 mt-1">
                {records.filter(r => r.record_type === 'diagnosis').length}
              </p>
            </div>
            <FileText className="text-red-600" size={32} />
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">هذا الشهر</p>
              <p className="text-2xl font-bold text-green-600 mt-1">
                {records.filter(r => {
                  const created = new Date(r.date)
                  const now = new Date()
                  return created.getMonth() === now.getMonth() && created.getFullYear() === now.getFullYear()
                }).length}
              </p>
            </div>
            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Records List */}
      {loading ? (
        <div className="bg-white rounded-xl p-12 shadow-sm border border-gray-100 text-center">
          <div className="text-gray-400">جاري التحميل...</div>
        </div>
      ) : filteredRecords.length === 0 ? (
        <div className="bg-white rounded-xl p-12 shadow-sm border border-gray-100 text-center">
          <FileText className="mx-auto text-gray-300 mb-4" size={48} />
          <p className="text-gray-500">لا توجد سجلات طبية</p>
          <p className="text-sm text-gray-400 mt-2">سيتم عرض السجلات الطبية هنا عند توفرها</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredRecords.map((record) => (
            <div key={record.id} className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                    <FileText className="text-primary" size={24} />
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">{record.patient_name}</h3>
                    <p className="text-sm text-gray-500">{record.title}</p>
                  </div>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs ${getRecordTypeColor(record.record_type)}`}>
                  {getRecordTypeText(record.record_type)}
                </span>
              </div>
              {record.description && (
                <p className="text-sm text-gray-600 mb-3">{record.description}</p>
              )}
              <div className="flex items-center justify-between">
                <div className="text-xs text-gray-400">
                  {new Date(record.date).toLocaleDateString('ar-SA')}
                </div>
                <div className="flex gap-2">
                  {record.attachments && record.attachments.length > 0 && (
                    <button className="flex items-center gap-1 text-xs text-primary hover:text-primary-dark">
                      <Download size={14} />
                      المرفقات ({record.attachments.length})
                    </button>
                  )}
                  <button
                    onClick={() => router.push(`/dashboard/doctor/patients/${record.patient_id}`)}
                    className="text-xs text-primary hover:text-primary-dark"
                  >
                    عرض التفاصيل
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

