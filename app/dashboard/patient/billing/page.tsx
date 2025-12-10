'use client'

/**
 * Patient Billing Page
 * View invoices and payment history
 */

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'
import { DollarSign, Calendar, Download, CheckCircle, Clock, AlertCircle, Search } from 'lucide-react'

interface Invoice {
  id: string
  invoice_number: string
  date: string
  due_date?: string
  amount: number
  status: 'paid' | 'pending' | 'overdue'
  services: Array<{
    name: string
    quantity: number
    price: number
  }>
  payment_method?: string
  paid_date?: string
}

export default function PatientBillingPage() {
  const router = useRouter()
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState<'all' | 'paid' | 'pending' | 'overdue'>('all')

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const loadInvoices = useCallback(async () => {
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

        const invoicesRes = await fetch(`/api/patients/${patientInfo.id}/invoices`)
        const invoicesData = await invoicesRes.json()
        if (invoicesData.success) {
          setInvoices(invoicesData.data || [])
        }
      }
    } catch (error) {
      console.error('Error loading invoices:', error)
    } finally {
      setLoading(false)
    }
  }, [supabase, router])

  useEffect(() => {
    loadInvoices()
  }, [loadInvoices])

  const filteredInvoices = invoices.filter((invoice) => {
    const matchesSearch =
      !searchTerm ||
      invoice.invoice_number?.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStatus = filterStatus === 'all' || invoice.status === filterStatus

    return matchesSearch && matchesStatus
  })

  const totalPaid = invoices.filter((i) => i.status === 'paid').reduce((sum, i) => sum + i.amount, 0)
  const totalPending = invoices.filter((i) => i.status === 'pending').reduce((sum, i) => sum + i.amount, 0)
  const totalOverdue = invoices.filter((i) => i.status === 'overdue').reduce((sum, i) => sum + i.amount, 0)

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paid':
        return <CheckCircle size={18} className="text-green-500" />
      case 'pending':
        return <Clock size={18} className="text-yellow-500" />
      case 'overdue':
        return <AlertCircle size={18} className="text-red-500" />
      default:
        return <AlertCircle size={18} className="text-gray-400" />
    }
  }

  if (loading) {
    return (
      <div className="p-8">
        <div className="text-center text-gray-500">جاري تحميل الفواتير...</div>
      </div>
    )
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-extrabold text-gray-900 mb-2">الفواتير والمدفوعات</h1>
        <p className="text-gray-500 text-lg">عرض الفواتير وسجل المدفوعات</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-xl bg-green-100 text-green-600">
              <CheckCircle size={24} />
            </div>
          </div>
          <div className="text-3xl font-bold text-gray-900 mb-1">{totalPaid.toFixed(2)} ر.س</div>
          <div className="text-sm text-gray-500">المدفوع</div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-xl bg-yellow-100 text-yellow-600">
              <Clock size={24} />
            </div>
          </div>
          <div className="text-3xl font-bold text-gray-900 mb-1">{totalPending.toFixed(2)} ر.س</div>
          <div className="text-sm text-gray-500">قيد الانتظار</div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-xl bg-red-100 text-red-600">
              <AlertCircle size={24} />
            </div>
          </div>
          <div className="text-3xl font-bold text-gray-900 mb-1">{totalOverdue.toFixed(2)} ر.س</div>
          <div className="text-sm text-gray-500">متأخر</div>
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
                placeholder="ابحث في الفواتير..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pr-10 pl-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>

          <div className="flex gap-2">
            {(['all', 'paid', 'pending', 'overdue'] as const).map((status) => (
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
                {status === 'paid' && 'مدفوعة'}
                {status === 'pending' && 'قيد الانتظار'}
                {status === 'overdue' && 'متأخرة'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Invoices List */}
      {filteredInvoices.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
          <DollarSign size={48} className="mx-auto text-gray-400 mb-4" />
          <div className="text-gray-500 text-lg mb-2">لا توجد فواتير</div>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredInvoices.map((invoice) => (
            <div
              key={invoice.id}
              className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    {getStatusIcon(invoice.status)}
                    <h3 className="text-xl font-bold text-gray-900">
                      فاتورة رقم: {invoice.invoice_number}
                    </h3>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      invoice.status === 'paid'
                        ? 'bg-green-100 text-green-700'
                        : invoice.status === 'pending'
                        ? 'bg-yellow-100 text-yellow-700'
                        : 'bg-red-100 text-red-700'
                    }`}>
                      {invoice.status === 'paid' ? 'مدفوعة' : invoice.status === 'pending' ? 'قيد الانتظار' : 'متأخرة'}
                    </span>
                  </div>

                  <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
                    <div className="flex items-center gap-2">
                      <Calendar size={16} className="text-gray-400" />
                      <span>التاريخ: {new Date(invoice.date).toLocaleDateString('ar-SA')}</span>
                    </div>
                    {invoice.due_date && (
                      <div className="flex items-center gap-2">
                        <Calendar size={16} className="text-gray-400" />
                        <span>الاستحقاق: {new Date(invoice.due_date).toLocaleDateString('ar-SA')}</span>
                      </div>
                    )}
                    {invoice.paid_date && (
                      <div className="flex items-center gap-2">
                        <CheckCircle size={16} className="text-green-500" />
                        <span>دفعت في: {new Date(invoice.paid_date).toLocaleDateString('ar-SA')}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="text-left ml-4">
                  <div className="text-2xl font-bold text-gray-900">{invoice.amount.toFixed(2)} ر.س</div>
                  {invoice.payment_method && (
                    <div className="text-sm text-gray-500">طريقة الدفع: {invoice.payment_method}</div>
                  )}
                </div>
              </div>

              {/* Services */}
              {invoice.services && invoice.services.length > 0 && (
                <div className="bg-gray-50 rounded-lg p-4 mb-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-3">الخدمات:</h4>
                  <div className="space-y-2">
                    {invoice.services.map((service, index) => (
                      <div key={index} className="flex items-center justify-between text-sm">
                        <div>
                          <div className="font-medium text-gray-900">{service.name}</div>
                          <div className="text-gray-600">
                            {service.quantity} × {service.price.toFixed(2)} ر.س
                          </div>
                        </div>
                        <div className="font-medium text-gray-900">
                          {(service.quantity * service.price).toFixed(2)} ر.س
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex justify-end">
                <button
                  onClick={() => {
                    // TODO: Implement invoice download
                    console.log('Download invoice:', invoice.id)
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm text-gray-700 transition-colors"
                >
                  <Download size={16} />
                  تحميل الفاتورة
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
