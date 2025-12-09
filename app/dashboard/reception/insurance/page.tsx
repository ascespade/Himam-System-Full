'use client'

/**
 * Reception Insurance Management Page
 * Manage patient insurance information and claims
 */

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Shield, Search, Filter, Plus, CheckCircle, XCircle, Clock, AlertCircle } from 'lucide-react'

interface InsuranceInfo {
  id: string
  patient_id: string
  patient_name: string
  insurance_provider: string
  insurance_number: string
  policy_number?: string
  member_id?: string
  coverage_percentage?: number
  effective_date?: string
  expiry_date?: string
  status: 'active' | 'expired' | 'pending'
}

export default function ReceptionInsurancePage() {
  const router = useRouter()
  const [insurances, setInsurances] = useState<InsuranceInfo[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'expired' | 'pending'>('all')

  useEffect(() => {
    loadInsurances()
  }, [])

  const loadInsurances = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/insurance')
      const data = await res.json()
      if (data.success) {
        setInsurances(data.data || [])
      }
    } catch (error) {
      console.error('Error loading insurances:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredInsurances = insurances.filter((insurance) => {
    const matchesSearch =
      !searchTerm ||
      insurance.patient_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      insurance.insurance_number?.includes(searchTerm) ||
      insurance.insurance_provider?.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStatus = filterStatus === 'all' || insurance.status === filterStatus

    return matchesSearch && matchesStatus
  })

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle size={18} className="text-green-500" />
      case 'expired':
        return <XCircle size={18} className="text-red-500" />
      case 'pending':
        return <Clock size={18} className="text-yellow-500" />
      default:
        return <AlertCircle size={18} className="text-gray-400" />
    }
  }

  if (loading) {
    return (
      <div className="p-8">
        <div className="text-center text-gray-500">جاري تحميل معلومات التأمين...</div>
      </div>
    )
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-extrabold text-gray-900 mb-2">إدارة التأمين</h1>
            <p className="text-gray-500 text-lg">عرض وإدارة معلومات التأمين للمرضى</p>
          </div>
          <button
            onClick={() => router.push('/dashboard/reception/insurance/new')}
            className="flex items-center gap-2 bg-primary text-white px-6 py-3 rounded-xl hover:bg-primary-dark transition-colors"
          >
            <Plus size={20} />
            إضافة تأمين
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search size={20} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="ابحث في التأمين..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pr-10 pl-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>

          <div className="flex gap-2">
            {(['all', 'active', 'expired', 'pending'] as const).map((status) => (
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
                {status === 'expired' && 'منتهي'}
                {status === 'pending' && 'قيد الانتظار'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Insurance List */}
      {filteredInsurances.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
          <Shield size={48} className="mx-auto text-gray-400 mb-4" />
          <div className="text-gray-500 text-lg mb-2">لا توجد معلومات تأمين</div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredInsurances.map((insurance) => (
            <div
              key={insurance.id}
              className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    {getStatusIcon(insurance.status)}
                    <h3 className="text-lg font-bold text-gray-900">{insurance.patient_name}</h3>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="text-gray-500">شركة التأمين:</span>
                      <span className="font-medium text-gray-900 mr-2">{insurance.insurance_provider}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">رقم التأمين:</span>
                      <span className="font-medium text-gray-900 mr-2">{insurance.insurance_number}</span>
                    </div>
                    {insurance.policy_number && (
                      <div>
                        <span className="text-gray-500">رقم البوليصة:</span>
                        <span className="font-medium text-gray-900 mr-2">{insurance.policy_number}</span>
                      </div>
                    )}
                    {insurance.coverage_percentage && (
                      <div>
                        <span className="text-gray-500">نسبة التغطية:</span>
                        <span className="font-medium text-gray-900 mr-2">{insurance.coverage_percentage}%</span>
                      </div>
                    )}
                    {insurance.effective_date && (
                      <div>
                        <span className="text-gray-500">من:</span>
                        <span className="font-medium text-gray-900 mr-2">
                          {new Date(insurance.effective_date).toLocaleDateString('ar-SA')}
                        </span>
                      </div>
                    )}
                    {insurance.expiry_date && (
                      <div>
                        <span className="text-gray-500">إلى:</span>
                        <span className="font-medium text-gray-900 mr-2">
                          {new Date(insurance.expiry_date).toLocaleDateString('ar-SA')}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                  insurance.status === 'active'
                    ? 'bg-green-100 text-green-700'
                    : insurance.status === 'expired'
                    ? 'bg-red-100 text-red-700'
                    : 'bg-yellow-100 text-yellow-700'
                }`}>
                  {insurance.status === 'active' ? 'نشط' : insurance.status === 'expired' ? 'منتهي' : 'قيد الانتظار'}
                </span>
              </div>

              <div className="flex gap-2 pt-4 border-t border-gray-100">
                <button
                  onClick={() => router.push(`/dashboard/reception/patients/${insurance.patient_id}`)}
                  className="flex-1 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition-colors"
                >
                  عرض الملف
                </button>
                <button
                  onClick={() => router.push(`/dashboard/reception/insurance/${insurance.id}/edit`)}
                  className="px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-lg text-sm font-medium transition-colors"
                >
                  تعديل
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
