'use client'

import { Search, UserPlus, Edit, Trash2, Eye, Phone, Calendar, Filter } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

interface Patient {
  id: string
  name: string
  phone: string
  email?: string
  nationality?: string
  status: string
  created_at: string
}

export default function PatientsListPage() {
  const router = useRouter()
  const [patients, setPatients] = useState<Patient[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [total, setTotal] = useState(0)

  const fetchPatients = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (searchTerm) params.append('search', searchTerm)
      if (statusFilter !== 'all') params.append('status', statusFilter)
      params.append('limit', '50')

      const res = await fetch(`/api/reception/patients?${params.toString()}`)
      const data = await res.json()

      if (data.success) {
        setPatients(data.data.patients || [])
        setTotal(data.data.total || 0)
      } else {
        toast.error('فشل تحميل قائمة المرضى')
      }
    } catch (error) {
      console.error('Error fetching patients:', error)
      toast.error('حدث خطأ أثناء تحميل البيانات')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPatients()
  }, [statusFilter])

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchPatients()
    }, 500) // Debounce search
    return () => clearTimeout(timeoutId)
  }, [searchTerm])

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`هل أنت متأكد من حذف المريض "${name}"؟`)) {
      return
    }

    try {
      const res = await fetch(`/api/reception/patients/${id}`, {
        method: 'DELETE'
      })
      const data = await res.json()

      if (data.success) {
        toast.success('تم حذف المريض بنجاح')
        fetchPatients()
      } else {
        toast.error(data.error || 'فشل حذف المريض')
      }
    } catch (error) {
      toast.error('حدث خطأ أثناء الحذف')
    }
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-extrabold text-gray-900 mb-2">قائمة المرضى</h1>
          <p className="text-gray-500 text-lg">إدارة جميع المرضى المسجلين</p>
        </div>
        <button
          onClick={() => router.push('/dashboard/reception/patients/new')}
          className="bg-primary hover:bg-primary-dark text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-colors shadow-lg shadow-primary/20"
        >
          <UserPlus size={20} />
          تسجيل مريض جديد
        </button>
      </div>

      {/* Filters & Search */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="ابحث عن مريض بالاسم أو رقم الهاتف..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pr-12 pl-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter size={20} className="text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              <option value="all">جميع الحالات</option>
              <option value="active">نشط</option>
              <option value="inactive">غير نشط</option>
            </select>
          </div>
        </div>
        <div className="mt-4 text-sm text-gray-500">
          إجمالي المرضى: <span className="font-bold text-gray-900">{total}</span>
        </div>
      </div>

      {/* Patients List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-gray-500">جاري التحميل...</p>
          </div>
        </div>
      ) : patients.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
          <UserPlus className="mx-auto text-gray-300 mb-4" size={48} />
          <h3 className="text-xl font-bold text-gray-900 mb-2">لا توجد مرضى</h3>
          <p className="text-gray-500 mb-6">ابدأ بتسجيل مريض جديد</p>
          <button
            onClick={() => router.push('/dashboard/reception/patients/new')}
            className="bg-primary hover:bg-primary-dark text-white px-6 py-3 rounded-xl font-bold transition-colors"
          >
            تسجيل مريض جديد
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {patients.map((patient) => (
            <div
              key={patient.id}
              className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                    <UserPlus className="text-primary" size={24} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">{patient.name}</h3>
                    <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
                      <Phone size={14} />
                      {patient.phone}
                    </div>
                  </div>
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-bold ${
                    patient.status === 'active'
                      ? 'bg-green-100 text-green-700'
                      : 'bg-gray-100 text-gray-700'
                  }`}
                >
                  {patient.status === 'active' ? 'نشط' : 'غير نشط'}
                </span>
              </div>

              {patient.nationality && (
                <div className="text-sm text-gray-600 mb-3">
                  الجنسية: {patient.nationality}
                </div>
              )}

              <div className="flex items-center gap-2 text-xs text-gray-400 mb-4">
                <Calendar size={12} />
                تاريخ التسجيل: {new Date(patient.created_at).toLocaleDateString('ar-SA')}
              </div>

              <div className="flex gap-2 pt-4 border-t border-gray-100">
                <button
                  onClick={() => router.push(`/dashboard/reception/patients/${patient.id}`)}
                  className="flex-1 bg-primary/10 hover:bg-primary/20 text-primary px-4 py-2 rounded-lg font-bold text-sm transition-colors flex items-center justify-center gap-2"
                >
                  <Eye size={16} />
                  عرض
                </button>
                <button
                  onClick={() => router.push(`/dashboard/reception/patients/${patient.id}?edit=true`)}
                  className="px-4 py-2 border border-gray-200 text-gray-600 rounded-lg font-bold text-sm hover:bg-gray-50 transition-colors"
                >
                  <Edit size={16} />
                </button>
                <button
                  onClick={() => handleDelete(patient.id, patient.name)}
                  className="px-4 py-2 border border-red-200 text-red-600 rounded-lg font-bold text-sm hover:bg-red-50 transition-colors"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
